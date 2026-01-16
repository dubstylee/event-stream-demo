# Specification: Order Creation Flow

## Goal
Implement the order entry form submission functionality that publishes orders to the `order-created` Kafka topic, and create a consumer handler that processes these orders to generate N random product strings per order, publishing products to `product-needs-review` topic based on random chance.

## User Stories
- As a user, I want to submit orders through the form so that I can trigger the event stream workflow
- As a user, I want visual feedback when submitting orders so that I know the submission status
- As a technical learner, I want to see products generated from orders so that I can observe the event stream transformation
- As a developer, I want products to be published to topics based on business logic so that I can see conditional event routing

## Specific Requirements

**Frontend: Order Entry Form Submission**

- Update `client/src/components/OrderEntryForm.jsx` to enable form submission
- Remove `preventDefault()` and implement actual submission logic
- Call Express API endpoint `POST /api/kafka/produce` with order data
- Request body structure: `{topic: "order-created", message: {orderId: string, productCount: number}}`
- Handle form submission asynchronously with proper error handling
- Implement loading state during submission (disable form inputs and submit button)
- Display success toast notification on successful submission
- Display error toast notification on failed submission
- Reset form fields (Order ID and Product Count) on successful submission
- Log errors to browser console for debugging
- Maintain existing form styling and accessibility features

**Frontend: Form Validation**

- Implement client-side validation for form inputs
- Validate Order ID: must be non-empty string (trim whitespace)
- Validate Product Count: must be a positive integer greater than 0
- Show validation feedback before submission (prevent invalid submissions)
- Validation should occur on form submit event
- Do not show inline validation errors (per requirements - console logging only)
- Disable submit button or prevent submission if validation fails

**Frontend: Toast Notification System**

- Create toast notification component or use existing library
- Toast component location: `client/src/components/Toast.jsx` (or similar)
- Support success and error toast types
- Toast should auto-dismiss after a few seconds (e.g., 3-5 seconds)
- Toast should be dismissible by user (close button or click)
- Position toasts in a non-intrusive location (e.g., top-right corner)
- Use Tailwind CSS for styling consistent with dashboard design
- Toast messages:
  - Success: "Order submitted successfully"
  - Error: "Failed to submit order. Please try again."

**Frontend: Loading State Management**

- Add loading state to component using `useState` hook
- Set loading to `true` when form submission starts
- Set loading to `false` when submission completes (success or error)
- Disable form inputs when loading is `true`
- Disable submit button when loading is `true`
- Optionally show loading spinner or text on submit button during submission
- Ensure form cannot be submitted multiple times while loading

**Backend: Order Message Publishing**

- Use existing `POST /api/kafka/produce` endpoint in `src/app.js`
- Endpoint already accepts `{topic: string, message: object}` format
- Order message structure published to `order-created` topic:
  - `orderId`: string (from form input, trimmed)
  - `productCount`: number (from form input, parsed as integer)
  - `timestamp`: number (server-generated using `Date.now()`)
- Server should generate timestamp when receiving the produce request
- No additional backend validation needed (client-side validation sufficient per requirements)
- Error handling already implemented in existing endpoint (returns 503 on Kafka failure)

**Backend: Kafka Consumer Handler for Order Processing**

- Create order processing handler module at `src/order/orderHandler.js` (or integrate into existing consumer)
- Handler should process messages from `order-created` topic
- Handler receives message payload: `{orderId: string, productCount: number, timestamp: number}`
- Extract `productCount` to determine how many products to generate
- Generate N product strings where N = `productCount`
- Product string format: `"product-{10-digit-number}"` (e.g., "product-1234567890")
- Each product string must be unique within the order (no duplicates per order)
- Use random number generation for the 10-digit numeric portion
- Ensure numeric portion is exactly 10 digits (pad with leading zeros if needed)

**Backend: Product Generation Logic**

- Implement product generation function in order handler
- Function signature: `generateProducts(orderId: string, count: number): string[]`
- Generate array of unique product strings
- Use `Math.random()` or crypto-safe random number generation
- Format each product as: `"product-" + 10-digit-number`
- Ensure uniqueness within the generated array (no duplicates)
- Return array of product strings

**Backend: Random Review Chance Logic**

- Implement random chance logic to determine which products need review
- Create configurable review probability (e.g., 30% chance per product)
- For each generated product, determine if it needs review using random chance
- If product needs review, publish to `product-needs-review` topic
- If product does not need review, do not publish (deferred to later specs for other handling)
- Review chance should be configurable (e.g., via config file or environment variable)
- Default review chance: 30% (0.3 probability)
- Product message structure for `product-needs-review` topic:
  - `productId`: string (the generated product string, e.g., "product-1234567890")
  - `orderId`: string (from original order)
  - `timestamp`: number (when product was generated)

**Backend: Publishing Products to Kafka**

