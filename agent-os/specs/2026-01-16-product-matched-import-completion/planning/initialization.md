# Spec Initialization

## Spec Name
Product Matched and Import Completion

## Initial Description
Product Matched and Import Completion from the roadmap - Implement product-matched publishing on approval, track remaining products per order, and publish import-requested when all products are processed.

## Source
Roadmap item #8

## Roadmap Context
From `agent-os/product/roadmap.md`:
> 8. [ ] Product Matched and Import Completion — Implement product-matched publishing on approval, track remaining products per order, and publish import-requested when all products are processed `M`

## Mission Context
From `agent-os/product/mission.md`:
> **Event Aggregation Pattern:** The import-requested event only fires when all products for an order are processed, demonstrating aggregation and completion detection

## Dependencies
- **Roadmap Item #7 (Products Needing Review List)**: Spec exists at `agent-os/specs/2026-01-16-products-needing-review-list/`
  - Creates the review list component with click-to-approve functionality
  - POSTs to backend to publish `product-matched` messages
  - Provides the user interaction that triggers product approval

- **Roadmap Item #6 (Product Review Logic)**: Spec exists at `agent-os/specs/2026-01-16-product-review-logic/`
  - Creates `order-tracker.js` module for tracking pending products per order
  - Provides `getPendingProducts(orderId)` and state query methods
  - Tracks which products have been generated vs matched for each order

## Technical Context
- Products flow through: order-created -> order-handler.js -> product-needs-review OR direct completion
- User approval triggers: product-needs-review -> review list component -> backend endpoint -> product-matched topic
- Need to consume `product-matched` messages to track order completion
- When all products for an order are matched, publish to `import-requested` topic
- Order tracker already exists (`src/kafka/order-tracker.js`) for tracking pending products per order
- Consumer infrastructure already handles multiple topics via `src/kafka/consumer.js`

## Existing Components to Reference
- `src/kafka/order-handler.js` - Handles order-created messages and product generation
- `src/kafka/order-tracker.js` - Tracks pending products per order (from spec #6)
- `src/kafka/consumer.js` - Consumer setup for multiple topics
- `src/kafka/producer.js` - Producer instance for publishing messages
- `src/app.js` - Express server with Socket.io integration
- Backend endpoint from spec #7 - Publishes product-matched messages
