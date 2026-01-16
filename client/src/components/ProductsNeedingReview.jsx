import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "products-needing-review";
const MAX_PRODUCTS = 20;
const STORAGE_DEBOUNCE_MS = 300;

/**
 * ProductsNeedingReview displays products awaiting review and enables click-to-approve.
 * 
 * Features:
 * - Subscribes to product-needs-review Kafka messages via Socket.io
 * - Displays up to 20 products in a scrollable list
 * - Click-to-approve: clicking a row publishes to product-matched topic
 * - Optimistic UI: removes item immediately, restores on error
 * - Persists pending products to localStorage across page refreshes
 * 
 * @param {Object} props
 * @param {Object} props.socket - Socket.io client instance
 */
function ProductsNeedingReview({ socket }) {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  /**
   * Load persisted products from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const products = JSON.parse(stored);
        if (Array.isArray(products)) {
          // Deduplicate and limit to MAX_PRODUCTS
          const uniqueProducts = deduplicateProducts(products).slice(0, MAX_PRODUCTS);
          setPendingProducts(uniqueProducts);
        }
      }
    } catch (error) {
      console.error("Error loading products from localStorage:", error);
    }
  }, []);

  /**
   * Save pending products to localStorage with debouncing
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingProducts));
      } catch (error) {
        console.error("Error saving products to localStorage:", error);
      }
    }, STORAGE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [pendingProducts]);

  /**
   * Deduplicate products by productId, keeping the newest timestamp
   * @param {Array} products - Array of product objects
   * @returns {Array} Deduplicated products
   */
  function deduplicateProducts(products) {
    const productMap = new Map();
    
    products.forEach((product) => {
      const existing = productMap.get(product.productId);
      if (!existing || product.timestamp > existing.timestamp) {
        productMap.set(product.productId, product);
      }
    });
    
    return Array.from(productMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Add a new product to the pending list with deduplication
   * @param {Object} product - Product object with productId, orderId, timestamp
   */
  const addProduct = useCallback((product) => {
    setPendingProducts((prev) => {
      const updated = [...prev, product];
      const deduplicated = deduplicateProducts(updated);
      // Keep only the newest MAX_PRODUCTS items
      return deduplicated.slice(0, MAX_PRODUCTS);
    });
  }, []);

  /**
   * Handle incoming Kafka messages from Socket.io
   */
  useEffect(() => {
    if (!socket) {
      return;
    }

    function handleKafkaMessage(payload) {
      const { topic, message } = payload;
      
      // Filter for product-needs-review topic only
      if (topic !== "product-needs-review") {
        return;
      }

      const { productId, orderId, timestamp } = message;
      
      if (productId && orderId && timestamp) {
        addProduct({ productId, orderId, timestamp });
      }
    }

    socket.on("kafka:message", handleKafkaMessage);

    return () => {
      socket.off("kafka:message", handleKafkaMessage);
    };
  }, [socket, addProduct]);

  /**
   * Handle product approval (click or keyboard activation)
   * @param {Object} product - Product to approve
   */
  async function handleApprove(product) {
    // Prevent double-clicks
    if (processingId === product.productId) {
      return;
    }

    setProcessingId(product.productId);

    // Optimistic UI: remove item immediately
    setPendingProducts((prev) =>
      prev.filter((p) => p.productId !== product.productId)
    );

    try {
      const response = await fetch("http://localhost:4000/api/kafka/produce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: "product-matched",
          message: {
            productId: product.productId,
            orderId: product.orderId,
            timestamp: product.timestamp,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server error: ${response.status}`
        );
      }

      // Success - item stays removed
    } catch (error) {
      console.error("Error approving product:", error);
      
      // Restore item on error
      setPendingProducts((prev) => {
        const restored = [...prev, product];
        return deduplicateProducts(restored).slice(0, MAX_PRODUCTS);
      });
    } finally {
      setProcessingId(null);
    }
  }

  /**
   * Handle click event on product row
   * @param {Object} product - Product that was clicked
   */
  function handleClick(product) {
    handleApprove(product);
  }

  /**
   * Handle keyboard events on product row
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} product - Product for the focused row
   */
  function handleKeyDown(event, product) {
    // Enter key (code 13) or Space key (code 32)
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // Prevent page scroll on Space
      handleApprove(product);
    }
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">
          Products Needing Review
        </h3>
      </header>

      <div
        className="h-64 overflow-y-auto p-4"
        role="region"
        aria-label="Products needing review list"
      >
        {pendingProducts.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No products awaiting review
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {pendingProducts.map((product) => (
              <li
                key={product.productId}
                onClick={() => handleClick(product)}
                onKeyDown={(e) => handleKeyDown(e, product)}
                role="button"
                tabIndex={0}
                className={`rounded px-3 py-2 text-sm transition-colors ${
                  processingId === product.productId
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                }`}
                aria-label={`Approve product ${product.productId}`}
                aria-disabled={processingId === product.productId}
              >
                <span className="font-mono text-gray-700">
                  {product.productId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default ProductsNeedingReview;
