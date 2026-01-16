# Spec Requirements: Product Review Logic

## Initial Description
Product Review Logic from the roadmap - Add random review chance logic to product generation, publishing to product-needs-review when flagged, and tracking pending products per order.

Source: Roadmap item #6

## Requirements Discussion

### First Round Questions

**Q1:** For the random review chance logic, I assume we want a configurable probability (e.g., 30% chance a product needs review) that we can adjust for demo purposes. Is that correct, or should it be a fixed percentage?
**Answer:** Leave as is (existing implementation uses configurable probability from `order-config.json`)

**Q2:** For tracking pending products per order, I assume we need in-memory state management since this is a PoC (rather than Redis or database persistence). Is that correct?
**Answer:** In-memory for PoC

**Q3:** The "tracking pending products per order" functionality - is this just the tracking infrastructure (storing which products are pending for each order), or should this spec also include the completion detection logic that triggers import-requested?
**Answer:** Just the tracking infrastructure - completion detection will be handled in roadmap item 7

**Q4:** When a product passes the review check (does NOT need review), should we still publish an event (e.g., to product-matched directly), or do those products simply not generate any event?
**Answer:** No events needed, but keep a master counter of "successful" products

**Q5:** Should products needing review be published as individual messages or batched per order?
**Answer:** Individual messages is fine for PoC

**Q6:** Are there any restrictions on modifying the existing review-chance.js, order-handler.js, or product-generator.js files?
**Answer:** N/A - no restrictions

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Review Chance Logic - Path: `src/kafka/review-chance.js` - Contains `shouldProductNeedReview()` and `filterProductsForReview()` functions (already implemented)
- Feature: Order Handler - Path: `src/kafka/order-handler.js` - Processes order-created messages and publishes to product-needs-review topic (already implemented)
- Feature: Product Generator - Path: `src/kafka/product-generator.js` - Generates random product IDs (already implemented)
- Feature: Order Config - Path: `src/kafka/order-config.json` - Configuration for review probability and product ID format

### Follow-up Questions

No follow-up questions were needed - the user's answers were comprehensive and clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Integrate the existing review chance logic (`shouldProductNeedReview()`) into the product generation flow
- Publish individual messages to `product-needs-review` topic for products flagged for review (already implemented in `order-handler.js`)
- Implement in-memory tracking of pending products per order (orderId -> list of productIds awaiting review)
- Maintain a counter of "successful" products (those that passed without needing review)
- Expose tracking state for use by future completion detection (roadmap item 7)

### Existing Implementation Status
The following is already implemented and should be left as-is:
- `src/kafka/review-chance.js` - Review probability logic with configurable chance
- `src/kafka/order-handler.js` - Order processing that generates products and publishes to product-needs-review
- `src/kafka/product-generator.js` - Random product ID generation
- Individual message publishing (not batched)

### New Implementation Needed
- In-memory state store for tracking pending products per order
- Counter for products that passed without review ("successful" products)
- Integration of tracking into the order processing flow
- Exports/API for other modules to query tracking state (for roadmap item 7)

### Reusability Opportunities
- Existing Kafka producer infrastructure (`src/kafka/producer.js`)
- Existing order-handler flow can be extended with tracking calls
- Pattern from existing modules for configuration via JSON files

### Scope Boundaries

**In Scope:**
- In-memory state management for tracking pending products per order
- Counter for successful products (those not needing review)
- Integration with existing order-handler flow
- Exporting state for use by downstream features

**Out of Scope:**
- Completion detection logic (deferred to roadmap item 7)
- Publishing to `import-requested` topic (roadmap item 8)
- Frontend UI components for review list (roadmap item 7)
- Persistent storage (Redis, database) - in-memory is sufficient for PoC
- Batched message publishing

### Technical Considerations
- Use in-memory JavaScript data structures (Map/Object) for state storage
- State will reset on server restart (acceptable for PoC)
- Must track: orderId -> { totalProducts, pendingProducts[], successfulCount }
- Tracking module should be separate from order-handler for clean separation of concerns
- No changes needed to existing review-chance.js logic
- Individual Kafka messages per product (already implemented)