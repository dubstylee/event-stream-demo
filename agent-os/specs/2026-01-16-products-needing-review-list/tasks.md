# Task Breakdown: Products Needing Review List

## Overview
Total Tasks: 18

This feature creates a React component that displays products awaiting review, consumes `product-needs-review` Kafka messages via Socket.io, and enables click-to-approve functionality that publishes to the `product-matched` topic.

## Task List

### Frontend Component Layer

#### Task Group 1: ProductsNeedingReview Component Foundation
**Dependencies:** None

- [x] 1.0 Complete ProductsNeedingReview component foundation
  - [x] 1.1 Write 4 focused tests for component foundation
    - Test component renders with empty state message "No products awaiting review"
    - Test component renders list of products when items exist
    - Test component limits visible items to 20 with scrolling
    - Test deduplication of products by productId
  - [x] 1.2 Create ProductsNeedingReview component shell
    - Create file at `client/src/components/ProductsNeedingReview.jsx`
    - Use `<article>` wrapper matching TopicWidget pattern
    - Add header with "Products Needing Review" title
    - Apply styling: `rounded-lg border border-gray-200 bg-white shadow-sm`
  - [x] 1.3 Implement local state management for pending products
    - useState for `pendingProducts` array
    - Each item contains: `{ productId, orderId, timestamp }`
    - Dedupe logic by productId when adding items
    - Maximum 20 items in state
  - [x] 1.4 Build list display UI
    - Display only `productId` for each item (minimal per requirements)
    - Scrollable container: `h-64 overflow-y-auto` (sized for 20 items)
    - Empty state: centered "No products awaiting review" message
    - Follow TopicWidget list structure with `<ul>` and `<li>` elements
  - [x] 1.5 Ensure component foundation tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify component renders correctly in all states

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- Component renders with proper card styling matching TopicWidget
- Empty state displays correctly
- List displays productId only
- Scrolling works when items exceed visible area

---

#### Task Group 2: Socket.io Message Subscription
**Dependencies:** Task Group 1

- [x] 2.0 Complete Socket.io subscription integration
  - [x] 2.1 Write 3 focused tests for message subscription
    - Test component receives and displays messages from `product-needs-review` topic
    - Test component filters messages for correct topic only
    - Test new messages are added to existing list (accumulation)
  - [x] 2.2 Add socket prop and subscription logic
    - Accept `socket` prop from Dashboard
    - Subscribe to `kafka:message` events on mount
    - Filter for `topic === "product-needs-review"` only
    - Clean up subscription on unmount
  - [x] 2.3 Implement message handling
    - Extract `productId`, `orderId`, `timestamp` from message payload
    - Add to pendingProducts state with deduplication
    - Trim to 20 items if exceeding limit (keep newest)
  - [x] 2.4 Ensure Socket.io subscription tests pass
    - Run ONLY the 3 tests written in 2.1
    - Verify messages accumulate correctly

**Acceptance Criteria:**
- The 3 tests written in 2.1 pass
- Component receives real-time messages via Socket.io
- Only `product-needs-review` topic messages are processed
- Duplicate products (by productId) are not added

---

#### Task Group 3: Click-to-Approve Interaction
**Dependencies:** Task Group 2

- [x] 3.0 Complete click-to-approve functionality
  - [x] 3.1 Write 4 focused tests for approval interaction
    - Test clicking row removes item from list (optimistic update)
    - Test clicking row triggers POST to `/api/kafka/produce`
    - Test item is restored to list if API call fails
    - Test keyboard activation works (Enter and Space keys)
  - [x] 3.2 Add interactive row styling and attributes
    - Apply `cursor-pointer` and `hover:bg-gray-50` to list items
    - Add `role="button"` for accessibility
    - Add `tabIndex={0}` for keyboard focus
    - Add visual focus indicator with `focus:outline-none focus:ring-2 focus:ring-blue-500`
  - [x] 3.3 Implement click handler with optimistic UI
    - Track `processingId` state to disable row during API call
    - Immediately remove clicked item from list (store temporarily)
    - POST to `http://localhost:4000/api/kafka/produce`
    - Request body: `{ topic: "product-matched", message: { productId, orderId, timestamp } }`
    - Follow fetch pattern from OrderEntryForm (async/await, try/catch)
  - [x] 3.4 Implement error recovery
    - If API call fails, restore item to pendingProducts list
    - Log error to console (no toast per requirements)
    - Clear processingId state on success or failure
  - [x] 3.5 Add keyboard event handling
    - `onKeyDown` handler for Enter (key code 13) and Space (key code 32)
    - Prevent default for Space to avoid page scroll
    - Trigger same approval flow as click
  - [x] 3.6 Ensure click-to-approve tests pass
    - Run ONLY the 4 tests written in 3.1
    - Verify optimistic update and error recovery work

**Acceptance Criteria:**
- The 4 tests written in 3.1 pass
- Rows are visually interactive with hover and focus states
- Clicking removes item immediately (optimistic UI)
- Failed API calls restore the item to the list
- Keyboard navigation works (Tab to focus, Enter/Space to activate)
- Double-click prevention while request is in flight

