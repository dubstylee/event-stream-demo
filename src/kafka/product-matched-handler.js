import { produce } from "./producer.js";
import {
  removePendingProduct,
  addSuccessfulProduct,
  getOrderState,
  deleteOrder,
} from "./order-tracker.js";

/**
 * Processes a product-matched message
 * Updates order tracking and publishes import-requested when order is complete
 * @param {object} matchedMessage - The product-matched message containing productId, orderId, timestamp
 * @returns {Promise<void>}
 */
export async function handleProductMatched(matchedMessage) {
  try {
    const { productId, orderId } = matchedMessage;

    // Validate required fields
    if (!productId || !orderId) {
      throw new Error(
        "Product matched message must contain productId and orderId"
      );
    }

    // Check if order exists before processing
    const orderState = getOrderState(orderId);
    
    // If order not found, skip processing (order may have already completed)
    if (!orderState) {
      return;
    }

    // Remove product from pending list
    removePendingProduct(orderId, productId);

    // Increment successful count
    addSuccessfulProduct(orderId);

    // Get updated order state after modifications
    const updatedOrderState = getOrderState(orderId);

    // Check if order is complete (no pending products)
    if (updatedOrderState && updatedOrderState.pendingProductIds.length === 0) {
      // Publish import-requested message
      await produce("import-requested", {
        orderId: updatedOrderState.orderId,
        timestamp: Date.now(),
        totalProducts: updatedOrderState.totalProducts,
        successfulCount: updatedOrderState.successfulCount,
      });

      // Remove order from tracker to free memory
      deleteOrder(orderId);
    }
  } catch (error) {
    console.error(
      "[Product Matched Handler] Error processing message:",
      error.message
    );
    throw error; // Re-throw to allow consumer to handle retry logic
  }
}
