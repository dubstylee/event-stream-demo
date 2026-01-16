# Implementation Tasks: Order Creation Flow

## Overview
Total Tasks: ~25

This spec implements the order entry form submission functionality that publishes orders to the `order-created` Kafka topic, and creates a consumer handler that processes these orders to generate N random product strings per order, publishing products to `product-needs-review` topic based on random chance.

## Task Groups

### Frontend: Toast Notification System

#### Task Group 1: Toast Component Implementation
**Dependencies:** None

- [ ] 1.0 Complete Toast notification component
  - [ ] 1.1 Create Toast component structure
    - Location: `client/src/components/Toast.jsx`
    - Accept props: `message` (string), `type` ("success" | "error"), `onClose` (function)
    - Support auto-dismiss after 3-5 seconds
    - Support manual dismiss (close button or click)
  - [ ] 1.2 Implement toast styling with Tailwind CSS
    - Position in top-right corner (fixed positioning)
    - Use consistent colors: green for success, red for error
    - Match dashboard design system
    - Add subtle shadow and border
    - Smooth animations for appear/disappear
  - [ ] 1.3 Implement auto-dismiss functionality
    - Use `useEffect` with `setTimeout` for auto-dismiss
    - Default duration: 4 seconds
    - Clean up timeout on unmount
  - [ ] 1.4 Implement manual dismiss
    - Add close button (X icon)
    - Support click-to-dismiss on toast body
    - Call `onClose` callback when dismissed
  - [ ] 1.5 Create ToastContainer component (optional)
    - Location: `client/src/components/ToastContainer.jsx`
    - Manages multiple toast instances
    - Provides context or state management for toasts
    - Or use simple state management in parent component

**Acceptance Criteria:**
- Toast component displays success and error messages
- Toast auto-dismisses after configured duration
- Toast can be manually dismissed
- Styling matches dashboard design
- Component is reusable

### Frontend: Form Validation and Submission

#### Task Group 2: Form Validation Implementation
**Dependencies:** None

- [ ] 2.0 Complete form validation logic
  - [ ] 2.1 Implement Order ID validation
    - Validate non-empty string (trim whitespace)
    - Check length > 0 after trim
    - Return validation result (boolean or error message)
  - [ ] 2.2 Implement Product Count validation
    - Validate is a number
    - Validate is positive integer > 0
    - Parse string input to integer
    - Return validation result
  - [ ] 2.3 Create validation function
    - Location: In `OrderEntryForm.jsx` or separate utility
    - Function signature: `validateOrder(orderId, productCount)`
    - Returns validation result object
    - Log validation errors to console (per requirements)
  - [ ] 2.4 Integrate validation with form submission
    - Call validation before API request
    - Prevent submission if validation fails
    - Log validation errors to console

**Acceptance Criteria:**
- Order ID must be non-empty after trim
- Product Count must be positive integer > 0
- Validation prevents invalid submissions
- Validation errors logged to console

#### Task Group 3: Form Submission and Loading States
**Dependencies:** Task Groups 1, 2

- [ ] 3.0 Complete form submission functionality
  - [ ] 3.1 Add loading state management
    - Add `isLoading` state using `useState`
    - Set loading to `true` on submission start
    - Set loading to `false` on completion (success or error)
  - [ ] 3.2 Implement form submission handler
    - Update `handleSubmit` function in `OrderEntryForm.jsx`
    - Remove `preventDefault()` only after validation passes
    - Call validation before proceeding
    - Make async API call to `POST /api/kafka/produce`
  - [ ] 3.3 Implement API call
    - Endpoint: `http://localhost:4000/api/kafka/produce`
    - Request body: `{topic: "order-created", message: {orderId: string, productCount: number}}`
    - Use `fetch` API with proper error handling
    - Handle network errors and HTTP errors
  - [ ] 3.4 Implement loading UI
    - Disable form inputs when `isLoading` is `true`
    - Disable submit button when `isLoading` is `true`
    - Optionally show loading text or spinner on button
    - Prevent multiple submissions while loading
  - [ ] 3.5 Implement success handling
    - Show success toast on successful submission
    - Reset form fields (set `orderId` and `productCount` to empty strings)
    - Set loading to `false`
  - [ ] 3.6 Implement error handling
    - Show error toast on failed submission
    - Log errors to console using `console.error()`
    - Set loading to `false`
    - Do not reset form on error (allow user to retry)