---

#### Task Group 4: localStorage Persistence
**Dependencies:** Task Group 3

- [x] 4.0 Complete localStorage persistence
  - [x] 4.1 Write 3 focused tests for persistence
    - Test pending products are saved to localStorage on state change
    - Test pending products are loaded from localStorage on mount
    - Test Socket.io messages merge with persisted items (no duplicates)
  - [x] 4.2 Implement load from localStorage on mount
    - Storage key: `products-needing-review`
    - Parse JSON from localStorage on component mount
    - Initialize pendingProducts state with persisted data
    - Handle missing/invalid data gracefully (default to empty array)
  - [x] 4.3 Implement save to localStorage on state change
    - useEffect to sync pendingProducts to localStorage
    - Debounce writes to avoid excessive storage operations (300ms)
    - Stringify array to JSON before storing
  - [x] 4.4 Merge Socket.io messages with persisted data
    - When new message arrives, check against existing items
    - Dedupe by productId to prevent duplicates
    - Persisted items + new items, limited to 20 total
  - [x] 4.5 Ensure localStorage tests pass
    - Run ONLY the 3 tests written in 4.1
    - Verify persistence works across simulated page refresh

**Acceptance Criteria:**
- The 3 tests written in 4.1 pass
- Products persist in localStorage
- Products load on component mount
- No duplicate products after page refresh with new messages

---

### Dashboard Integration Layer

#### Task Group 5: Dashboard Integration
**Dependencies:** Task Group 4

- [x] 5.0 Complete Dashboard integration
  - [x] 5.1 Write 2 focused tests for integration
    - Test ProductsNeedingReview renders in Dashboard left column
    - Test socket prop is passed correctly to ProductsNeedingReview
  - [x] 5.2 Import and add ProductsNeedingReview to Dashboard
    - Import component in `client/src/components/Dashboard.jsx`
    - Add below OrderEntryForm in left column section
    - Pass `socket` prop from useSocket hook
  - [x] 5.3 Update left column layout
    - Wrap OrderEntryForm and ProductsNeedingReview in flex column container
    - Add `gap-6` spacing between components
    - Maintain existing responsive behavior
  - [x] 5.4 Ensure integration tests pass
    - Run ONLY the 2 tests written in 5.1
    - Verify component appears correctly in Dashboard

**Acceptance Criteria:**
- The 2 tests written in 5.1 pass
- ProductsNeedingReview appears below OrderEntryForm
- Component receives socket prop and functions correctly
- Layout is visually consistent with existing components

---

### Testing Layer

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and fill critical gaps
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review 4 tests from Task 1.1 (component foundation)
    - Review 3 tests from Task 2.1 (Socket.io subscription)
    - Review 4 tests from Task 3.1 (click-to-approve)
    - Review 3 tests from Task 4.1 (localStorage)
    - Review 2 tests from Task 5.1 (Dashboard integration)
    - Total existing tests: 16 tests
  - [x] 6.2 Analyze test coverage gaps for this feature only
    - Identify critical user workflows that lack coverage
    - Focus on end-to-end approval flow
    - Check accessibility requirements are tested
  - [x] 6.3 Write up to 6 additional tests to fill critical gaps
    - End-to-end: full flow from message receipt to approval
    - Accessibility: screen reader announcements for list updates
    - Edge case: rapid successive approvals
    - Error state: network failure handling
    - State management: 20-item limit enforcement with mixed sources
    - Integration: component interaction with real Socket.io events
  - [x] 6.4 Run all feature-specific tests
    - Run all tests from groups 1-5 plus new tests from 6.3
    - Expected total: approximately 22 tests
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 22 tests total)
- Critical user workflows are covered
- No more than 6 additional tests added
- Testing focused on this feature only

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Component Foundation** - Build the basic component shell with state and UI
2. **Task Group 2: Socket.io Subscription** - Add real-time message handling
3. **Task Group 3: Click-to-Approve** - Implement the core interaction with API calls
4. **Task Group 4: localStorage Persistence** - Add cross-session persistence
5. **Task Group 5: Dashboard Integration** - Wire component into the main Dashboard
6. **Task Group 6: Test Review** - Verify coverage and fill gaps

## Files to Create/Modify

**New Files:**
- `client/src/components/ProductsNeedingReview.jsx` - Main component
- `client/src/components/__tests__/ProductsNeedingReview.test.jsx` - Component tests

**Modified Files:**
- `client/src/components/Dashboard.jsx` - Add ProductsNeedingReview import and render

## Reference Patterns

**TopicWidget.jsx** - Reuse for:
- Card structure with `<article>` wrapper
- Header styling with border-b
- Scrollable container pattern
- Empty state message styling

**OrderEntryForm.jsx** - Reuse for:
- Async fetch pattern for POST requests
- Loading state management
- Error handling with console.error

**useKafkaMessages.js** - Reference for:
- Socket.io subscription pattern
- Message filtering by topic
- State update patterns