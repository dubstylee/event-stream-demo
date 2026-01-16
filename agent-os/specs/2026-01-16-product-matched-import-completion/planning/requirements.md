# Spec Requirements: Product Matched and Import Completion

## Initial Description
Product Matched and Import Completion from the roadmap - Implement product-matched publishing on approval, track remaining products per order, and publish import-requested when all products are processed.

## Requirements Discussion

### First Round Questions

**Q1:** For tracking order completion, should we create a new consumer handler for `product-matched` messages, or should this logic be integrated into the existing `order-handler.js`?
**Answer:** Create a new consumer handler for product-matched messages

**Q2:** The `order-tracker.js` currently tracks `successfulCount` (products that passed without review) and `pendingProductIds` (products needing review). When a product is matched/approved, should we increment a new `matchedCount` field, or use `removePendingProduct()` and calculate completion as `successfulCount + (totalProducts - pendingProductIds.length)`?
**Answer:** Increment successfulCount when a product is reviewed/matched

**Q3:** When all products for an order are processed (meaning `pendingProductIds` is empty), should we publish `import-requested` immediately, or should there be any additional conditions or delays?
**Answer:** Publish immediately when all products are processed

**Q4:** What should the message structure for `import-requested` contain? I assume at minimum `{ orderId, timestamp }`, but should it also include `totalProducts`, `successfulCount`, or other summary data?
**Answer:** The suggested structure is sufficient (include orderId, timestamp, totalProducts, successfulCount)

**Q5:** After publishing `import-requested` for an order, should we keep the order in the tracker (for potential queries/debugging) or remove it to free memory? If we keep it, should we add a `completed: true` flag?
**Answer:** Remove the order from tracker to free memory

**Q6:** Should there be any logging or console output when: (a) a product-matched message is consumed, (b) an order is detected as complete, (c) import-requested is published?
**Answer:** No additional logging needed - users will see the import-requested kafka message in the stream

**Q7:** Are there any edge cases we should handle explicitly, such as: receiving `product-matched` for a productId that wasn't pending, receiving `product-matched` for an unknown orderId, or duplicate `product-matched` messages?
**Answer:** N/A

**Q8:** Is there anything specific you want to exclude from this feature's scope?
**Answer:** N/A

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Order Handler - Path: `src/kafka/order-handler.js`
  - Handles `order-created` messages and initializes order tracking
  - Pattern for consuming Kafka messages and publishing to other topics
- Feature: Order Tracker - Path: `src/kafka/order-tracker.js`
  - Provides state management for tracking orders and products
  - Has `removePendingProduct()` method ready for this use case
- Feature: Consumer Setup - Path: `src/kafka/consumer.js`
  - Consumer group infrastructure for subscribing to topics
  - Pattern for adding new topic handlers

### Follow-up Questions
No follow-up questions were needed. The user's answers were comprehensive and clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Create a new consumer handler for `product-matched` topic messages
- When a `product-matched` message is consumed:
  - Remove the productId from the pending list using `removePendingProduct(orderId, productId)`
  - Increment the order's `successfulCount` using the existing tracker method
  - Check if all products are processed (pendingProductIds array is empty)
- When an order is complete (no pending products):
  - Publish `import-requested` message immediately with structure: `{ orderId, timestamp, totalProducts, successfulCount }`
  - Remove the order from the tracker to free memory
- No additional console logging required (users see kafka messages in dashboard)

### Reusability Opportunities
- `order-handler.js` - Follow similar pattern for consuming Kafka messages and processing logic
- `order-tracker.js` - Use existing methods: `removePendingProduct()`, `getOrderState()`, `addSuccessfulProduct()`
- `consumer.js` - Add new topic subscription following existing pattern
- `producer.js` - Use existing `produce()` function for publishing `import-requested` messages

### Scope Boundaries
**In Scope:**
- New handler module for `product-matched` messages (similar to `order-handler.js`)
- Consumer subscription to `product-matched` topic
- Logic to remove pending products and increment successful count
- Order completion detection logic
- Publishing `import-requested` when order is complete
- Memory cleanup by removing completed orders from tracker

**Out of Scope:**
- Additional logging/console output (relying on kafka message visibility in dashboard)
- Edge case handling for unknown orderIds or invalid productIds
- Keeping completed orders in memory for debugging
- Any frontend changes (no UI needed for this feature)
- Toast notifications or user alerts

### Technical Considerations
- Message structure for `product-matched`: `{ productId, orderId, timestamp }` (already published by Products Needing Review component)
- Message structure for `import-requested`: `{ orderId, timestamp, totalProducts, successfulCount }`
- Order completion condition: `pendingProductIds.length === 0`
- Use existing `order-tracker.js` methods rather than adding new tracking fields
- After publishing `import-requested`, call a delete/cleanup method on the order tracker
- Handler should be async to support Kafka produce operations
- Follow same error handling patterns as `order-handler.js`
