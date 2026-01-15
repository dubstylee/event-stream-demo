import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock producer
const mockProduce = vi.fn();
const mockDisconnectProducer = vi.fn();
vi.mock("../producer.js", () => ({
  produce: mockProduce,
  disconnectProducer: mockDisconnectProducer,
}));

// Mock consumer
const mockKafkaEvents = {
  on: vi.fn(),
  emit: vi.fn(),
  removeListener: vi.fn(),
};
const mockInitializeConsumers = vi.fn();
const mockDisconnectConsumers = vi.fn();
vi.mock("../consumer.js", () => ({
  kafkaEvents: mockKafkaEvents,
  initializeConsumers: mockInitializeConsumers,
  disconnectConsumers: mockDisconnectConsumers,
}));

// Mock client
const mockGetConnectionStatus = vi.fn();
const mockDisconnectClient = vi.fn();
vi.mock("../client.js", () => ({
  getConnectionStatus: mockGetConnectionStatus,
  disconnect: mockDisconnectClient,
}));

describe("Kafka Public API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock implementations
    mockProduce.mockResolvedValue(undefined);
    mockDisconnectProducer.mockResolvedValue(undefined);
    mockInitializeConsumers.mockResolvedValue(undefined);
    mockDisconnectConsumers.mockResolvedValue(undefined);
    mockDisconnectClient.mockResolvedValue(undefined);
    mockGetConnectionStatus.mockReturnValue({
      status: "connected",
      timestamp: Date.now(),
      error: null,
    });
    
    // Spy on console
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module initialization", () => {
    it("should auto-initialize consumers on module import", async () => {
      // Import the module (which triggers initialization)
      await import("../index.js?init=1");
      
      // Wait a bit for async initialization
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      expect(mockInitializeConsumers).toHaveBeenCalled();
    });

    it("should log successful initialization", async () => {
      mockInitializeConsumers.mockResolvedValueOnce(undefined);
      
      // Import module
      await import("../index.js?init=2");
      
      // Wait for initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      expect(console.log).toHaveBeenCalledWith(
        "[Kafka] Consumers initialized successfully"
      );
    });

    it("should handle initialization errors gracefully", async () => {
      mockInitializeConsumers.mockRejectedValueOnce(new Error("Init failed"));
      
      // Import module
      await import("../index.js?init=3");
      
      // Wait for initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      expect(console.error).toHaveBeenCalledWith(
        "[Kafka] Failed to initialize consumers:",
        "Init failed"
      );
    });
  });

  describe("exported functions", () => {
    it("should export produce function", async () => {
      const kafka = await import("../index.js");
      
      expect(kafka.produce).toBeDefined();
      expect(typeof kafka.produce).toBe("function");
    });

    it("should export kafkaEvents", async () => {
      const kafka = await import("../index.js");
      
      expect(kafka.kafkaEvents).toBeDefined();
      expect(kafka.kafkaEvents).toBe(mockKafkaEvents);
    });

    it("should export getConnectionStatus", async () => {
      const kafka = await import("../index.js");
      
      expect(kafka.getConnectionStatus).toBeDefined();
      expect(typeof kafka.getConnectionStatus).toBe("function");
    });

    it("should export disconnect function", async () => {
      const kafka = await import("../index.js");
      
      expect(kafka.disconnect).toBeDefined();
      expect(typeof kafka.disconnect).toBe("function");
    });

    it("should export onMessage convenience function", async () => {
      const kafka = await import("../index.js");
      
      expect(kafka.onMessage).toBeDefined();
      expect(typeof kafka.onMessage).toBe("function");
    });

    it("should export onConnectionChange convenience function", async () => {
      const kafka = await import("../index.js");
      
      expect(kafka.onConnectionChange).toBeDefined();
      expect(typeof kafka.onConnectionChange).toBe("function");
    });
  });

  describe("disconnect", () => {
    it("should call all disconnect functions in correct order", async () => {
      const kafka = await import("../index.js");
      
      await kafka.disconnect();
      
      expect(mockDisconnectProducer).toHaveBeenCalled();
      expect(mockDisconnectConsumers).toHaveBeenCalled();
      expect(mockDisconnectClient).toHaveBeenCalled();
      
      // Verify order: producer before consumers before client
      const producerCallOrder = mockDisconnectProducer.mock.invocationCallOrder[0];
      const consumerCallOrder = mockDisconnectConsumers.mock.invocationCallOrder[0];
      const clientCallOrder = mockDisconnectClient.mock.invocationCallOrder[0];
      
      expect(producerCallOrder).toBeLessThan(consumerCallOrder);
      expect(consumerCallOrder).toBeLessThan(clientCallOrder);
    });

    it("should wait for initialization before disconnecting", async () => {
      let initResolve;
      const initPromise = new Promise((resolve) => {
        initResolve = resolve;
      });
      mockInitializeConsumers.mockReturnValue(initPromise);
      
      const kafka = await import("../index.js?wait=1");
      
      // Start disconnect (should wait for init)
      const disconnectPromise = kafka.disconnect();
      
      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      // Disconnect functions should not be called yet
      expect(mockDisconnectProducer).not.toHaveBeenCalled();
      
      // Resolve initialization
      initResolve();
      await disconnectPromise;
      
      // Now disconnect should have been called
      expect(mockDisconnectProducer).toHaveBeenCalled();
    });

    it("should handle disconnect errors", async () => {
      mockDisconnectProducer.mockRejectedValueOnce(new Error("Disconnect failed"));
      
      const kafka = await import("../index.js");
      
      await expect(kafka.disconnect()).rejects.toThrow("Disconnect failed");
      
      expect(console.error).toHaveBeenCalledWith(
        "[Kafka] Error during disconnect:",
        "Disconnect failed"
      );
    });

    it("should log successful disconnect", async () => {
      const kafka = await import("../index.js");
      
      await kafka.disconnect();
      
      expect(console.log).toHaveBeenCalledWith(
        "[Kafka] All connections disconnected successfully"
      );
    });
  });

  describe("onMessage convenience method", () => {
    it("should register handler for kafka:message event", async () => {
      const kafka = await import("../index.js");
      const handler = vi.fn();
      
      kafka.onMessage(handler);
      
      expect(mockKafkaEvents.on).toHaveBeenCalledWith("kafka:message", handler);
    });

    it("should allow multiple handlers", async () => {
      const kafka = await import("../index.js");
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      kafka.onMessage(handler1);
      kafka.onMessage(handler2);
      
      expect(mockKafkaEvents.on).toHaveBeenCalledTimes(2);
    });
  });

  describe("onConnectionChange convenience method", () => {
    it("should register handlers for all connection events", async () => {
      const kafka = await import("../index.js");
      const handler = vi.fn();
      
      kafka.onConnectionChange(handler);
      
      expect(mockKafkaEvents.on).toHaveBeenCalledWith("kafka:connected", handler);
      expect(mockKafkaEvents.on).toHaveBeenCalledWith("kafka:disconnected", handler);
      expect(mockKafkaEvents.on).toHaveBeenCalledWith("kafka:error", handler);
    });
  });

  describe("waitForInitialization", () => {
    it("should wait for initialization to complete", async () => {
      let initResolve;
      const initPromise = new Promise((resolve) => {
        initResolve = resolve;
      });
      mockInitializeConsumers.mockReturnValue(initPromise);
      
      const kafka = await import("../index.js?waitinit=1");
      
      let initialized = false;
      const waitPromise = kafka.waitForInitialization().then(() => {
        initialized = true;
      });
      
      // Should not be initialized yet
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(initialized).toBe(false);
      
      // Resolve initialization
      initResolve();
      await waitPromise;
      
      expect(initialized).toBe(true);
    });
  });

  describe("integration", () => {
    it("should provide a complete public API surface", async () => {
      const kafka = await import("../index.js");
      
      // Check all expected exports
      expect(kafka).toHaveProperty("produce");
      expect(kafka).toHaveProperty("kafkaEvents");
      expect(kafka).toHaveProperty("getConnectionStatus");
      expect(kafka).toHaveProperty("disconnect");
      expect(kafka).toHaveProperty("onMessage");
      expect(kafka).toHaveProperty("onConnectionChange");
      expect(kafka).toHaveProperty("waitForInitialization");
    });
  });
});