**Acceptance Criteria:**
- Form submits to API endpoint correctly
- Loading state disables form during submission
- Success toast appears on successful submission
- Error toast appears on failed submission
- Form resets on success
- Errors logged to console
- Form cannot be submitted multiple times while loading

### Backend: Configuration and Order Handler

#### Task Group 4: Configuration Setup
**Dependencies:** None

- [ ] 4.0 Complete configuration for order processing
  - [ ] 4.1 Create order configuration file
    - Location: `src/order/config.json`
    - Add `reviewChance` property with value `0.3` (30%)
    - Use JSON format
  - [ ] 4.2 Create order directory structure
    - Create `src/order/` directory
    - Create placeholder for `orderHandler.js`
    - Create `__tests__/` directory for tests

**Acceptance Criteria:**
- Configuration file exists with review chance setting
- Directory structure is in place

#### Task Group 5: Product Generation Logic
**Dependencies:** Task Group 4

- [ ] 5.0 Complete product generation implementation
  - [ ] 5.1 Implement product generation function
    - Location: `src/order/orderHandler.js`
    - Function signature: `generateProducts(orderId: string, count: number): string[]`
    - Generate array of unique product strings
  - [ ] 5.2 Implement product string formatting
    - Format: `"product-{10-digit-number}"`
    - Use random number generation for 10-digit portion
    - Ensure exactly 10 digits (pad with leading zeros if needed)
    - Example: "product-1234567890"
  - [ ] 5.3 Implement uniqueness guarantee
    - Ensure no duplicate products within an order
    - Use Set or array tracking to prevent duplicates
    - Regenerate if duplicate detected
  - [ ] 5.4 Add JSDoc comments
    - Document function parameters and return value
    - Document product format and uniqueness requirements

**Acceptance Criteria:**
- Function generates correct number of products
- Product format matches "product-{10-digits}"
- Products are unique within an order
- Numeric portion is exactly 10 digits

#### Task Group 6: Random Review Chance Logic
**Dependencies:** Task Group 5

- [ ] 6.0 Complete review chance implementation
  - [ ] 6.1 Implement review chance function
    - Location: `src/order/orderHandler.js`
    - Function signature: `shouldProductNeedReview(reviewChance: number): boolean`
    - Use `Math.random()` to determine if product needs review
    - Return `true` if random value < reviewChance, else `false`
  - [ ] 6.2 Load review chance from configuration
    - Import configuration from `config.json`
    - Use default value 0.3 if config not found
    - Make review chance configurable

**Acceptance Criteria:**
- Review chance logic works correctly
- Probability matches configured value
- Function is testable and deterministic with mocking

#### Task Group 7: Order Processing Handler
**Dependencies:** Task Groups 5, 6

- [ ] 7.0 Complete order processing handler
  - [ ] 7.1 Create order handler function
    - Location: `src/order/orderHandler.js`
    - Function signature: `processOrder(orderMessage: object): Promise<void>`
    - Accept order message: `{orderId: string, productCount: number, timestamp: number}`
  - [ ] 7.2 Implement order processing logic
    - Extract `orderId` and `productCount` from message
    - Call `generateProducts(orderId, productCount)` to get product array
    - For each product, call `shouldProductNeedReview(reviewChance)`
    - If product needs review, publish to `product-needs-review` topic
  - [ ] 7.3 Implement product publishing
    - Import `produce` from Kafka module
    - For each product needing review, create message:
      - `productId`: string (the product string)
      - `orderId`: string (from original order)
      - `timestamp`: number (Date.now() when product generated)
    - Call `produce("product-needs-review", productMessage)` for each product
    - Handle publishing errors gracefully (log to console.error)
  - [ ] 7.4 Add error handling
    - Wrap processing in try-catch block
    - Log errors to console.error with order details
    - Do not throw errors (let consumer retry logic handle failures)
  - [ ] 7.5 Add JSDoc comments
    - Document function purpose and parameters
    - Document product publishing behavior

