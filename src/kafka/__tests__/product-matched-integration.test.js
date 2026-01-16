import { describe, it, expect, mock, beforeEach } from "bun:test";
import { handleOrderCreated } from "../order-handler.js";
import { handleProductMatched } from "../product-matched-handler.js";
import {
  initializeOrder,
  addPendingProduct,
  getOrderState,
  _resetState,
} from "../order-tracker.js";

// Mock the producer module
const mockProduce = mock(() => Promise.resolve());
mock.module("../producer.js", () => ({
  produce: mockProduce,
}));

describe("Product Matched and Import Completion - Integration Tests", () => {
  beforeEach(() => {
    // Reset state and mocks before each test
    _resetState();
    mockProduce.mockClear();
  });

  describe("End-to-end order processing workflow", () => {
    it("should complete full order flow: order-created → products generated → product-matched → import-requested published", async () => {
      // Step 1: Create an order with products
      const orderMessage = {
        orderId: "order-integration-001",
        productCount: 5,
        timestamp: Date.now(),
      };

      await handleOrderCreated(orderMessage);

      // Verify order was initialized
      const orderStateAfterCreation = getOrderState("order-integration-001");
      expect(orderStateAfterCreation).not.toBeNull();
      expect(orderStateAfterCreation.totalProducts).toBe(5);

      // Collect products needing review from produce calls
      const productNeedsReviewCalls = mockProduce.mock.calls.filter(
        (call) => call[0] === "product-needs-review"
      );
      const pendingProducts = productNeedsReviewCalls.map(
        (call) => call[1].productId
      );

      // Calculate how many products passed without review
      const autoPassedCount = 5 - pendingProducts.length;

      // Verify tracking state
      expect(orderStateAfterCreation.pendingProductIds.length).toBe(
        pendingProducts.length
      );
      expect(orderStateAfterCreation.successfulCount).toBe(autoPassedCount);

      // Clear mock to track import-requested
      mockProduce.mockClear();

      // Step 2: Process each product-matched message
      for (let i = 0; i < pendingProducts.length; i++) {
        const productId = pendingProducts[i];
        const matchedMessage = {
          productId,
          orderId: "order-integration-001",
          timestamp: Date.now(),
        };

        await handleProductMatched(matchedMessage);

        // Check state after each match
        const stateAfterMatch = getOrderState("order-integration-001");

        if (i < pendingProducts.length - 1) {
          // Not the last product - order should still exist
          expect(stateAfterMatch).not.toBeNull();
          expect(stateAfterMatch.pendingProductIds.length).toBe(
            pendingProducts.length - (i + 1)
          );
          expect(stateAfterMatch.successfulCount).toBe(autoPassedCount + i + 1);

          // No import-requested should be published yet
          const importRequestedCalls = mockProduce.mock.calls.filter(
            (call) => call[0] === "import-requested"
          );
          expect(importRequestedCalls.length).toBe(0);
        } else {
          // Last product - order should be complete and deleted
          expect(stateAfterMatch).toBeNull();

          // import-requested should be published
          const importRequestedCalls = mockProduce.mock.calls.filter(
            (call) => call[0] === "import-requested"
          );
          expect(importRequestedCalls.length).toBe(1);

          // Verify import-requested message structure
          const [topic, message] = importRequestedCalls[0];
          expect(topic).toBe("import-requested");
          expect(message.orderId).toBe("order-integration-001");
          expect(message.totalProducts).toBe(5);
          expect(message.successfulCount).toBe(5);
          expect(typeof message.timestamp).toBe("number");
        }
      }
    });

    it("should handle order with mixed products (some needing review, some automatic) and complete only after all matched", async () => {
      // Manually create an order with specific product distribution
      const orderId = "order-mixed-002";
      const totalProducts = 10;

      // Initialize order
      initializeOrder(orderId, totalProducts);

      // Simulate 3 products needing review, 7 auto-passed
      const productsNeedingReview = [
        "product-review-1",
        "product-review-2",
        "product-review-3",
      ];

      for (const productId of productsNeedingReview) {
        addPendingProduct(orderId, productId);
      }

      // Mark 7 as successful (auto-passed)
      const { addSuccessfulProduct } = await import("../order-tracker.js");
      for (let i = 0; i < 7; i++) {
        addSuccessfulProduct(orderId);
      }

      // Verify initial state
      const initialState = getOrderState(orderId);
      expect(initialState.totalProducts).toBe(10);
      expect(initialState.pendingProductIds.length).toBe(3);
      expect(initialState.successfulCount).toBe(7);

      // Process first product match
      await handleProductMatched({
        productId: "product-review-1",
        orderId,
        timestamp: Date.now(),
      });

      let state = getOrderState(orderId);
      expect(state).not.toBeNull();
      expect(state.pendingProductIds.length).toBe(2);
      expect(state.successfulCount).toBe(8);

      // Verify no import-requested yet
      let importRequestedCalls = mockProduce.mock.calls.filter(
        (call) => call[0] === "import-requested"
      );
      expect(importRequestedCalls.length).toBe(0);

      // Process second product match
      await handleProductMatched({
        productId: "product-review-2",
        orderId,
        timestamp: Date.now(),
      });

      state = getOrderState(orderId);
      expect(state).not.toBeNull();
      expect(state.pendingProductIds.length).toBe(1);
      expect(state.successfulCount).toBe(9);

      // Verify still no import-requested
      importRequestedCalls = mockProduce.mock.calls.filter(
        (call) => call[0] === "import-requested"
      );
      expect(importRequestedCalls.length).toBe(0);

      // Process final product match
      await handleProductMatched({
        productId: "product-review-3",
        orderId,
        timestamp: Date.now(),
      });

      // Order should be deleted now
      state = getOrderState(orderId);
      expect(state).toBeNull();

      // Verify import-requested was published
      importRequestedCalls = mockProduce.mock.calls.filter(
        (call) => call[0] === "import-requested"
      );
      expect(importRequestedCalls.length).toBe(1);

      // Verify message content
      const [topic, message] = importRequestedCalls[0];
      expect(topic).toBe("import-requested");
      expect(message.orderId).toBe(orderId);
      expect(message.totalProducts).toBe(10);
      expect(message.successfulCount).toBe(10);
    });
  });
});
