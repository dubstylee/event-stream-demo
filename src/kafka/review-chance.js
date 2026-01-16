import orderConfig from "./order-config.json" with { type: "json" };

/**
 * Determines if a product needs review based on configured probability
 * @returns {boolean} True if the product needs review, false otherwise
 */
export function shouldProductNeedReview() {
  const { probability } = orderConfig.reviewChance;
  
  // Validate probability is between 0 and 1
  if (probability < 0 || probability > 1) {
    throw new Error("Review chance probability must be between 0 and 1");
  }
  
  // Generate random number between 0 and 1
  const randomValue = Math.random();
  
  // Return true if random value is less than probability
  return randomValue < probability;
}

/**
 * Filters products into those needing review
 * @param {string[]} products - Array of product IDs
 * @returns {Object} Object with products and productsNeedingReview arrays
 */
export function filterProductsForReview(products) {
  if (!Array.isArray(products)) {
    throw new Error("Products must be an array");
  }

  const productsNeedingReview = products.filter(() => shouldProductNeedReview());
  
  return {
    allProducts: products,
    productsNeedingReview,
  };
}
