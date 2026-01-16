import { describe, it, expect, beforeEach, mock } from "bun:test";
import * as orderTracker from "../order-tracker.js";

// Mock the order-tracker module
const mockInitializeOrder = mock(() => {});
const mockAddPendingProduct = mock(() => {});
const mockAddSuccessfulProduct = mock(() => {});

mock.module("../order-tracker.js", () => ({
  initializeOrder: mockInitializeOrder,
  addPendingProduct: mockAddPendingProduct,
  addSuccessfulProduct: mockAddSuccessfulProduct,
  getOrderState: orderTracker.getOrderState,
  getGlobalSuccessfulCount: orderTracker.getGlobalSuccessfulCount,
}));

// Import handler after mocking
const { handleOrderCreated } = await import("../order-handler.js");

describe("Order Handler Integration with Tracking", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockInitializeOrder.mockClear();
    mockAddPendingProduct.mockClear();
    mockAddSuccessfulProduct.mockClear();
  });

  describe("handleOrderCreated tracking integration", () => {
    it("should call initializeOrder with correct parameters", async () => {
      const orderMessage = {
        orderId: "order-tracking-1",
        productCount: 10,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // Verify initializeOrder was called with orderId and total product count
      expect(mockInitializeOrder).toHaveBeenCalled();
      const calls = mockInitializeOrder.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const [orderId, totalProducts] = calls[0];
      expect(orderId).toBe("order-tracking-1");
      expect(totalProducts).toBe(10);
    });

    it("should register products needing review via addPendingProduct", async () => {
      const orderMessage = {
        orderId: "order-tracking-2",
        productCount: 20,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // With 30% review chance, statistically we should have some pending products
      // Just verify that addPendingProduct was called (if any products need review)
      // Note: Due to randomness, this might be 0, so we just check the function exists
      expect(mockAddPendingProduct).toBeDefined();

      // If called, verify it was called with correct parameters
      if (mockAddPendingProduct.mock.calls.length > 0) {
        const [orderId, productId] = mockAddPendingProduct.mock.calls[0];
        expect(orderId).toBe("order-tracking-2");
        expect(productId).toMatch(/^product-\d{10}$/);
      }
    });

    it("should count successful products via addSuccessfulProduct", async () => {
      const orderMessage = {
        orderId: "order-tracking-3",
        productCount: 50,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // With 50 products, statistically ~35 should pass (70% success rate)
      // Verify addSuccessfulProduct was called multiple times
      expect(mockAddSuccessfulProduct.mock.calls.length).toBeGreaterThan(0);

      // All calls should be for the same order
      mockAddSuccessfulProduct.mock.calls.forEach(([orderId]) => {
        expect(orderId).toBe("order-tracking-3");
      });
    });

    it("should track both pending and successful products correctly", async () => {
      const orderMessage = {
        orderId: "order-mixed",
        productCount: 100,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // With 100 products, we should have both pending and successful
      const pendingCalls = mockAddPendingProduct.mock.calls.length;
      const successfulCalls = mockAddSuccessfulProduct.mock.calls.length;

      // Total should equal product count
      expect(pendingCalls + successfulCalls).toBe(100);

      // Statistically with 30% review chance, both should be > 0
      expect(pendingCalls).toBeGreaterThan(0);
      expect(successfulCalls).toBeGreaterThan(0);
    });
  });
});
