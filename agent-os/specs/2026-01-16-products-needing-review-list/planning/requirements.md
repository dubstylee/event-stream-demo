# Spec Requirements: Products Needing Review List

## Initial Description
Products Needing Review List from the roadmap - Create the review list component that consumes product-needs-review messages, displays pending products, and handles click-to-approve actions.

## Requirements Discussion

### First Round Questions

**Q1:** Where should the Products Needing Review list appear in the dashboard layout? I'm assuming left column below the order entry form, or should it be in the right column with the topic widgets?
**Answer:** Left column below order entry form

**Q2:** For display, I assume we show the product ID and perhaps the order ID for context. Should there be an explicit "Approve" button per item, or is clicking the row sufficient?
**Answer:** Keep it minimal - just product ID, clicking the row should approve (no separate button)

**Q3:** When a product is approved (clicked), I assume we: (a) POST to the backend to publish to product-matched, (b) optimistically remove it from the list, and (c) show a brief toast/confirmation. Is that correct?
**Answer:** Yes to POST to product-matched and optimistic UI removal, but NO toast needed - user will see the kafka message in the stream as confirmation

**Q4:** For the product-matched message structure, should it mirror product-needs-review (productId, orderId, timestamp) or include additional fields?
**Answer:** Same structure as product-needs-review is fine for now

**Q5:** Should the list persist across page refreshes (requiring backend storage), or is it acceptable to only show products received since the page loaded?
**Answer:** List should persist if feasible, but do NOT add storage infrastructure if nothing exists

**Q6:** Is there a maximum number of items to display before scrolling, or should it grow unbounded?
**Answer:** 20 items plus scrolling

**Q7:** When there are no products awaiting review, should we show an empty state message or hide the component entirely?
**Answer:** "No products awaiting review" message is acceptable

**Q8:** Is there anything specific you want to exclude from this feature's scope?
**Answer:** N/A

### Existing Code to Reference

**Similar Features Identified:**
- Feature: TopicWidget - Path: `client/src/components/TopicWidget.jsx`
  - Similar scrollable list pattern for displaying messages
- Feature: OrderEntryForm - Path: `client/src/components/OrderEntryForm.jsx`
  - API interaction pattern for POST requests
- Feature: useKafkaMessages hook - Path: `client/src/hooks/useKafkaMessages.js`
  - WebSocket handling for receiving Kafka messages via Socket.io

### Follow-up Questions
No follow-up questions were needed. The user's answers were comprehensive and clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Display a list of products awaiting review in the left column below the order entry form
- Consume messages from the `product-needs-review` topic via Socket.io/WebSocket
- Show only the product ID for each pending item (minimal display)
- Clicking a row approves the product (no separate button needed)
- On click: POST to backend endpoint to publish `product-matched` message
- Optimistically remove the item from the list upon click
- No toast notification needed - user sees confirmation via Kafka message stream in topic widgets
- Display up to 20 items before scrolling; scroll within component for additional items
- Show "No products awaiting review" message when list is empty
- Persist list across page refreshes only if storage infrastructure already exists; otherwise, show products received since page load

### Reusability Opportunities
- `TopicWidget.jsx` - Reuse scrollable list pattern and styling approach
- `OrderEntryForm.jsx` - Follow same API interaction pattern for POST request
- `useKafkaMessages.js` - Use for subscribing to `product-needs-review` topic messages

### Scope Boundaries
**In Scope:**
- New React component for the review list
- Socket.io subscription to `product-needs-review` topic
- Click handler that POSTs to backend for `product-matched` publishing
- Optimistic UI removal on approval
- Scrollable list with 20-item visible limit
- Empty state message
- Backend endpoint for approving products (publishing to product-matched)

**Out of Scope:**
- Toast notifications for approval actions
- New persistence/storage infrastructure
- Additional fields beyond productId in the display
- Separate approve button (click-to-approve only)
- Any orderId display in the list items

### Technical Considerations
- Message structure for `product-matched` mirrors `product-needs-review`: `{ productId, orderId, timestamp }`
- Component placement: left column of Dashboard, below OrderEntryForm
- Backend endpoint needed: likely POST `/api/approve-product` or similar
- Leverage existing Socket.io infrastructure for real-time updates
- Follow existing patterns in TopicWidget for scrolling behavior
- Persistence depends on whether any storage mechanism already exists in the codebase