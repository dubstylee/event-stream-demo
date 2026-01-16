# Specification: Products Needing Review List

## Goal
Create a React component that displays products awaiting review, consumes `product-needs-review` Kafka messages via Socket.io, and enables click-to-approve functionality that publishes to `product-matched` topic.

## User Stories
- As a reviewer, I want to see a list of products awaiting my review so that I can quickly identify pending items
- As a reviewer, I want to click a product row to approve it so that I can efficiently process reviews without additional UI steps

## Specific Requirements

**ProductsNeedingReview Component**
- Create new component at `client/src/components/ProductsNeedingReview.jsx`
- Render in left column of Dashboard, positioned below OrderEntryForm
- Match styling conventions from TopicWidget (rounded-lg border, shadow-sm, white bg)
- Component header displays "Products Needing Review" title
- Use semantic HTML with `<article>` wrapper and proper ARIA attributes

**Message Subscription**
- Subscribe to `product-needs-review` topic messages via existing Socket.io infrastructure
- Filter incoming `kafka:message` events for `product-needs-review` topic
- Extract `productId`, `orderId`, and `timestamp` from each message
- Accumulate unique products in local component state (dedupe by productId)

**List Display**
- Display only the `productId` for each pending item (minimal display per requirements)
- Maximum 20 visible items before scrolling; use `overflow-y-auto` with fixed height
- Show "No products awaiting review" centered message when list is empty
- Each row should be visually interactive (cursor pointer, hover state)

**Click-to-Approve Interaction**
- Clicking any row triggers approval flow (no separate button)
- Row should indicate clickable nature with `cursor-pointer` and `hover:bg-gray-50`
- Disable row interaction while approval request is in flight (prevent double-clicks)
- Add appropriate keyboard accessibility (`role="button"`, `tabIndex`, `onKeyDown` for Enter/Space)

**Approval API Call**
- POST to `http://localhost:4000/api/kafka/produce` on row click
- Request body: `{ topic: "product-matched", message: { productId, orderId, timestamp } }`
- Follow same fetch pattern as OrderEntryForm (async/await, error handling)
- No toast notification on success (user sees confirmation via Kafka message stream)

**Optimistic UI Update**
- Immediately remove clicked item from list upon click (before API response)
- If API call fails, restore the item to the list and log error to console
- Store removed item temporarily to enable restoration on failure

**State Persistence**
- No new storage infrastructure exists in the codebase; localStorage/sessionStorage not currently used
- Per requirements, persist only if feasible without adding new infrastructure
- Implementation should use localStorage to persist pending products array
- On mount, load persisted items and merge with newly received Socket.io messages
- On state change, sync to localStorage (debounced to avoid excessive writes)

## Visual Design
No visual mockups provided. Follow existing component styling patterns from TopicWidget and OrderEntryForm.

## Existing Code to Leverage

**TopicWidget.jsx**
- Reuse scrollable container pattern with `h-48 overflow-y-auto` (adjust height for 20 items)
- Follow same card structure: `<article>` with header and content sections
- Copy empty state pattern for "No products awaiting review" message
- Use same border, shadow, and spacing classes for visual consistency

**OrderEntryForm.jsx**
- Follow async fetch pattern for POST to `/api/kafka/produce`
- Reuse error handling approach (try/catch with console.error)
- Reference loading state pattern for disabling interactions during API calls

**useKafkaMessages.js**
- Already subscribes to `product-needs-review` topic in TOPICS array
- Messages are broadcast to Dashboard via existing topicState
- Component can access messages via props passed from Dashboard or use direct socket subscription
- Message structure confirmed: `{ message: { productId, orderId, timestamp }, partition, offset, timestamp }`

**useSocket.js**
- Socket instance available in Dashboard and can be passed as prop
- Use `socket.on("kafka:message", handler)` pattern for direct subscription if needed

**Dashboard.jsx**
- Add ProductsNeedingReview component to left column section below OrderEntryForm
- Pass socket instance or topicState as prop depending on implementation approach

## Out of Scope
- Toast notifications for approval actions
- Displaying orderId in the list items (only productId shown)
- Separate approve button (click-to-approve only)
- New backend storage infrastructure (database, Redis, etc.)
- Backend persistence of pending products (frontend localStorage only)
- Batch approval functionality (single item approval only)
- Undo/restore functionality for approved items
- Filtering or sorting capabilities
- Search functionality within the list
- Product details expansion or modal view