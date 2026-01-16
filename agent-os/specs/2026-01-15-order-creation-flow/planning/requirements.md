# Spec Requirements: Order Creation Flow

## Initial Description
From the product roadmap:
"Implement the order entry form that publishes to order-created topic, with the consumer that generates N random product strings per order"

This is part of an event-stream demo project that:
- Uses Kafka for message streaming (4 topics)
- Has an Express API with Socket.io for real-time browser updates
- Has a React frontend dashboard with an order entry form (currently non-functional)

The order creation flow should:
1. Enable the order entry form to submit orders
2. Publish orders to the `order-created` Kafka topic
3. Implement a consumer that processes `order-created` messages and generates N random product strings per order

## Requirements Discussion

### First Round Questions

**Q1:** What should the structure of the order message be when published to `order-created`? Should it include:
- Order ID (from form input)
- Product Count (from form input)
- Timestamp (server-generated or client?)
- Any other fields (order status, user info, etc.)?

**Answer:** Order ID, Product Count, and server-generated timestamp.

**Q2:** How should the random product strings be generated? 
- What format should they use? (e.g., "PROD-12345", "Product-ABC-XYZ", random UUIDs, etc.)
- What length/characteristics should they have?
- Should they be unique per order, globally unique, or can duplicates exist?

**Answer:** "product-123" format is fine, 10 numeric characters, unique per order.

**Q3:** Where should the product generation logic live?
- In a new module (e.g., `src/order/` or `src/business-logic/`)?
- As part of the Kafka consumer handler?
- As a separate service/function?

**Answer:** Part of the Kafka consumer.

**Q4:** What should happen to the generated products?
- Should they be published to a Kafka topic immediately? (If so, which one?)
- Should they be stored/accumulated somewhere?
- Should they be processed further in this spec, or is that deferred to later specs?

**Answer:** Based on the random chance of needing review, the products should produce a message to the product-needs-review topic.

**Q5:** What form validation should be implemented?
- Client-side validation (required fields, number range, etc.)?
- Server-side validation?
- Both?
- What are the validation rules? (e.g., Order ID must be non-empty, Product Count must be > 0, etc.)

**Answer:** Client-side validation for numeric inputs.

**Q6:** What user feedback should be provided after form submission?
- Success message/notification?
- Error message display?
- Form reset on success?
- Loading state during submission?
- Should the form be disabled while submitting?

**Answer:** Loading state (form disabled) on submission, success/error toast and reset form on success.

**Q7:** How should errors be handled?
- Network errors (server unavailable)?
- Kafka errors (publishing failed)?
- Validation errors?
- Should errors be displayed inline, as toasts, or in a specific error area?

**Answer:** Errors can just be written to the console.

**Q8:** Should the order entry form be enhanced in any way for this spec?
- Add any new fields?
- Change styling/behavior?
- Add any new UI elements (loading spinner, success indicator, etc.)?

**Answer:** N/A (no enhancements needed beyond what's already in Q6).

**Q9:** What should be explicitly excluded from this spec?
- Product review logic? (deferred to "Product Review Logic" spec)
- Product matching/approval? (deferred to later specs)
- Import completion logic? (deferred to later specs)

**Answer:** Yes, product review logic, product matching/approval, and import completion logic are excluded (deferred to later specs).

**Q10:** Are there any visual assets, mockups, or design specifications for this feature?

**Answer:** N/A (no visual assets provided).

### Visual Assets

**Files Provided:**
No visual assets provided.

**Visual Insights:**
Not applicable.

### Existing Code to Reference

- Order entry form: `client/src/components/OrderEntryForm.jsx` (currently non-functional)
- Express API produce endpoint: `POST /api/kafka/produce` in `src/app.js`
- Kafka module: `src/kafka/index.js` (producer and consumer infrastructure)
- Socket.io integration: Real-time message updates already working

### Follow-up Questions

No follow-up questions needed.

## Requirements Summary

### Functional Requirements

**Frontend (React):**
- Enable order entry form submission functionality
- Implement client-side validation for numeric inputs (Product Count)
- Add loading state during form submission (disable form)
- Display success/error toast notifications
- Reset form on successful submission
- Log errors to console

**Backend (Express/Kafka):**
- Publish order messages to `order-created` topic with structure:
  - `orderId` (string, from form input)
  - `productCount` (number, from form input)
  - `timestamp` (number, server-generated)
- Implement Kafka consumer handler for `order-created` topic
- Generate N random product strings per order:
  - Format: "product-1234567890" (10 numeric characters)
  - Unique per order
- Based on random chance, publish products to `product-needs-review` topic
- Product generation logic should be part of the Kafka consumer handler

### Reusability Opportunities

- Form submission pattern can be reused for future forms
- Toast notification system can be reused across the application
- Product generation logic may be extended in future specs

### Scope Boundaries

**In Scope:**
- Order entry form submission to Express API
- Publishing orders to `order-created` Kafka topic
- Kafka consumer handler for `order-created` messages
- Random product string generation (format: "product-1234567890")
- Publishing products to `product-needs-review` topic based on random chance
- Client-side form validation
- Loading states and user feedback (toasts)
- Form reset on success
- Error logging to console

**Out of Scope:**
- Product review UI/workflow (deferred to "Product Review Logic" spec)
- Product matching/approval logic (deferred to later specs)
- Import completion logic (deferred to later specs)
- Server-side validation (client-side only)
- Complex error handling UI (console logging only)
- Visual design changes to form (use existing styling)

### Technical Considerations

- Use existing `POST /api/kafka/produce` endpoint for publishing orders
- Extend Kafka consumer handler in `src/kafka/consumer.js` or create new handler module
- Product generation should use random number generation (10 digits)
- Random review chance logic needs to be configurable (probability/percentage)
- Toast notifications need to be implemented (may need a toast component/library)
- Form state management with React hooks (useState for loading, success, error states)