- Use existing `produce()` function from Kafka module
- Publish each product that needs review to `product-needs-review` topic
- Publish products individually (one message per product)
- Each product message should include: `productId`, `orderId`, `timestamp`
- Handle publishing errors gracefully (log to console.error)
- Products that don't need review are not published in this spec (deferred to later specs)

**Backend: Consumer Handler Integration**

- Integrate order handler into existing Kafka consumer infrastructure
- Handler should be called when `order-created` topic messages are consumed
- Use existing consumer event system (`kafka:message` events)
- Register handler in `src/kafka/consumer.js` or create separate handler registration
- Handler should not block other topic consumers
- Handler should process messages asynchronously
- Error handling: log errors to console.error, do not crash consumer

**Error Handling**

- Frontend: Log all errors to browser console using `console.error()`
- Frontend: Display generic error toast (no detailed error messages to user)
- Backend: Log all errors to server console using `console.error()`
- Backend: Continue processing other orders if one order fails
- Backend: Do not send failed orders to DLQ (let existing consumer retry logic handle it)
- Network errors: Frontend should detect fetch failures and show error toast
- Kafka errors: Backend should log but continue operating

**Code Organization**

- Frontend changes in `client/src/components/OrderEntryForm.jsx`
- Toast component in `client/src/components/Toast.jsx` (or similar location)
- Backend order handler in `src/order/orderHandler.js` (new directory)
- Consumer integration in `src/kafka/consumer.js` or separate handler registration file
- Configuration for review chance in `src/order/config.json` or `src/server/config.json`

**Configuration**

- Create configuration for product review chance probability
- Default value: 0.3 (30% chance)
- Configurable via JSON config file
- Location: `src/order/config.json` or add to `src/server/config.json`
- Format: `{"reviewChance": 0.3}`

**Testing Requirements**

- Unit tests for product generation function
  - Test generates correct number of products
  - Test product format matches "product-{10-digits}"
  - Test products are unique within an order
  - Test numeric portion is exactly 10 digits
- Unit tests for review chance logic
  - Test products are selected based on probability
  - Test configurable probability works correctly
- Integration tests for order submission flow
  - Test form submission calls API correctly
  - Test loading state management
  - Test toast notifications appear
  - Test form reset on success
- Integration tests for consumer handler
  - Test order processing generates correct products
  - Test products published to correct topic
  - Test error handling doesn't crash consumer
- Use Vitest for all tests
- Mock Kafka producer for unit tests
- Mock fetch API for frontend tests

**Code Quality Requirements**

- Use ES modules syntax (import/export)
- Use async/await for all asynchronous operations
- Include JSDoc comments for all functions
- Descriptive variable and function names
- Proper error handling with try-catch blocks
- Consistent code formatting
- Follow existing code patterns from previous specs
- No console.log for debugging (use console.error for errors only)

**Dependencies**

- Frontend: No new dependencies (use existing React, fetch API)
- Backend: No new dependencies (use existing Kafka module)
- Toast notifications: May need to install a toast library (e.g., `react-hot-toast`) or implement custom component

## Visual Design

No visual assets provided. Follow existing dashboard design patterns:
- Use existing Tailwind CSS styling from dashboard
- Toast notifications should match dashboard color scheme
- Loading states should use existing button/input disabled styles
- Maintain accessibility features (ARIA labels, keyboard navigation)

## Existing Code to Leverage

**Frontend:**
- Order entry form: `client/src/components/OrderEntryForm.jsx` (currently non-functional, needs submission logic)
- Dashboard layout and styling already established
- Socket.io connection for real-time updates (already working)

**Backend:**
- Express API produce endpoint: `POST /api/kafka/produce` in `src/app.js` (already implemented)
- Kafka module: `src/kafka/index.js` with `produce()` function
- Kafka consumer infrastructure: `src/kafka/consumer.js` with event emission
- Consumer event system: `kafka:message` events already working

**Infrastructure:**
- Docker Compose with Kafka and Zookeeper (already running)
- Kafka topics: `order-created`, `product-needs-review` (already exist)
- Socket.io integration for real-time message updates

## Out of Scope

- Product review UI/workflow (deferred to "Product Review Logic" spec #6)
- Product matching/approval logic (deferred to later specs)
- Import completion logic (deferred to later specs)
- Server-side validation (client-side only per requirements)
- Complex error handling UI (console logging only per requirements)
- Visual design changes to form (use existing styling)
- Products that don't need review (not published in this spec)
- Product tracking or state management beyond publishing to topics
- Order status tracking or order history
- Product deduplication across orders (only unique per order)
- Database storage of orders or products
- Order cancellation or modification
- Batch product publishing (publish individually)
- Product generation retry logic (use existing consumer retry)
- Integration tests with real Kafka broker (use mocks)
- Production deployment considerations
- Authentication or authorization for order submission
- Rate limiting for order submissions
- Order validation beyond client-side (no server-side validation)
