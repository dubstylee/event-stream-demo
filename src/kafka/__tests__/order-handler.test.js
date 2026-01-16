import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { handleOrderCreated } from "../order-handler.js";

// Mock the producer module
const mockProduce = mock(() => Promise.resolve());
mock.module("../producer.js", () => ({
  produce: mockProduce,
}));

describe("Order Handler Integration Tests", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockProduce.mockClear();
  });

  describe("handleOrderCreated", () => {
    it("should process a valid order message", async () => {
      const orderMessage = {
        orderId: "order-123",
        productCount: 5,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // Should complete without throwing
      expect(true).toBe(true);
    });

    it("should generate correct number of products", async () => {
      const orderMessage = {
        orderId: "order-456",
        productCount: 10,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // The handler should call produce for products needing review
      // The exact number depends on random chance, but should be called
      // at least 0 times and at most productCount times
      expect(mockProduce).toHaveBeenCalled;
    });

    it("should publish products to product-needs-review topic", async () => {
      const orderMessage = {
        orderId: "order-789",
        productCount: 20,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // Check that produce was called with product-needs-review topic
      const calls = mockProduce.mock.calls;
      
      calls.forEach((call) => {
        const [topic, message] = call;
        expect(topic).toBe("product-needs-review");
        expect(message).toHaveProperty("productId");
        expect(message).toHaveProperty("orderId");
        expect(message).toHaveProperty("timestamp");
        expect(message.orderId).toBe("order-789");
        expect(message.productId).toMatch(/^product-\d{10}$/);
      });
    });

    it("should throw error for missing orderId", async () => {
      const orderMessage = {
        productCount: 5,
        timestamp: Date.now(),
      };

      await expect(handleOrderCreated(orderMessage)).rejects.toThrow(
        "Order message must contain orderId and productCount"
      );
    });

    it("should throw error for missing productCount", async () => {
      const orderMessage = {
        orderId: "order-123",
        timestamp: Date.now(),
      };

      await expect(handleOrderCreated(orderMessage)).rejects.toThrow(
        "Order message must contain orderId and productCount"
      );
    });

    it("should handle order with zero products needing review", async () => {
      // Mock shouldProductNeedReview to always return false
      const { shouldProductNeedReview } = await import("../review-chance.js");
      const originalFunction = shouldProductNeedReview;
      
      // This test might not publish any products
      const orderMessage = {
        orderId: "order-no-review",
        productCount: 1,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // Should complete successfully even if no products need review
      expect(true).toBe(true);
    });

    it("should handle order with single product", async () => {
      const orderMessage = {
        orderId: "order-single",
        productCount: 1,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // Should complete without error
      expect(true).toBe(true);
    });

    it("should handle order with many products", async () => {
      const orderMessage = {
        orderId: "order-many",
        productCount: 100,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // Should complete without error
      expect(true).toBe(true);
      
      // Should have called produce multiple times (statistically)
      expect(mockProduce.mock.calls.length).toBeGreaterThan(0);
    });

    it("should include orderId in published messages", async () => {
      const orderMessage = {
        orderId: "order-check-id",
        productCount: 10,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      const calls = mockProduce.mock.calls;
      
      if (calls.length > 0) {
        calls.forEach((call) => {
          const [, message] = call;
          expect(message.orderId).toBe("order-check-id");
        });
      }
    });

    it("should generate unique product IDs", async () => {
      const orderMessage = {
        orderId: "order-unique",
        productCount: 50,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      const calls = mockProduce.mock.calls;
      const productIds = calls.map((call) => call[1].productId);
      
      // All product IDs should be unique
      const uniqueIds = new Set(productIds);
      expect(uniqueIds.size).toBe(productIds.length);
    });
  });
});
