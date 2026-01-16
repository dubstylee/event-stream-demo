import { describe, it, expect } from "bun:test";
import { generateProductId, generateProducts } from "../product-generator.js";

describe("Product Generator", () => {
  describe("generateProductId", () => {
    it("should generate a product ID with correct format", () => {
      const productId = generateProductId();

      // Check format: "product-XXXXXXXXXX" where X is a digit
      expect(productId).toMatch(/^product-\d{10}$/);
    });

    it("should generate unique product IDs", () => {
      const id1 = generateProductId();
      const id2 = generateProductId();
      const id3 = generateProductId();

      // While theoretically possible to get duplicates, statistically unlikely
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("should generate product IDs with exactly 10 numeric characters", () => {
      const productId = generateProductId();
      const numericPart = productId.replace("product-", "");

      expect(numericPart).toHaveLength(10);
      expect(/^\d+$/.test(numericPart)).toBe(true);
    });
  });

  describe("generateProducts", () => {
    it("should generate the correct number of products", () => {
      const count = 5;
      const products = generateProducts(count);

      expect(products).toHaveLength(count);
    });

    it("should generate an array of valid product IDs", () => {
      const products = generateProducts(3);

      products.forEach((productId) => {
        expect(productId).toMatch(/^product-\d{10}$/);
      });
    });

    it("should throw error for non-integer count", () => {
      expect(() => generateProducts(3.5)).toThrow(
        "Product count must be a positive integer"
      );
    });

    it("should throw error for zero count", () => {
      expect(() => generateProducts(0)).toThrow(
        "Product count must be a positive integer"
      );
    });

    it("should throw error for negative count", () => {
      expect(() => generateProducts(-1)).toThrow(
        "Product count must be a positive integer"
      );
    });

    it("should handle generating a single product", () => {
      const products = generateProducts(1);

      expect(products).toHaveLength(1);
      expect(products[0]).toMatch(/^product-\d{10}$/);
    });

    it("should handle generating many products", () => {
      const products = generateProducts(100);

      expect(products).toHaveLength(100);

      // Check all are unique (statistically should be)
      const uniqueProducts = new Set(products);
      expect(uniqueProducts.size).toBe(100);
    });
  });
});
