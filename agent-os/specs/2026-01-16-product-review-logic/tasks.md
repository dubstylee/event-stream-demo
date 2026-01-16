# Task Breakdown: Product Review Tracking Infrastructure

## Overview
Total Tasks: 12

This feature creates an in-memory tracking module to monitor pending products per order and count products that passed without review, providing state infrastructure for future completion detection (roadmap item 7).

## Task List

### Backend Module

#### Task Group 1: Order Tracker Module
**Dependencies:** None

- [x] 1.0 Complete order tracker module
  - [x] 1.1 Write 4-6 focused tests for order-tracker functionality
    - Test `initializeOrder()` creates correct initial state
    - Test `addPendingProduct()` adds product to pending array
    - Test `addSuccessfulProduct()` increments counters correctly
    - Test `getOrderState()` returns expected state structure
    - Test `getGlobalSuccessfulCount()` returns cumulative count across orders
    - Use Vitest as test framework per tech stack
  - [x] 1.2 Create `src/kafka/order-tracker.js` module with singleton pattern
    - Use JavaScript `Map` for O(1) lookups by orderId
    - Store per-order data: `orderId -> { totalProducts, pendingProductIds[], successfulCount }`
    - Follow singleton pattern from `src/kafka/producer.js`
    - Add JSDoc comments following existing code style
  - [x] 1.3 Implement state mutation methods
    - `initializeOrder(orderId, totalProducts)` - Creates new order entry
    - `addPendingProduct(orderId, productId)` - Adds productId to pending array
    - `addSuccessfulProduct(orderId)` - Increments per-order and global successful count
    - `removePendingProduct(orderId, productId)` - Removes from pending (for roadmap item 7)
  - [x] 1.4 Implement state query API
    - `getOrderState(orderId)` - Returns tracking state for specific order
    - `getPendingProducts(orderId)` - Returns array of pending productIds
    - `getGlobalSuccessfulCount()` - Returns total successful products across all orders
    - `getAllOrders()` - Returns all tracked orders for debugging/monitoring
  - [x] 1.5 Ensure order tracker tests pass
    - Run ONLY the tests written in 1.1
    - Verify all state mutations work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 1.1 pass
- Module exports all required methods
- Map-based storage provides O(1) lookups
- Singleton pattern ensures consistent state across imports

### Integration Layer

#### Task Group 2: Order Handler Integration
**Dependencies:** Task Group 1

- [x] 2.0 Complete order handler integration
  - [x] 2.1 Write 3-4 focused tests for integration behavior
    - Test `handleOrderCreated()` calls `initializeOrder()` with correct params
    - Test products needing review are registered via `addPendingProduct()`
    - Test products passing review are counted via `addSuccessfulProduct()`
    - Mock order-tracker module to verify integration calls
  - [x] 2.2 Import order-tracker into order-handler
    - Add import statement for order-tracker module
    - No changes to existing imports
  - [x] 2.3 Integrate tracking calls into `handleOrderCreated()`
    - Call `initializeOrder(orderId, products.length)` after generating products
    - After `filterProductsForReview()`, call `addPendingProduct()` for each product needing review
    - Calculate successful count: `products.length - productsNeedingReview.length`
    - Call `addSuccessfulProduct()` for each successful product (or batch update)
  - [x] 2.4 Add logging for tracking operations
    - Log when order tracking is initialized
    - Log count of pending vs successful products tracked
    - Follow existing `[Order Handler]` log prefix pattern
  - [x] 2.5 Ensure integration tests pass
    - Run ONLY the tests written in 2.1
    - Verify tracking calls are made correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 3-4 tests written in 2.1 pass
- Order handler remains focused on Kafka message handling
- Tracking module is called with correct data
- No changes to existing Kafka publishing behavior

### Testing

#### Task Group 3: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-2

- [x] 3.0 Review existing tests and fill critical gaps only
  - [x] 3.1 Review tests from Task Groups 1-2
    - Review the 4-6 tests written for order-tracker (Task 1.1)
    - Review the 3-4 tests written for integration (Task 2.1)
    - Total existing tests: approximately 7-10 tests
  - [x] 3.2 Analyze test coverage gaps for THIS feature only
    - Identify critical workflows that lack test coverage
    - Focus ONLY on gaps related to order tracking functionality
    - Prioritize end-to-end workflow: order received -> products tracked
  - [x] 3.3 Write up to 5 additional strategic tests maximum
    - Add maximum of 5 new tests to fill identified critical gaps
    - Focus on integration between order-tracker and order-handler
    - Consider: multiple orders, state isolation between orders
    - Do NOT write tests for edge cases or error states unless business-critical
  - [x] 3.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Expected total: approximately 12-15 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 12-15 tests total)
- Critical order tracking workflows are covered
- No more than 5 additional tests added when filling gaps
- Testing focused exclusively on this spec's feature requirements

## Execution Order

Recommended implementation sequence:

1. **Order Tracker Module (Task Group 1)** - Create the standalone tracking module first since it has no dependencies and establishes the core state management infrastructure.

2. **Order Handler Integration (Task Group 2)** - Integrate the tracking module into the existing order handler flow, leveraging the completed module from Task Group 1.

3. **Test Review and Gap Analysis (Task Group 3)** - Review all tests and add strategic gap coverage to ensure the feature is properly validated.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/kafka/order-tracker.js` | Create | New tracking module with Map-based state storage |
| `src/kafka/order-handler.js` | Modify | Add imports and tracking calls after filtering |
| `src/kafka/__tests__/order-tracker.test.js` | Create | Unit tests for tracker module |
| `src/kafka/__tests__/order-handler-tracking.test.js` | Create | Integration tests for handler + tracker |

## Notes

- **State Reset on Restart**: In-memory storage is acceptable for PoC; state resets on server restart
- **Separation of Concerns**: Tracking module handles only state management (no Kafka logic)
- **Future Compatibility**: Clean interfaces allow roadmap item 7 to import tracking module directly
- **No API Endpoints**: This is an internal module only; no HTTP endpoints needed