import { describe, it, expect, mock } from "bun:test";
import { shouldProductNeedReview, filterProductsForReview } from "../review-chance.js";

describe("Review Chance Logic", () => {
  describe("shouldProductNeedReview", () => {
    it("should return a boolean value", () => {
      const result = shouldProductNeedReview();
      expect(typeof result).toBe("boolean");
    });

    it("should return true roughly 30% of the time (statistical test)", () => {
      // Run 1000 iterations to check probability
      const iterations = 1000;
      let trueCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (shouldProductNeedReview()) {
          trueCount++;
        }
      }

      const actualProbability = trueCount / iterations;

      // Allow for statistical variance: between 25% and 35% (30% ± 5%)
      expect(actualProbability).toBeGreaterThan(0.25);
      expect(actualProbability).toBeLessThan(0.35);
    });

    it("should use Math.random internally", () => {
      // This test verifies randomness exists
      const results = new Set();
      
      // Generate 100 results
      for (let i = 0; i < 100; i++) {
        results.add(shouldProductNeedReview());
      }

      // Should have both true and false values
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });
  });

  describe("filterProductsForReview", () => {
    it("should return an object with allProducts and productsNeedingReview", () => {
      const products = ["product-1234567890", "product-9876543210"];
      const result = filterProductsForReview(products);

      expect(result).toHaveProperty("allProducts");
      expect(result).toHaveProperty("productsNeedingReview");
    });

    it("should include all products in allProducts array", () => {
      const products = ["product-1234567890", "product-9876543210", "product-1111111111"];
      const result = filterProductsForReview(products);

      expect(result.allProducts).toEqual(products);
      expect(result.allProducts).toHaveLength(3);
    });

    it("should filter products needing review", () => {
      const products = ["product-1234567890", "product-9876543210"];
      const result = filterProductsForReview(products);

      // productsNeedingReview should be a subset of allProducts
      expect(Array.isArray(result.productsNeedingReview)).toBe(true);
      expect(result.productsNeedingReview.length).toBeLessThanOrEqual(products.length);

      // All products needing review should be in the original list
      result.productsNeedingReview.forEach((product) => {
        expect(products).toContain(product);
      });
    });

    it("should throw error for non-array input", () => {
      expect(() => filterProductsForReview("not an array")).toThrow(
        "Products must be an array"
      );
    });

    it("should handle empty array", () => {
      const result = filterProductsForReview([]);

      expect(result.allProducts).toEqual([]);
      expect(result.productsNeedingReview).toEqual([]);
    });

    it("should statistically filter roughly 30% of products", () => {
      // Create 100 products
      const products = Array.from({ length: 100 }, (_, i) => `product-${i.toString().padStart(10, "0")}`);
      
      const result = filterProductsForReview(products);

      // Should have roughly 30% needing review (allow ±15% variance)
      const reviewPercentage = result.productsNeedingReview.length / products.length;
      expect(reviewPercentage).toBeGreaterThan(0.15);
      expect(reviewPercentage).toBeLessThan(0.45);
    });

    it("should handle single product", () => {
      const products = ["product-1234567890"];
      const result = filterProductsForReview(products);

      expect(result.allProducts).toEqual(products);
      expect(result.productsNeedingReview.length).toBeLessThanOrEqual(1);
    });
  });
});