**Acceptance Criteria:**
- Handler processes order messages correctly
- Generates correct number of products
- Publishes products needing review to correct topic
- Error handling doesn't crash consumer
- Products published with correct message structure

### Backend: Consumer Integration

#### Task Group 8: Consumer Handler Registration
**Dependencies:** Task Group 7

- [ ] 8.0 Complete consumer integration
  - [ ] 8.1 Register order handler with Kafka consumer
    - Location: `src/kafka/consumer.js` or separate registration file
    - Listen for `kafka:message` events with topic `"order-created"`
    - Call `processOrder(message)` when order message received
  - [ ] 8.2 Implement handler registration
    - Import `processOrder` from `orderHandler.js`
    - Register handler in consumer initialization or event listener
    - Ensure handler doesn't block other topic consumers
    - Process messages asynchronously
  - [ ] 8.3 Add error handling
    - Wrap handler call in try-catch
    - Log errors to console.error
    - Ensure errors don't prevent processing other messages

**Acceptance Criteria:**
- Order handler is registered with consumer
- Handler processes `order-created` messages
- Handler doesn't interfere with other topic consumers
- Errors are handled gracefully

### Backend: Server Timestamp Enhancement

#### Task Group 9: Server-Side Timestamp Addition
**Dependencies:** None (can be done in parallel)

- [ ] 9.0 Complete server timestamp addition
  - [ ] 9.1 Update produce endpoint to add timestamp
    - Location: `src/app.js` in produce endpoint handler
    - When receiving order message, add `timestamp: Date.now()`
    - Add timestamp to message object before publishing to Kafka
    - Ensure timestamp is server-generated (not from client)

**Acceptance Criteria:**
- Order messages include server-generated timestamp
- Timestamp is added before publishing to Kafka

### Testing

#### Task Group 10: Unit Tests for Product Generation
**Dependencies:** Task Group 5

- [ ] 10.0 Complete product generation tests
  - [ ] 10.1 Create test file
    - Location: `src/order/__tests__/orderHandler.test.js`
    - Use Vitest testing framework
  - [ ] 10.2 Test product generation function
    - Test generates correct number of products
    - Test product format matches "product-{10-digits}"
    - Test products are unique within an order
    - Test numeric portion is exactly 10 digits
    - Test with different order IDs and counts

**Acceptance Criteria:**
- All product generation tests pass
- Tests cover format, uniqueness, and count requirements

#### Task Group 11: Unit Tests for Review Chance Logic
**Dependencies:** Task Group 6

- [ ] 11.0 Complete review chance tests
  - [ ] 11.1 Test review chance function
    - Location: `src/order/__tests__/orderHandler.test.js`
    - Test with different probability values
    - Test probability distribution (may need statistical tests)
    - Mock `Math.random()` for deterministic testing

**Acceptance Criteria:**
- Review chance tests pass
- Tests verify probability logic works correctly

#### Task Group 12: Integration Tests for Order Processing
**Dependencies:** Task Group 7

- [ ] 12.0 Complete order processing integration tests
  - [ ] 12.1 Test order handler end-to-end
    - Location: `src/order/__tests__/orderHandler.test.js`
    - Mock Kafka `produce` function
    - Test order processing generates products
    - Test products are published to correct topic
    - Test products that don't need review are not published
    - Test error handling

