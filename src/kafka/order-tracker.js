/**
 * Order Tracker Module
 * 
 * In-memory state management for tracking pending products per order
 * and counting products that passed without review.
 * 
 * State structure:
 * orderId -> {
 *   orderId: string,
 *   totalProducts: number,
 *   pendingProductIds: string[],
 *   successfulCount: number
 * }
 */

/**
 * Singleton storage using Map for O(1) lookups
 * @type {Map<string, {orderId: string, totalProducts: number, pendingProductIds: string[], successfulCount: number}>}
 */
const orderStore = new Map();

/**
 * Global counter for products that passed without review
 * @type {number}
 */
let globalSuccessfulCount = 0;

/**
 * Initializes tracking for a new order
 * @param {string} orderId - The unique order identifier
 * @param {number} totalProducts - Total number of products in the order
 */
export function initializeOrder(orderId, totalProducts) {
  if (!orderId || typeof orderId !== "string") {
    throw new Error("orderId must be a non-empty string");
  }

  if (!Number.isInteger(totalProducts) || totalProducts < 1) {
    throw new Error("totalProducts must be a positive integer");
  }

  orderStore.set(orderId, {
    orderId,
    totalProducts,
    pendingProductIds: [],
    successfulCount: 0,
  });
}

/**
 * Adds a product to the pending review list for an order
 * @param {string} orderId - The order identifier
 * @param {string} productId - The product identifier to add to pending
 */
export function addPendingProduct(orderId, productId) {
  const order = orderStore.get(orderId);

  if (!order) {
    throw new Error(`Order ${orderId} not found. Call initializeOrder() first.`);
  }

  if (!productId || typeof productId !== "string") {
    throw new Error("productId must be a non-empty string");
  }

  order.pendingProductIds.push(productId);
}

/**
 * Increments the successful product count for an order and globally
 * Successful products are those that passed without needing review
 * @param {string} orderId - The order identifier
 */
export function addSuccessfulProduct(orderId) {
  const order = orderStore.get(orderId);

  if (!order) {
    throw new Error(`Order ${orderId} not found. Call initializeOrder() first.`);
  }

  order.successfulCount++;
  globalSuccessfulCount++;
}

/**
 * Removes a product from the pending review list for an order
 * Used when a product review is completed (for roadmap item 7)
 * @param {string} orderId - The order identifier
 * @param {string} productId - The product identifier to remove from pending
 */
export function removePendingProduct(orderId, productId) {
  const order = orderStore.get(orderId);

  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  const index = order.pendingProductIds.indexOf(productId);
  if (index !== -1) {
    order.pendingProductIds.splice(index, 1);
  }
}

/**
 * Retrieves the tracking state for a specific order
 * @param {string} orderId - The order identifier
 * @returns {{orderId: string, totalProducts: number, pendingProductIds: string[], successfulCount: number} | null}
 */
export function getOrderState(orderId) {
  const order = orderStore.get(orderId);

  if (!order) {
    return null;
  }

  // Return a copy to prevent external mutations
  return {
    orderId: order.orderId,
    totalProducts: order.totalProducts,
    pendingProductIds: [...order.pendingProductIds],
    successfulCount: order.successfulCount,
  };
}

/**
 * Retrieves the array of pending product IDs for a specific order
 * @param {string} orderId - The order identifier
 * @returns {string[]} Array of pending product IDs, or empty array if order not found
 */
export function getPendingProducts(orderId) {
  const order = orderStore.get(orderId);

  if (!order) {
    return [];
  }

  // Return a copy to prevent external mutations
  return [...order.pendingProductIds];
}

/**
 * Retrieves the global count of successful products across all orders
 * @returns {number} Total successful products
 */
export function getGlobalSuccessfulCount() {
  return globalSuccessfulCount;
}

/**
 * Retrieves all tracked orders (for debugging/monitoring)
 * @returns {Array<{orderId: string, totalProducts: number, pendingProductIds: string[], successfulCount: number}>}
 */
export function getAllOrders() {
  const orders = [];

  for (const order of orderStore.values()) {
    orders.push({
      orderId: order.orderId,
      totalProducts: order.totalProducts,
      pendingProductIds: [...order.pendingProductIds],
      successfulCount: order.successfulCount,
    });
  }

  return orders;
}

/**
 * Removes an order from tracking (called when order is complete)
 * @param {string} orderId - The order identifier to remove
 */
export function deleteOrder(orderId) {
  orderStore.delete(orderId);
}

/**
 * Resets all tracking state (for testing purposes only)
 * @private
 */
export function _resetState() {
  orderStore.clear();
  globalSuccessfulCount = 0;
}
