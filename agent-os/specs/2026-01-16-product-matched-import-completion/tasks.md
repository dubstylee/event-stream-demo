# Task Breakdown: Product Matched and Import Completion

## Overview
Total Tasks: 12

This feature implements the final step of the order processing workflow by consuming `product-matched` messages, tracking order completion, and publishing `import-requested` events when all products in an order have been processed.

## Task List

### Backend Infrastructure Layer

#### Task Group 1: Order Tracker Cleanup Method
**Dependencies:** None

- [x] 1.0 Complete order tracker cleanup functionality
  - [x] 1.1 Write 3 focused tests for deleteOrder method
    - Test deleteOrder removes order from tracker
    - Test deleteOrder handles non-existent orderId gracefully (no error)
    - Test deleteOrder prevents getOrderState from returning deleted order
  - [x] 1.2 Implement deleteOrder method in order-tracker.js
    - Add new export function `deleteOrder(orderId)`
    - Call `orderStore.delete(orderId)` to remove from Map
    - No error handling needed (Map.delete is safe for non-existent keys)
    - Add JSDoc comment following existing patterns
  - [x] 1.3 Ensure deleteOrder tests pass
    - Run ONLY the 3 tests written in 1.1
    - Verify order cleanup works correctly

**Acceptance Criteria:**
- The 3 tests written in 1.1 pass
- deleteOrder method removes orders from tracking Map
- Method handles missing orderIds without throwing errors
- JSDoc documentation follows existing patterns in order-tracker.js

---

#### Task Group 2: Product Matched Handler Module
**Dependencies:** Task Group 1

- [x] 2.0 Complete product-matched handler implementation
  - [x] 2.1 Write 5 focused tests for handler logic
    - Test handler removes pending product and increments successfulCount
    - Test handler publishes import-requested when order is complete (pendingProductIds empty)
    - Test handler includes correct message structure in import-requested (orderId, timestamp, totalProducts, successfulCount)
    - Test handler calls deleteOrder after publishing import-requested
    - Test handler skips processing gracefully when order not found in tracker
  - [x] 2.2 Create product-matched-handler.js file
    - Create file at `src/kafka/product-matched-handler.js`
    - Import required functions from order-tracker: `removePendingProduct`, `addSuccessfulProduct`, `getOrderState`, `deleteOrder`
    - Import `produce` function from producer.js
    - Follow same file structure as order-handler.js
  - [x] 2.3 Implement handleProductMatched function
    - Export async function `handleProductMatched(matchedMessage)`
    - Add JSDoc comment with parameter and return type documentation
    - Wrap logic in try/catch block
    - Validate message contains `productId` and `orderId` fields
    - Throw descriptive error if required fields missing
  - [x] 2.4 Implement order tracking updates
    - Call `removePendingProduct(orderId, productId)` to update pending list
    - Call `addSuccessfulProduct(orderId)` to increment successful count
    - Call `getOrderState(orderId)` to retrieve current tracking data
    - If order not found (null), return early without error
  - [x] 2.5 Implement order completion detection
    - Check if `orderState.pendingProductIds.length === 0`
    - If complete, proceed to publish import-requested
    - If not complete, function ends (no action needed)
  - [x] 2.6 Implement import-requested publishing and cleanup
    - Call `produce("import-requested", messageObject)`
    - Message object: `{ orderId, timestamp: Date.now(), totalProducts, successfulCount }`
    - Extract totalProducts and successfulCount from orderState
    - After successful produce, call `deleteOrder(orderId)` to free memory
  - [x] 2.7 Implement error handling
    - In catch block, log error with prefix: `[Product Matched Handler] Error processing message: ${error.message}`
    - Re-throw error to allow consumer retry logic
    - Follow exact pattern from order-handler.js
  - [x] 2.8 Ensure handler tests pass
    - Run ONLY the 5 tests written in 2.1
    - Verify all handler logic works correctly

**Acceptance Criteria:**
- The 5 tests written in 2.1 pass
- Handler removes pending products and increments successful count
- Handler publishes import-requested only when order is complete
- Handler cleans up order from tracker after publishing
- Handler skips gracefully when order not found
- Error handling follows order-handler.js pattern

---

### Consumer Integration Layer

#### Task Group 3: Consumer Topic Handler Integration
**Dependencies:** Task Group 2

