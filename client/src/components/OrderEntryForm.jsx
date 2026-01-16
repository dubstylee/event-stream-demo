import { useState } from "react";

/**
 * OrderEntryForm provides a form for entering order details.
 * Contains Order ID (text) and Product Count (number) fields.
 * Form submission is prevented as submission logic is out of scope.
 */
function OrderEntryForm() {
  const [orderId, setOrderId] = useState("");
  const [productCount, setProductCount] = useState("");

  /**
   * Handles form submission by preventing default behavior.
   * Actual submission logic will be implemented in the Order Creation Flow spec.
   * @param {React.FormEvent} event - Form submission event
   */
  function handleSubmit(event) {
    event.preventDefault();
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
            </label>
            <input
              type="text"
              id="order-id"
              name="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter order ID"
              autoComplete="off"
            />
          </div>

          <div>
            <label
              htmlFor="product-count"
              className="block text-sm font-medium text-gray-700"
            >
              Product Count
            </label>
            <input
              type="number"
              id="product-count"
              name="productCount"
              value={productCount}
              onChange={(e) => setProductCount(e.target.value)}
              min="1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter product count"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-400 px-4 py-2 text-sm font-medium text-white cursor-not-allowed"
            aria-disabled="true"
          >
            Submit Order
          </button>
          <p className="mt-2 text-center text-xs text-gray-500">
            Order submission coming soon
          </p>
        </div>
      </form>
    </article>
  );
}

export default OrderEntryForm;