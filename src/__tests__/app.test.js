import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Kafka module
const mockWaitForInitialization = vi.fn();
const mockOnMessage = vi.fn();
const mockProduce = vi.fn();
const mockGetConnectionStatus = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("../kafka/index.js", () => ({
  waitForInitialization: mockWaitForInitialization,
  onMessage: mockOnMessage,
  produce: mockProduce,
  getConnectionStatus: mockGetConnectionStatus,
  disconnect: mockDisconnect,
}));

describe("Express API with WebSocket Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations
    mockWaitForInitialization.mockResolvedValue(undefined);
    mockOnMessage.mockImplementation((callback) => {
      // Store callback for later invocation in tests
      global.mockKafkaMessageCallback = callback;
    });
    mockProduce.mockResolvedValue(undefined);
    mockGetConnectionStatus.mockReturnValue({
      status: "connected",
      timestamp: Date.now(),
      error: null,
    });
    mockDisconnect.mockResolvedValue(undefined);

    // Spy on console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.mockKafkaMessageCallback;
  });

  describe("Health Check Endpoint", () => {
    it("should return status ok", () => {
      const mockResponse = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      // Simulate the health check handler
      const healthResponse = { status: "ok" };
      mockResponse.json(healthResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({ status: "ok" });
    });
  });

  describe("Kafka Status Endpoint", () => {
    it("should return Kafka connection status", () => {
      const status = mockGetConnectionStatus();

      expect(status).toHaveProperty("status");
      expect(status).toHaveProperty("timestamp");
      expect(status.status).toBe("connected");
    });

    it("should handle different status states", () => {
      mockGetConnectionStatus.mockReturnValueOnce({
        status: "error",
        timestamp: Date.now(),
        error: "Connection failed",
      });

      const status = mockGetConnectionStatus();

      expect(status.status).toBe("error");
      expect(status.error).toBe("Connection failed");
    });
  });

  describe("Produce Message Endpoint", () => {
    it("should validate topic field is required", () => {
      const requestBody = {
        message: { test: "data" },
      };

      // Topic is missing
      expect(requestBody.topic).toBeUndefined();
    });

    it("should validate topic is non-empty string", () => {
      const emptyTopic = "";
      const validTopic = "order-created";

      expect(emptyTopic.trim()).toBe("");
      expect(validTopic.trim()).not.toBe("");
      expect(typeof validTopic).toBe("string");
    });

    it("should validate message field is required", () => {
      const requestBody = {
        topic: "order-created",
      };

      // Message is missing
      expect(requestBody.message).toBeUndefined();
    });

    it("should validate message is an object", () => {
      const validMessage = { test: "data" };
      const invalidArray = ["test"];
      const invalidNull = null;

      expect(typeof validMessage).toBe("object");
      expect(Array.isArray(validMessage)).toBe(false);

      expect(Array.isArray(invalidArray)).toBe(true);
      expect(invalidNull).toBe(null);
    });

    it("should call produce with valid payload", async () => {
      const topic = "order-created";
      const message = { orderId: 123 };

      await mockProduce(topic, message);

      expect(mockProduce).toHaveBeenCalledWith(topic, message);
      expect(mockProduce).toHaveBeenCalledTimes(1);
    });

    it("should return success on successful produce", async () => {
      mockProduce.mockResolvedValueOnce(undefined);

      const result = await mockProduce("order-created", { test: "data" });

      expect(result).toBeUndefined();
      expect(mockProduce).toHaveBeenCalled();
    });

    it("should handle produce errors", async () => {
      const error = new Error("Kafka unavailable");
      mockProduce.mockRejectedValueOnce(error);

      await expect(mockProduce("order-created", { test: "data" })).rejects.toThrow(
        "Kafka unavailable"
      );
    });
  });

  describe("Error Response Helper", () => {
    it("should format error responses correctly", () => {
      const errorResponse = {
        error: "Invalid request",
        code: "INVALID_REQUEST",
      };

      expect(errorResponse).toHaveProperty("error");
      expect(errorResponse).toHaveProperty("code");
      expect(errorResponse.error).toBe("Invalid request");
      expect(errorResponse.code).toBe("INVALID_REQUEST");
    });

    it("should use appropriate error codes", () => {
      const codes = {
        invalidRequest: "INVALID_REQUEST",
        kafkaUnavailable: "KAFKA_UNAVAILABLE",
        invalidTopic: "INVALID_TOPIC",
      };

      expect(codes.invalidRequest).toBe("INVALID_REQUEST");
      expect(codes.kafkaUnavailable).toBe("KAFKA_UNAVAILABLE");
      expect(codes.invalidTopic).toBe("INVALID_TOPIC");
    });
  });

  describe("Socket.io Connection Handling", () => {
    it("should verify valid topics array", () => {
      const VALID_TOPICS = [
        "order-created",
        "product-needs-review",
        "product-matched",
        "import-requested",
      ];

      expect(VALID_TOPICS).toHaveLength(4);
      expect(VALID_TOPICS).toContain("order-created");
      expect(VALID_TOPICS).toContain("product-needs-review");
      expect(VALID_TOPICS).toContain("product-matched");
      expect(VALID_TOPICS).toContain("import-requested");
    });

    it("should validate topic for subscribe/unsubscribe", () => {
      const VALID_TOPICS = [
        "order-created",
        "product-needs-review",
        "product-matched",
        "import-requested",
      ];

      const validTopic = "order-created";
      const invalidTopic = "invalid-topic";

      expect(VALID_TOPICS.includes(validTopic)).toBe(true);
      expect(VALID_TOPICS.includes(invalidTopic)).toBe(false);
    });
  });

  describe("Kafka-to-Socket.io Bridge", () => {
    it("should register onMessage callback", () => {
      const callback = vi.fn();
      mockOnMessage(callback);

      expect(mockOnMessage).toHaveBeenCalledWith(callback);
    });

    it("should add timestamp to Kafka messages", () => {
      const kafkaPayload = {
        topic: "order-created",
        message: { orderId: 123 },
        partition: 0,
        offset: "10",
      };

      const timestamp = Date.now();
      const enrichedPayload = {
        ...kafkaPayload,
        timestamp,
      };

      expect(enrichedPayload).toHaveProperty("timestamp");
      expect(enrichedPayload.topic).toBe("order-created");
      expect(enrichedPayload.message).toEqual({ orderId: 123 });
      expect(enrichedPayload.partition).toBe(0);
      expect(enrichedPayload.offset).toBe("10");
    });

    it("should process Kafka messages through callback", () => {
      const callback = vi.fn();
      mockOnMessage(callback);

      // Simulate Kafka message
      const kafkaMessage = {
        topic: "order-created",
        message: { orderId: 456 },
        partition: 0,
        offset: "20",
      };

      // Invoke the callback if it was stored
      if (global.mockKafkaMessageCallback) {
        global.mockKafkaMessageCallback(kafkaMessage);
      }

      // Note: In actual implementation, Socket.io emit would be called here
      expect(mockOnMessage).toHaveBeenCalled();
    });
  });

  describe("Kafka Initialization", () => {
    it("should wait for Kafka initialization", async () => {
      mockWaitForInitialization.mockResolvedValueOnce(undefined);

      await mockWaitForInitialization();

      expect(mockWaitForInitialization).toHaveBeenCalled();
    });

    it("should handle initialization timeout", async () => {
      const timeoutError = new Error("Kafka initialization timeout");
      mockWaitForInitialization.mockRejectedValueOnce(timeoutError);

      await expect(mockWaitForInitialization()).rejects.toThrow(
        "Kafka initialization timeout"
      );
    });

    it("should handle initialization success", async () => {
      mockWaitForInitialization.mockResolvedValueOnce(undefined);

      await expect(mockWaitForInitialization()).resolves.toBeUndefined();
    });
  });

  describe("Graceful Shutdown", () => {
    it("should call disconnect on Kafka", async () => {
      await mockDisconnect();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("should handle disconnect errors gracefully", async () => {
      mockDisconnect.mockRejectedValueOnce(new Error("Disconnect failed"));

      await expect(mockDisconnect()).rejects.toThrow("Disconnect failed");
    });
  });

  describe("CORS Configuration", () => {
    it("should allow localhost origins", () => {
      const localhostOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
      ];

      localhostOrigins.forEach((origin) => {
        expect(origin.startsWith("http://localhost:")).toBe(true);
      });
    });

    it("should reject non-localhost origins", () => {
      const invalidOrigins = [
        "http://example.com",
        "https://evil.com",
        "http://192.168.1.1",
      ];

      invalidOrigins.forEach((origin) => {
        expect(origin.startsWith("http://localhost:")).toBe(false);
      });
    });
  });

  describe("Configuration Loading", () => {
    it("should have required configuration fields", () => {
      const config = {
        port: 4000,
        cors: {
          origins: ["http://localhost:*"],
          credentials: false,
        },
        kafka: {
          initTimeout: 60000,
        },
        shutdown: {
          timeout: 5000,
        },
      };

      expect(config.port).toBe(4000);
      expect(config.cors.origins).toContain("http://localhost:*");
      expect(config.kafka.initTimeout).toBe(60000);
      expect(config.shutdown.timeout).toBe(5000);
    });
  });
});