- [x] 3.0 Complete consumer integration
  - [x] 3.1 Write 2 focused tests for consumer integration
    - Test consumer calls handleProductMatched when product-matched message received
    - Test consumer retry logic applies to product-matched messages (3 attempts before DLQ)
  - [x] 3.2 Import handler in consumer.js
    - Add import statement at top: `import { handleProductMatched } from './product-matched-handler.js';`
    - Place import with other handler imports (after order-handler import)
  - [x] 3.3 Add topic-specific handler in processMessage function
    - Locate the existing `if (topic === 'order-created')` block in processMessage
    - Add `else if (topic === 'product-matched')` condition after it
    - Call `await handleProductMatched(messageValue)` in the new condition block
    - Follow exact pattern from order-created handler
  - [x] 3.4 Ensure consumer integration tests pass
    - Run ONLY the 2 tests written in 3.1
    - Verify handler is invoked correctly by consumer

**Acceptance Criteria:**
- The 2 tests written in 3.1 pass
- Consumer correctly routes product-matched messages to handler
- Existing DLQ and retry logic applies to new handler
- No changes needed to TOPICS array (already includes product-matched)

---

### Testing Layer

#### Task Group 4: Integration Tests
**Dependencies:** Task Groups 1-3

- [x] 4.0 Complete integration testing
  - [x] 4.1 Write 2 end-to-end integration tests
    - Test complete order flow: order-created → products generated → product-matched → import-requested published
    - Test order with mixed products (some needing review, some automatic): verify completion only after all matched
  - [x] 4.2 Run all feature-specific tests
    - Run all tests from groups 1-3 plus new tests from 4.1
    - Expected total: 12 tests (3 + 5 + 2 + 2)
    - Verify all tests pass
  - [x] 4.3 Run full backend test suite
    - Run `bun test` for entire src/ directory
    - Ensure no regressions in existing tests
    - Verify all tests still pass with new changes

**Acceptance Criteria:**
- All 12 feature-specific tests pass
- Integration tests verify complete end-to-end workflow
- Full backend test suite passes with no regressions
- Order completion detection works correctly with mixed product types

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Order Tracker Cleanup** - Add deleteOrder method to enable memory cleanup
2. **Task Group 2: Product Matched Handler** - Create handler module with completion detection logic
3. **Task Group 3: Consumer Integration** - Wire handler into consumer infrastructure
4. **Task Group 4: Integration Tests** - Verify complete end-to-end workflow

## Files to Create/Modify

**New Files:**
- `src/kafka/product-matched-handler.js` - Handler for product-matched messages
- `src/kafka/__tests__/product-matched-handler.test.js` - Handler unit tests

**Modified Files:**
- `src/kafka/order-tracker.js` - Add deleteOrder method
- `src/kafka/consumer.js` - Add product-matched handler integration
- `src/kafka/__tests__/order-tracker.test.js` - Add tests for deleteOrder method
- `src/kafka/__tests__/consumer.test.js` - Add tests for product-matched handler integration

## Reference Patterns

**order-handler.js** - Reuse for:
- Handler function structure with async/await
- Try/catch error handling pattern
- JSDoc commenting style
- Import pattern for tracker functions
- Error message formatting

**order-tracker.js** - Reuse for:
- Method implementation pattern
- JSDoc documentation style
- Export function pattern
- Map operations for state management

**consumer.js** - Reuse for:
- Topic-specific handler conditional pattern
- Handler import placement
- Existing retry and DLQ logic (no changes needed)

## Event Flow

This feature completes the event-driven order processing workflow:

```
Order Created
    ↓
Generate N Products
    ↓
[Some need review] → product-needs-review topic
[Some auto-pass] → counted as successful
    ↓
User Approves Product → product-matched topic
    ↓
[NEW] Product Matched Handler
    ↓
Remove from Pending + Increment Successful
    ↓
Check: All Products Processed?
    ↓
YES → Publish import-requested + Cleanup Order
NO → Wait for More Approvals
```

## Key Implementation Details

**Order Completion Logic:**
```javascript
const orderState = getOrderState(orderId);
if (orderState && orderState.pendingProductIds.length === 0) {
  // Order is complete - all products processed
  await produce("import-requested", {
    orderId: orderState.orderId,
    timestamp: Date.now(),
    totalProducts: orderState.totalProducts,
    successfulCount: orderState.successfulCount
  });
  deleteOrder(orderId);
}
```

**Consumer Integration:**
```javascript
// In processMessage() function
if (topic === 'order-created') {
  await handleOrderCreated(messageValue);
} else if (topic === 'product-matched') {
  await handleProductMatched(messageValue);
}
```

**deleteOrder Method:**
```javascript
export function deleteOrder(orderId) {
  orderStore.delete(orderId);
}
```

## Success Metrics

This feature enables:
- **Event Aggregation Pattern**: Demonstrates how multiple async events aggregate to trigger completion
- **Memory Management**: Orders are cleaned up after processing
- **Completion Detection**: System knows when all products for an order are done
- **Learning Value**: Users see import-requested appear only when order is complete
