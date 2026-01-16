# Spec Initialization

## Spec Name
Products Needing Review List

## Initial Description
Products Needing Review List from the roadmap - Create the review list component that consumes product-needs-review messages, displays pending products, and handles click-to-approve actions.

## Source
Roadmap item #7

## Roadmap Context
From `agent-os/product/roadmap.md`:
> 7. [ ] Products Needing Review List — Create the review list component that consumes product-needs-review messages, displays pending products, and handles click-to-approve actions `M`

## Mission Context
From `agent-os/product/mission.md`:
> **Products Needing Review List:** A consumable queue UI where users can see products awaiting review and take action on them, demonstrating consumer-driven workflows
> **Manual Approval Workflow:** Clicking a product triggers the product-matched event and removes it from the list, showing how user actions integrate with event streams

## Dependencies
- **Roadmap Item #6 (Product Review Logic)**: Spec exists at `agent-os/specs/2026-01-16-product-review-logic/`
  - Creates `order-tracker.js` module for tracking pending products per order
  - Provides `getPendingProducts(orderId)` and other state query methods
  - Products are published to `product-needs-review` topic by `order-handler.js`

## Technical Context
- Products flow: order-created -> order-handler.js -> product-needs-review topic
- Messages on `product-needs-review` contain: `{ productId, orderId, timestamp }`
- Frontend receives messages via Socket.io (`kafka:message` events)
- Existing `useKafkaMessages` hook manages message state per topic
- Dashboard has two-column layout with order form on left, topic widgets on right
- Clicking approve should trigger `product-matched` topic

## Existing Components to Reference
- `client/src/components/TopicWidget.jsx` - Similar list display pattern
- `client/src/components/OrderEntryForm.jsx` - Form/API interaction pattern
- `client/src/hooks/useKafkaMessages.js` - Socket.io message handling
- `client/src/components/Dashboard.jsx` - Layout integration point