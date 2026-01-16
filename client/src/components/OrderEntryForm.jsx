import { useState } from "react";
import { useToast } from "./ToastContainer";

/**
 * OrderEntryForm provides a form for entering order details.
 * Contains Order ID (text) and Product Count (number) fields with validation.
 * Submits orders to Kafka via the Express API.
 */
function OrderEntryForm() {
  const [orderId, setOrderId] = useState("");
  const [productCount, setProductCount] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  /**
   * Validates the form fields
   * @returns {Object} Object containing field validation errors
   */
  function validateForm() {
    const newErrors = {};

    // Validate Order ID - required field
    if (!orderId.trim()) {
      newErrors.orderId = "Order ID is required";
    }

    // Validate Product Count - required, must be numeric and positive
    if (!productCount) {
      newErrors.productCount = "Product Count is required";
    } else {
      const count = Number(productCount);
      if (isNaN(count) || !Number.isInteger(count)) {
        newErrors.productCount = "Product Count must be a whole number";
      } else if (count < 1) {
        newErrors.productCount = "Product Count must be at least 1";
      }
    }

    return newErrors;
  }

  /**
   * Handles form submission with validation and API call
   * @param {React.FormEvent} event - Form submission event
   */
  async function handleSubmit(event) {
    event.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    setErrors(validationErrors);

    // If there are validation errors, don't proceed
    if (Object.keys(validationErrors).length > 0) {
      console.error("Form validation failed:", validationErrors);
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Prepare order data
      const orderData = {
        topic: "order-created",
        message: {
          orderId: orderId.trim(),
          productCount: Number(productCount),
        },
      };

      // Submit to API
      const response = await fetch("http://localhost:4000/api/kafka/produce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server error: ${response.status}`
        );
      }

      // Success - show toast and reset form
      showSuccess(`Order ${orderId.trim()} created successfully!`);
      setOrderId("");
      setProductCount("");
      setErrors({});
    } catch (error) {
      // Error - show toast and log to console
      console.error("Error submitting order:", error);
      showError(
        error.message || "Failed to submit order. Please try again."
      );
    } finally {
      // Clear loading state
      setIsLoading(false);
    }
  }

  /**
   * Handles changes to the Order ID field
   * Clears error when user starts typing
   */
  function handleOrderIdChange(e) {
    setOrderId(e.target.value);
    if (errors.orderId) {
      setErrors((prev) => ({ ...prev, orderId: undefined }));
    }
  }

  /**
   * Handles changes to the Product Count field
   * Clears error when user starts typing
   */
  function handleProductCountChange(e) {
    setProductCount(e.target.value);
    if (errors.productCount) {
      setErrors((prev) => ({ ...prev, productCount: undefined }));
    }
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">Create Order</h3>
      </header>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="order-id"
              className="block text-sm font-medium text-gray-700"
            >
              Order ID
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            </label>
            <input
              type="text"
              id="order-id"
              name="orderId"
              value={orderId}
              onChange={handleOrderIdChange}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                errors.orderId
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder="Enter order ID"
              autoComplete="off"
              aria-invalid={errors.orderId ? "true" : "false"}
              aria-describedby={errors.orderId ? "order-id-error" : undefined}
            />
            {errors.orderId && (
              <p
                id="order-id-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.orderId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="product-count"
              className="block text-sm font-medium text-gray-700"
            >
              Product Count
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            </label>
            <input
              type="number"
              id="product-count"
              name="productCount"
              value={productCount}
              onChange={handleProductCountChange}
              min="1"
              step="1"
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                errors.productCount
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder="Enter product count"
              autoComplete="off"
              aria-invalid={errors.productCount ? "true" : "false"}
              aria-describedby={
                errors.productCount ? "product-count-error" : undefined
              }
            />
            {errors.productCount && (
              <p
                id="product-count-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.productCount}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
            aria-disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </form>
    </article>
  );
}

export default OrderEntryForm;