# Specification: Product Matched and Import Completion

## Goal
Implement the final step of the order processing workflow by consuming `product-matched` messages, tracking order completion, and publishing `import-requested` events when all products in an order have been processed. This completes the event aggregation pattern that demonstrates how multiple asynchronous events can be aggregated to trigger a final completion event.

## User Stories
- As a system operator, I want orders to automatically complete when all products are processed so that downstream import systems are triggered
- As a developer learning Kafka, I want to see how event aggregation works by watching import-requested events fire only when all related product events have been consumed

## Specific Requirements

**Product Matched Handler Module**
- Create new module `src/kafka/product-matched-handler.js` to process `product-matched` messages
- Follow same structural pattern as `order-handler.js` (async function with try/catch error handling)
- Export single handler function: `handleProductMatched(message)`
- Function receives message object with structure: `{ productId, orderId, timestamp }`
- Use JSDoc comments for function documentation following project conventions

**Message Processing Logic**
- Validate that message contains required fields: `productId` and `orderId`
- Throw descriptive error if required fields are missing
- Call `removePendingProduct(orderId, productId)` from order-tracker to remove product from pending list
- Call `addSuccessfulProduct(orderId)` from order-tracker to increment successful count
- Query order state using `getOrderState(orderId)` to retrieve current tracking data
- If order is not found in tracker, silently skip processing (order may have already completed)

**Order Completion Detection**
- After updating tracking state, check if order is complete
- Order is complete when `pendingProductIds.length === 0` (no products awaiting review)
- Completion check should happen immediately after removing pending product
- Use conditional logic: `if (orderState.pendingProductIds.length === 0)`

**Import Requested Publishing**
- When order is detected as complete, publish message to `import-requested` topic
- Message structure: `{ orderId, timestamp, totalProducts, successfulCount }`
- Use existing `produce(topic, message)` function from `producer.js`
- Set `timestamp` to `Date.now()` at time of publishing
- Extract `totalProducts` and `successfulCount` from order state returned by tracker

**Memory Cleanup**
- After successfully publishing `import-requested`, remove order from tracker to free memory
- Add new method to order-tracker: `deleteOrder(orderId)` to remove order from Map
- Call `deleteOrder(orderId)` after `produce()` completes successfully
- If produce fails, leave order in tracker (do not cleanup on error)

**Consumer Integration**
- Modify `src/kafka/consumer.js` to handle `product-matched` topic
- Import `handleProductMatched` function at top of consumer module
- Add topic-specific handler in `processMessage()` function following pattern from `order-created`
- Add conditional: `if (topic === 'product-matched') { await handleProductMatched(messageValue); }`
- No changes needed to TOPICS array (already includes `product-matched`)

**Error Handling**
- Wrap handler logic in try/catch block following order-handler pattern
- Log errors to console with descriptive prefix: `[Product Matched Handler] Error processing message: ${error.message}`
- Re-throw errors to allow consumer retry logic to handle redelivery
- Leverage existing consumer DLQ (Dead Letter Queue) mechanism after 3 failed attempts
- No additional error recovery logic needed beyond re-throwing

**No Additional Logging**
- Do not add console.log statements for normal processing flow
- Users will see `import-requested` messages appear in the dashboard topic widgets
- Only log errors (already specified in error handling section)
- Keep handler focused on business logic without verbose logging

## Visual Design
No visual assets provided. This is a backend-only feature with no UI components.

## Existing Code to Leverage

**`src/kafka/order-handler.js`**
- Follow exact same structural pattern for handler function
- Reuse try/catch error handling approach with descriptive error messages
- Follow same JSDoc commenting style
- Reference import pattern for tracker functions

**`src/kafka/order-tracker.js`**
- Use existing `removePendingProduct(orderId, productId)` to update pending list
- Use existing `addSuccessfulProduct(orderId)` to increment successful count
- Use existing `getOrderState(orderId)` to retrieve order tracking data
- Add new `deleteOrder(orderId)` method following existing module patterns
- Method should remove entry from orderStore Map and handle case where order doesn't exist

**`src/kafka/producer.js`**
- Use existing `produce(topic, message)` function to publish import-requested messages
- Function already handles connection validation and error cases
- No modifications needed to producer module

**`src/kafka/consumer.js`**
- Follow pattern from lines 100-103 where order-created handler is invoked
- Add import for handleProductMatched at top with other handler imports
- Add topic check in processMessage function following existing if-statement pattern
- Existing DLQ and retry logic will automatically apply to new handler

## Out of Scope
- Additional console logging for successful operations (rely on dashboard visibility)
- Edge case handling for unknown orderIds (silently skip if order not found)
- Edge case handling for productIds not in pending list (tracker method handles gracefully)
- Duplicate message handling (Kafka consumer handles deduplication via offset tracking)
- Frontend UI changes (no visual components needed)
- Toast notifications or user alerts
- Metrics collection or monitoring dashboards
- Persistent storage of completed order history
- API endpoints to query completion status
- Webhook notifications when import-requested is published
- Batch processing or optimization for high-throughput scenarios
- Configurable completion criteria (always use pendingProductIds.length === 0)

## Implementation Notes

**Order Tracker New Method**
Add the following method to `src/kafka/order-tracker.js`:

```javascript
/**
 * Removes an order from tracking (called when order is complete)
 * @param {string} orderId - The order identifier to remove
 */
export function deleteOrder(orderId) {
  orderStore.delete(orderId);
}
```

**Handler Function Signature**
The handler in `product-matched-handler.js` should follow this signature:

```javascript
/**
 * Processes a product-matched message
 * Updates order tracking and publishes import-requested when order is complete
 * @param {object} matchedMessage - The product-matched message containing productId, orderId, timestamp
 * @returns {Promise<void>}
 */
export async function handleProductMatched(matchedMessage) {
  // Implementation here
}
```

**Consumer Integration Pattern**
In `consumer.js` `processMessage()` function, add after the order-created handler:

```javascript
// Handle topic-specific processing
if (topic === 'order-created') {
  await handleOrderCreated(messageValue);
} else if (topic === 'product-matched') {
  await handleProductMatched(messageValue);
}
```

## Testing Considerations
- Unit tests should verify handler removes pending product from tracker
- Unit tests should verify handler increments successful count
- Unit tests should verify handler publishes import-requested when pendingProductIds is empty
- Unit tests should verify handler calls deleteOrder after publishing
- Unit tests should verify handler skips processing if order not found
- Unit tests should verify error handling and re-throw behavior
- Integration tests should verify end-to-end flow from order creation to import-requested
- Tests should verify memory cleanup by checking order is removed from tracker after completion
