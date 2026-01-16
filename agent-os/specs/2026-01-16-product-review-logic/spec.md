# Specification: Product Review Tracking Infrastructure

## Goal
Create an in-memory tracking module to monitor pending products per order and count products that passed without review, providing state infrastructure for future completion detection (roadmap item 7).

## User Stories
- As a system operator, I want to track which products are pending review for each order so that I can monitor order progress
- As a downstream service, I want to query the current tracking state so that I can implement completion detection logic

## Specific Requirements

**In-Memory Order Tracking Store**
- Create a new module `src/kafka/order-tracker.js` for tracking state management
- Use a JavaScript `Map` for O(1) lookups by orderId
- Store per-order data: `orderId -> { totalProducts, pendingProductIds[], successfulCount }`
- State resets on server restart (acceptable for PoC)
- Module should be a singleton to ensure consistent state across the application

**Track Pending Products Per Order**
- When an order is processed, register all products needing review as "pending"
- Store the array of productIds awaiting review for each order
- Provide method to remove a product from pending when review completes (for roadmap item 7)
- Maintain `totalProducts` count to know the full order size

**Track Successful Products Counter**
- Maintain a global counter of products that passed without needing review
- Also track per-order successful count for granular reporting
- Successful = total products minus products needing review
- Update counters atomically when order is processed

**Export State Query API**
- `getOrderState(orderId)` - Returns tracking state for a specific order
- `getPendingProducts(orderId)` - Returns array of pending productIds
- `getGlobalSuccessfulCount()` - Returns total successful products across all orders
- `getAllOrders()` - Returns all tracked orders (for debugging/monitoring)

**Integration with Order Handler**
- Modify `order-handler.js` to call tracking module after filtering products
- Register order with total product count when processing begins
- Record which products need review (pending) vs passed (successful)
- Keep order-handler focused on Kafka message handling, delegate tracking to new module

**Separation of Concerns**
- Tracking module handles only state management (no Kafka logic)
- Order handler calls tracking module but does not implement tracking logic
- Clean interfaces allow roadmap item 7 to import tracking module directly

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`src/kafka/order-handler.js`**
- Already processes order-created messages and generates products
- Already filters products using `filterProductsForReview()`
- Already publishes to `product-needs-review` topic
- Needs minimal modification to add tracking calls after filtering

**`src/kafka/review-chance.js`**
- Contains `filterProductsForReview()` which returns `{ allProducts, productsNeedingReview }`
- No modifications needed - use existing return values to calculate successful count
- Review probability configured in `order-config.json`

**`src/kafka/product-generator.js`**
- Generates product IDs with `generateProducts(count)`
- No modifications needed - already integrated with order-handler

**`src/kafka/producer.js` pattern**
- Follow singleton pattern used for producer instance
- Follow JSDoc commenting style for function documentation
- Follow consistent error handling with descriptive messages

## Out of Scope
- Completion detection logic (detecting when all products are reviewed) - deferred to roadmap item 7
- Publishing to `import-requested` topic - roadmap item 8
- Frontend UI components for review list display
- Persistent storage (Redis, database, file-based)
- Batched message publishing
- WebSocket or real-time state updates to frontend
- Product review approval/rejection handling
- Metrics or monitoring dashboards for tracking state
- API endpoints to query tracking state (internal module only)
- Cleanup or expiration of old order tracking data