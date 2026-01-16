/**
 * Express API with WebSocket Integration
 *
 * This server provides HTTP API endpoints and Socket.io WebSocket connections
 * for real-time Kafka message streaming to browser clients.
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
const configPath = join(__dirname, "server", "config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));

console.log("Starting server...");
console.log("Configuration loaded:", {
  port: config.port,
  kafkaInitTimeout: config.kafka.initTimeout,
  shutdownTimeout: config.shutdown.timeout,
});

// Import Kafka module
import {
  waitForInitialization,
  onMessage,
  produce,
  getConnectionStatus,
  disconnect as disconnectKafka,
} from "./kafka/index.js";

// Configure CORS to allow all localhost origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow all localhost origins
    if (origin.startsWith("http://localhost:")) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: config.cors.credentials,
};

// Valid Kafka topics
const VALID_TOPICS = [
  "order-created",
  "product-needs-review",
  "product-matched",
  "import-requested",
];

/**
 * Sends a standardized error response
 * @param {express.Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code
 */
function sendError(res, statusCode, message, code) {
  res.status(statusCode).json({
    error: message,
    code: code,
  });
}

/**
 * Creates and configures the Express application with routes
 * @returns {express.Application} Configured Express app
 */
function createApp() {
  const app = express();

  // Add JSON body parser middleware
  app.use(express.json());

  // Add CORS middleware
  app.use(cors(corsOptions));

  // GROUP 3: HTTP API Endpoints

  /**
   * Health check endpoint
   * GET /api/health
   * Returns: {status: "ok"}
   */
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  /**
   * Kafka connection status endpoint
   * GET /api/kafka/status
   * Returns: {status, timestamp, error?}
   */
  app.get("/api/kafka/status", (req, res) => {
    const status = getConnectionStatus();
    res.json(status);
  });

  /**
   * Produce message to Kafka endpoint
   * POST /api/kafka/produce
   * Body: {topic: string, message: object}
   * Returns: {success: true} or error
   */
  app.post("/api/kafka/produce", async (req, res) => {
    try {
      // Validate request body
      const { topic, message } = req.body;

      // Validate topic field
      if (!topic || typeof topic !== "string" || topic.trim() === "") {
        return sendError(
          res,
          400,
          "Topic is required and must be a non-empty string",
          "INVALID_REQUEST"
        );
      }

      // Validate message field
      if (!message || typeof message !== "object" || Array.isArray(message)) {
        return sendError(
          res,
          400,
          "Message is required and must be an object",
          "INVALID_REQUEST"
        );
      }

      // Produce to Kafka
      await produce(topic, message);

      // Success response
      res.json({ success: true });
    } catch (error) {
      console.error("Error producing message:", error.message);
      sendError(
        res,
        503,
        `Failed to produce message: ${error.message}`,
        "KAFKA_UNAVAILABLE"
      );
    }
  });

  return app;
}

/**
 * Sets up Socket.io with room management and event handlers
 * @param {Server} io - Socket.io server instance
 */
function setupSocketIO(io) {
  // GROUP 4: Socket.io Setup

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Auto-join all topic rooms
    VALID_TOPICS.forEach((topic) => {
      socket.join(topic);
    });

    // Handle subscribe:topic event
    socket.on("subscribe:topic", (data) => {
      const { topic } = data || {};

      if (!topic || !VALID_TOPICS.includes(topic)) {
        socket.emit("error", {
          message: "Invalid topic",
          code: "INVALID_TOPIC",
        });
        return;
      }

      socket.join(topic);
      console.log(`Client ${socket.id} subscribed to ${topic}`);

      // Send acknowledgment
      socket.emit("subscribed", { topic });
    });

    // Handle unsubscribe:topic event
    socket.on("unsubscribe:topic", (data) => {
      const { topic } = data || {};

      if (!topic || !VALID_TOPICS.includes(topic)) {
        socket.emit("error", {
          message: "Invalid topic",
          code: "INVALID_TOPIC",
        });
        return;
      }

      socket.leave(topic);
      console.log(`Client ${socket.id} unsubscribed from ${topic}`);

      // Send acknowledgment
      socket.emit("unsubscribed", { topic });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Sets up Kafka-to-Socket.io message bridge
 * @param {Server} io - Socket.io server instance
 */
function setupKafkaBridge(io) {
  // GROUP 5: Kafka-to-Socket.io Bridge

  onMessage((kafkaPayload) => {
    const { topic, message, partition, offset } = kafkaPayload;

    // Add server timestamp
    const payload = {
      topic,
      message,
      partition,
      offset,
      timestamp: Date.now(),
    };

    // Emit to topic-specific room only
    io.to(topic).emit("kafka:message", payload);

    // Note: Individual messages not logged (too verbose)
  });
}

/**
 * Main server initialization and startup
 */
async function startServer() {
  try {
    // Wait for Kafka consumers to initialize with timeout
    console.log("Waiting for Kafka initialization...");

    const initPromise = waitForInitialization();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Kafka initialization timeout")),
        config.kafka.initTimeout
      );
    });

    await Promise.race([initPromise, timeoutPromise]);
    console.log("Kafka consumers ready");

    // Create Express app with routes
    const app = createApp();

    // Create HTTP server
    const server = createServer(app);

    // Set up Socket.io
    const io = new Server(server, {
      cors: corsOptions,
    });

    // Set up Socket.io event handlers
    setupSocketIO(io);

    // Set up Kafka-to-Socket.io bridge
    setupKafkaBridge(io);

    // Start HTTP server
    server.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
      const clientCount = io.sockets.sockets.size;
      console.log(`Server ready - ${clientCount} clients connected`);
    });

    // Store references for shutdown
    global.server = server;
    global.io = io;
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * GROUP 6: Server Startup and Lifecycle
 */
const shutdown = async () => {
  console.log("Shutting down gracefully...");

  try {
    // Create timeout for shutdown process
    const shutdownTimeout = setTimeout(() => {
      console.warn("Shutdown timeout reached, forcing exit");
      process.exit(0);
    }, config.shutdown.timeout);

    // Shutdown sequence
    if (global.server) {
      // 1. Close HTTP server (stop accepting new connections)
      await new Promise((resolve) => {
        global.server.close(() => {
          console.log("HTTP server closed");
          resolve();
        });
      });

      // 2. Emit disconnect event to all Socket.io clients
      if (global.io) {
        global.io.emit("disconnect");
        console.log("Disconnect event sent to all clients");

        // 3. Close Socket.io connections
        global.io.close(() => {
          console.log("Socket.io connections closed");
        });
      }
    }

    // 4. Disconnect from Kafka
    await disconnectKafka();
    console.log("Kafka disconnected");

    // Clear timeout if we completed successfully
    clearTimeout(shutdownTimeout);

    console.log("Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the server
startServer();
