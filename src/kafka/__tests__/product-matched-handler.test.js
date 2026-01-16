import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock the producer module BEFORE importing the handler
const mockProduce = mock(() => Promise.resolve());
mock.module("../producer.js", () => ({
  produce: mockProduce,
}));

import { handleProductMatched } from "../product-matched-handler.js";
import {
  initializeOrder,
  addPendingProduct,
  getOrderState,
  _resetState,
} from "../order-tracker.js";

describe("Product Matched Handler Tests", () => {
  beforeEach(() => {
    // Reset state and mocks before each test
    _resetState();
    mockProduce.mockClear();
  });

  describe("handleProductMatched", () => {
    it("should remove pending product and increment successfulCount", async () => {
      // Setup: Create order with pending product
      initializeOrder("order-123", 3);
      addPendingProduct("order-123", "product-abc");
      addPendingProduct("order-123", "product-def");

      const matchedMessage = {
        productId: "product-abc",
        orderId: "order-123",
        timestamp: Date.now(),
      };

      await handleProductMatched(matchedMessage);

      // Verify pending product removed and successful count incremented
      const state = getOrderState("order-123");
      expect(state.pendingProductIds).not.toContain("product-abc");
      expect(state.pendingProductIds).toContain("product-def");
      expect(state.successfulCount).toBe(1);
    });

    it("should publish import-requested when order is complete (pendingProductIds empty)", async () => {
      // Setup: Create order with one pending product
      initializeOrder("order-456", 2);
      addPendingProduct("order-456", "product-xyz");

      const matchedMessage = {
        productId: "product-xyz",
        orderId: "order-456",
        timestamp: Date.now(),
      };

      await handleProductMatched(matchedMessage);

      // Verify import-requested was published
      expect(mockProduce).toHaveBeenCalledTimes(1);
      const [topic, message] = mockProduce.mock.calls[0];
      expect(topic).toBe("import-requested");
      expect(message.orderId).toBe("order-456");
    });

    it("should include correct message structure in import-requested (orderId, timestamp, totalProducts, successfulCount)", async () => {
      // Setup: Create order with one pending product and some successful
      initializeOrder("order-789", 5);
      addPendingProduct("order-789", "product-last");

      // Simulate 4 products that already succeeded
      const stateBeforeMatch = getOrderState("order-789");
      // Manually set successfulCount to 4 (simulating 4 products already processed)
      for (let i = 0; i < 4; i++) {
        const { addSuccessfulProduct } = await import("../order-tracker.js");
        addSuccessfulProduct("order-789");
      }

      const matchedMessage = {
        productId: "product-last",
        orderId: "order-789",
        timestamp: Date.now(),
      };

      await handleProductMatched(matchedMessage);

      // Verify message structure
      expect(mockProduce).toHaveBeenCalledTimes(1);
      const [topic, message] = mockProduce.mock.calls[0];
      expect(topic).toBe("import-requested");
      expect(message).toHaveProperty("orderId");
      expect(message).toHaveProperty("timestamp");
      expect(message).toHaveProperty("totalProducts");
      expect(message).toHaveProperty("successfulCount");
      expect(message.orderId).toBe("order-789");
      expect(message.totalProducts).toBe(5);
      expect(message.successfulCount).toBe(5);
      expect(typeof message.timestamp).toBe("number");
    });

    it("should call deleteOrder after publishing import-requested", async () => {
      // Setup: Create order with one pending product
      initializeOrder("order-delete", 1);
      addPendingProduct("order-delete", "product-only");

      const matchedMessage = {
        productId: "product-only",
        orderId: "order-delete",
        timestamp: Date.now(),
      };

      await handleProductMatched(matchedMessage);

      // Verify order was deleted from tracker
      const state = getOrderState("order-delete");
      expect(state).toBeNull();
    });

    it("should skip processing gracefully when order not found in tracker", async () => {
      // No order initialized - order doesn't exist

      const matchedMessage = {
        productId: "product-unknown",
        orderId: "order-nonexistent",
        timestamp: Date.now(),
      };

      // Should not throw error
      await expect(handleProductMatched(matchedMessage)).resolves.toBeUndefined();

      // Should not call produce
      expect(mockProduce).not.toHaveBeenCalled();
    });
  });
});
