import orderConfig from "./order-config.json" with { type: "json" };

/**
 * Generates a random numeric string of specified length
 * @param {number} length - The length of the numeric string to generate
 * @returns {string} A random numeric string
 */
function generateRandomNumericString(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

/**
 * Generates a single product ID
 * Uses the format: "product-XXXXXXXXXX" where X is a random digit
 * @returns {string} A unique product ID
 */
export function generateProductId() {
  const { productIdPrefix, productIdLength } = orderConfig.productGeneration;
  const randomNumbers = generateRandomNumericString(productIdLength);
  return `${productIdPrefix}${randomNumbers}`;
}

/**
 * Generates multiple product IDs for an order
 * @param {number} count - The number of product IDs to generate
 * @returns {string[]} An array of unique product IDs
 */
export function generateProducts(count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Product count must be a positive integer");
  }

  const products = [];
  for (let i = 0; i < count; i++) {
    products.push(generateProductId());
  }
  return products;
}
