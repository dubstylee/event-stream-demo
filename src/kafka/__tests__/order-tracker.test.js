import { describe, it, expect, beforeEach } from "bun:test";
import {
  initializeOrder,
  addPendingProduct,
  addSuccessfulProduct,
  getOrderState,
  getGlobalSuccessfulCount,
  getPendingProducts,
  getAllOrders,
  deleteOrder,
  _resetState,
} from "../order-tracker.js";

describe("Order Tracker Module", () => {
  // Reset state before each test to ensure isolation
  beforeEach(() => {
    _resetState();
  });

  describe("initializeOrder", () => {
    it("should create correct initial state for a new order", () => {
      initializeOrder("order-123", 10);

      const state = getOrderState("order-123");
      expect(state).toEqual({
        orderId: "order-123",
        totalProducts: 10,
        pendingProductIds: [],
        successfulCount: 0,
      });
    });

    it("should handle multiple orders independently", () => {
      initializeOrder("order-1", 5);
      initializeOrder("order-2", 8);

      const state1 = getOrderState("order-1");
      const state2 = getOrderState("order-2");

      expect(state1.totalProducts).toBe(5);
      expect(state2.totalProducts).toBe(8);
    });
  });

  describe("addPendingProduct", () => {
    it("should add product to pending array", () => {
      initializeOrder("order-456", 10);
      addPendingProduct("order-456", "product-1234567890");

      const state = getOrderState("order-456");
      expect(state.pendingProductIds).toContain("product-1234567890");
      expect(state.pendingProductIds).toHaveLength(1);
    });

    it("should add multiple pending products to the same order", () => {
      initializeOrder("order-789", 10);
      addPendingProduct("order-789", "product-1111111111");
      addPendingProduct("order-789", "product-2222222222");
      addPendingProduct("order-789", "product-3333333333");

      const pendingProducts = getPendingProducts("order-789");
      expect(pendingProducts).toHaveLength(3);
      expect(pendingProducts).toContain("product-1111111111");
      expect(pendingProducts).toContain("product-2222222222");
      expect(pendingProducts).toContain("product-3333333333");
    });
  });

  describe("addSuccessfulProduct", () => {
    it("should increment per-order successful count", () => {
      initializeOrder("order-success", 10);

      addSuccessfulProduct("order-success");
      expect(getOrderState("order-success").successfulCount).toBe(1);

      addSuccessfulProduct("order-success");
      expect(getOrderState("order-success").successfulCount).toBe(2);
    });

    it("should increment global successful count", () => {
      initializeOrder("order-1", 10);
      initializeOrder("order-2", 10);

      const initialGlobalCount = getGlobalSuccessfulCount();

      addSuccessfulProduct("order-1");
      expect(getGlobalSuccessfulCount()).toBe(initialGlobalCount + 1);

      addSuccessfulProduct("order-2");
      expect(getGlobalSuccessfulCount()).toBe(initialGlobalCount + 2);
    });

    it("should handle multiple successful products correctly", () => {
      initializeOrder("order-multi", 10);

      // Add 5 successful products
      for (let i = 0; i < 5; i++) {
        addSuccessfulProduct("order-multi");
      }

      expect(getOrderState("order-multi").successfulCount).toBe(5);
    });
  });

  describe("getOrderState", () => {
    it("should return expected state structure", () => {
      initializeOrder("order-state", 15);
      addPendingProduct("order-state", "product-1234567890");
      addSuccessfulProduct("order-state");

      const state = getOrderState("order-state");

      expect(state).toHaveProperty("orderId");
      expect(state).toHaveProperty("totalProducts");
      expect(state).toHaveProperty("pendingProductIds");
      expect(state).toHaveProperty("successfulCount");

      expect(state.orderId).toBe("order-state");
      expect(state.totalProducts).toBe(15);
      expect(Array.isArray(state.pendingProductIds)).toBe(true);
      expect(typeof state.successfulCount).toBe("number");
    });

    it("should return null for non-existent order", () => {
      const state = getOrderState("non-existent-order");
      expect(state).toBeNull();
    });
  });

  describe("getGlobalSuccessfulCount", () => {
    it("should return cumulative count across orders", () => {
      initializeOrder("order-a", 10);
      initializeOrder("order-b", 10);
      initializeOrder("order-c", 10);

      addSuccessfulProduct("order-a");
      addSuccessfulProduct("order-a");
      addSuccessfulProduct("order-b");
      addSuccessfulProduct("order-c");
      addSuccessfulProduct("order-c");
      addSuccessfulProduct("order-c");

      // Total: 2 + 1 + 3 = 6
      expect(getGlobalSuccessfulCount()).toBe(6);
    });

    it("should start at zero when no orders have been processed", () => {
      expect(getGlobalSuccessfulCount()).toBe(0);
    });
  });

  describe("deleteOrder", () => {
    it("should remove order from tracker", () => {
      initializeOrder("order-123", 10);
      addPendingProduct("order-123", "product-abc");
      
      // Verify order exists
      expect(getOrderState("order-123")).not.toBeNull();
      
      // Delete order
      deleteOrder("order-123");
      
      // Verify order no longer exists
      expect(getOrderState("order-123")).toBeNull();
    });

    it("should handle non-existent orderId gracefully (no error)", () => {
      // Calling deleteOrder on non-existent order should not throw
      expect(() => {
        deleteOrder("non-existent-order");
      }).not.toThrow();
    });

    it("should prevent getOrderState from returning deleted order", () => {
      initializeOrder("order-delete-test", 5);
      addPendingProduct("order-delete-test", "product-1");
      addSuccessfulProduct("order-delete-test");
      
      // Verify order has data
      const stateBefore = getOrderState("order-delete-test");
      expect(stateBefore.totalProducts).toBe(5);
      expect(stateBefore.pendingProductIds).toHaveLength(1);
      expect(stateBefore.successfulCount).toBe(1);
      
      // Delete order
      deleteOrder("order-delete-test");
      
      // getOrderState should now return null
      const stateAfter = getOrderState("order-delete-test");
      expect(stateAfter).toBeNull();
    });
  });
});