**Acceptance Criteria:**
- Integration tests verify complete order processing flow
- Tests mock Kafka dependencies correctly

#### Task Group 13: Frontend Integration Tests
**Dependencies:** Task Groups 1, 2, 3

- [ ] 13.0 Complete frontend integration tests
  - [ ] 13.1 Create test file
    - Location: `client/src/components/__tests__/OrderEntryForm.test.jsx`
    - Use Vitest and React Testing Library
  - [ ] 13.2 Test form submission
    - Mock `fetch` API
    - Test form submission calls API correctly
    - Test loading state management
    - Test toast notifications appear
    - Test form reset on success
    - Test error handling
  - [ ] 13.3 Test form validation
    - Test Order ID validation
    - Test Product Count validation
    - Test validation prevents invalid submissions

**Acceptance Criteria:**
- Frontend tests verify form submission flow
- Tests verify validation and user feedback
- Tests mock API calls correctly

### Final Verification

#### Task Group 14: End-to-End Verification
**Dependencies:** All previous task groups

- [ ] 14.0 Complete end-to-end verification
  - [ ] 14.1 Verify order submission flow
    - Start Express server on port 4000
    - Start Vite dev server
    - Submit order through form
    - Verify order appears in `order-created` topic widget
    - Verify products appear in `product-needs-review` topic widget
  - [ ] 14.2 Verify product generation
    - Submit order with product count N
    - Verify approximately N * reviewChance products appear in review topic
    - Verify product format is correct
    - Verify products are unique
  - [ ] 14.3 Verify user feedback
    - Test success toast appears
    - Test error toast appears (simulate error)
    - Test form resets on success
    - Test loading state works correctly

**Acceptance Criteria:**
- End-to-end flow works correctly
- Orders are published and processed
- Products are generated and published correctly
- User feedback works as expected

## Execution Order

Recommended implementation sequence:

1. **Configuration Setup (Task Group 4)** - Foundation for backend
2. **Toast Component (Task Group 1)** - Needed for user feedback
3. **Form Validation (Task Group 2)** - Needed before submission
4. **Product Generation (Task Group 5)** - Core backend logic
5. **Review Chance Logic (Task Group 6)** - Extends product generation
6. **Order Processing Handler (Task Group 7)** - Integrates generation and review logic
7. **Form Submission (Task Group 3)** - Depends on toast and validation
8. **Consumer Integration (Task Group 8)** - Connects handler to Kafka
9. **Server Timestamp (Task Group 9)** - Can be done in parallel
10. **Testing (Task Groups 10-13)** - After implementation
11. **Verification (Task Group 14)** - Final validation

## File Structure

```
client/
├── src/
│   ├── components/
│   │   ├── OrderEntryForm.jsx (updated)
│   │   └── Toast.jsx (new)
│   └── __tests__/
│       └── components/
│           └── OrderEntryForm.test.jsx (new)

src/
├── order/
│   ├── config.json (new)
│   ├── orderHandler.js (new)
│   └── __tests__/
│       └── orderHandler.test.js (new)
├── kafka/
│   └── consumer.js (updated - handler registration)
└── app.js (updated - timestamp addition)
```

## Technical Notes

- Toast notifications can use a simple library like `react-hot-toast` or be implemented as a custom component
- Product generation uses `Math.random()` - consider crypto-safe random for production
- Review chance is configurable via `src/order/config.json`
- Order messages include server-generated timestamp (added in produce endpoint)
- Products are published individually (one message per product)
- Error handling logs to console per requirements (no complex UI)
- Form validation is client-side only per requirements

## Dependencies

**Frontend:**
- React hooks (useState, useEffect) - already available
- fetch API - native browser API
- Optional: `react-hot-toast` or similar for toast notifications

**Backend:**
- Kafka module (`src/kafka/index.js`) - already exists
- Express server - already exists
- No new npm dependencies required
