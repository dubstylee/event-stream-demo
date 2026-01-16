import { generateProducts } from "./product-generator.js";
import { filterProductsForReview } from "./review-chance.js";
import { produce } from "./producer.js";

/**
 * Processes an order-created message
 * Generates N products per order and publishes products needing review
 * @param {object} orderMessage - The order message containing orderId and productCount
 * @returns {Promise<void>}
 */
export async function handleOrderCreated(orderMessage) {
  try {
    const { orderId, productCount, timestamp } = orderMessage;

    // Validate required fields
    if (!orderId || !productCount) {
      throw new Error("Order message must contain orderId and productCount");
    }

    console.log(
      `[Order Handler] Processing order: ${orderId}, generating ${productCount} products`
    );

    // Generate products
    const products = generateProducts(productCount);

    console.log(
      `[Order Handler] Generated ${products.length} products for order ${orderId}`
    );

    // Filter products for review
    const { productsNeedingReview } = filterProductsForReview(products);

    console.log(
      `[Order Handler] ${productsNeedingReview.length} products need review for order ${orderId}`
    );

    // Publish products needing review to product-needs-review topic
    if (productsNeedingReview.length > 0) {
      for (const productId of productsNeedingReview) {
        await produce("product-needs-review", {
          productId,
          orderId,
          timestamp: Date.now(),
        });
      }

      console.log(
        `[Order Handler] Published ${productsNeedingReview.length} products to product-needs-review topic`
      );
    }

    // Log successful processing
    console.log(
      `[Order Handler] Successfully processed order ${orderId}. Total products: ${products.length}, Needs review: ${productsNeedingReview.length}`
    );
  } catch (error) {
    console.error("[Order Handler] Error processing order:", error.message);
    throw error; // Re-throw to allow consumer to handle retry logic
  }
}
