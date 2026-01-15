# Implementation Tasks: Express API with WebSocket Integration

## Overview
This tasks list breaks down the Express API with WebSocket Integration spec into actionable implementation steps. Tasks are grouped logically and ordered by dependencies to enable efficient development.

## Task Groups

### Group 1: Project Setup and Configuration

**Purpose:** Install dependencies and create configuration files

- [x] **Task 1.1:** Install Express and Socket.io dependencies
  - Run `bun add express socket.io cors`
  - Verify dependencies in package.json

- [x] **Task 1.2:** Create server directory structure
  - Create `src/server/` directory
  - Create placeholder for `src/app.js`

- [x] **Task 1.3:** Create server configuration file
  - Create `src/server/config.json`
  - Add `port: 4000`
  - Add `cors.origins: ["http://localhost:*"]` and `cors.credentials: false`
  - Add `kafka.initTimeout: 60000` (60 seconds)
  - Add `shutdown.timeout: 5000` (5 seconds)

### Group 2: Express Server Setup

**Purpose:** Create the Express server with middleware and basic structure

- [x] **Task 2.1:** Create main app.js file structure
  - Create `src/app.js`
  - Import required dependencies (express, cors, http)
  - Load configuration from `src/server/config.json`
  - Export main server function or keep as executable script

- [x] **Task 2.2:** Configure Express middleware
  - Create Express app instance
  - Add `express.json()` middleware for JSON body parsing
  - Configure CORS middleware with origins from config
  - Set up CORS to allow all localhost origins (any port)

- [x] **Task 2.3:** Create HTTP server instance
  - Create HTTP server from Express app using `http.createServer(app)`
  - Store server instance for later use with Socket.io
  - Do not call `listen()` yet (wait for Kafka initialization)

### Group 3: HTTP API Endpoints

**Purpose:** Implement REST API endpoints for health, status, and message production

- [x] **Task 3.1:** Implement health check endpoint
  - Create route handler for `GET /api/health`
  - Return JSON response: `{status: "ok"}`
  - Always return status code 200
  - No authentication or validation needed

- [x] **Task 3.2:** Implement Kafka status endpoint
  - Create route handler for `GET /api/kafka/status`
  - Import `getConnectionStatus` from Kafka module
  - Call `getConnectionStatus()` and return result as JSON
  - Always return status code 200

- [x] **Task 3.3:** Implement produce message endpoint
  - Create route handler for `POST /api/kafka/produce`
  - Import `produce` from Kafka module
  - Validate request body has `topic` field (non-empty string)
  - Validate request body has `message` field (object, not null/array)
  - If validation fails, return 400 with error format `{error, code}`
  - Call `produce(topic, message)` in try-catch block
  - On success, return `{success: true}` with status 200
  - On error, return 503 with error format `{error, code: "KAFKA_UNAVAILABLE"}`

- [x] **Task 3.4:** Implement error response helper
  - Create helper function `sendError(res, statusCode, message, code)`
  - Format response as `{error: message, code: code}`
  - Use appropriate HTTP status codes (400, 500, 503)
  - Export or make available to all route handlers

### Group 4: Socket.io Setup

**Purpose:** Configure Socket.io with rooms and event handlers

- [x] **Task 4.1:** Attach Socket.io to HTTP server
  - Import Socket.io server
  - Create Socket.io instance attached to HTTP server
  - Configure Socket.io CORS matching Express CORS settings
  - Use default namespace (no custom namespaces)

- [x] **Task 4.2:** Implement connection handler
  - Register `connection` event handler on Socket.io server
  - Log client connection with client ID: `"Client connected: {clientId}"`
  - Auto-join client to all four topic rooms on connection
  - Room names: `order-created`, `product-needs-review`, `product-matched`, `import-requested`
  - Use `socket.join(topicName)` for each topic

- [x] **Task 4.3:** Implement disconnect handler
  - Register `disconnect` event handler on each socket
  - Log client disconnection with client ID: `"Client disconnected: {clientId}"`
  - No manual room cleanup needed (Socket.io handles automatically)

- [x] **Task 4.4:** Implement subscribe:topic event handler
  - Register `subscribe:topic` event handler on each socket
  - Accept payload: `{topic: string}`
  - Validate topic is one of the four valid topics
  - Call `socket.join(topic)` to add client to room
  - Log subscription: `"Client {clientId} subscribed to {topic}"`
  - Emit acknowledgment back to client (optional)

- [x] **Task 4.5:** Implement unsubscribe:topic event handler
  - Register `unsubscribe:topic` event handler on each socket
  - Accept payload: `{topic: string}`
  - Validate topic is one of the four valid topics
  - Call `socket.leave(topic)` to remove client from room
  - Log unsubscription: `"Client {clientId} unsubscribed from {topic}"`
  - Emit acknowledgment back to client (optional)

### Group 5: Kafka-to-Socket.io Bridge

**Purpose:** Bridge Kafka consumer messages to Socket.io clients

- [x] **Task 5.1:** Import Kafka module functions
  - Import `onMessage`, `waitForInitialization`, `disconnect` from Kafka module
  - Store Kafka module imports at top of file

- [x] **Task 5.2:** Implement Kafka message handler
  - Register callback with `onMessage(handler)`
  - Handler receives `{topic, message, partition, offset}` from Kafka
  - Add server timestamp: `timestamp: Date.now()`
  - Create Socket.io payload: `{topic, message, partition, offset, timestamp}`
  - Emit to Socket.io room: `io.to(topic).emit('kafka:message', payload)`
  - Do not log individual messages (too verbose)

- [x] **Task 5.3:** Wait for Kafka initialization
  - Call `waitForInitialization()` before starting server
  - Use Promise.race with timeout from config (`kafka.initTimeout`)
  - Create timeout promise that rejects after configured milliseconds
  - If timeout occurs, log error and exit with `process.exit(1)`
  - If initialization succeeds, log "Kafka consumers ready"

### Group 6: Server Startup and Lifecycle

**Purpose:** Implement server startup, logging, and graceful shutdown

- [ ] **Task 6.1:** Implement server startup sequence
  - Log "Starting server..." at beginning
  - Log loaded configuration (port, timeouts)
  - Wait for Kafka initialization (Task 5.3)
  - Start HTTP server: `server.listen(port, callback)`
  - Log "Server listening on port {port}" on success
  - Count connected Socket.io clients: `io.sockets.sockets.size`
  - Log "Server ready - {count} clients connected"

- [ ] **Task 6.2:** Implement graceful shutdown handler
  - Register `process.on('SIGINT', handler)` for Ctrl+C
  - Register `process.on('SIGTERM', handler)` for termination
  - Log "Shutting down gracefully..." when signal received
  - Shutdown sequence:
    1. Close HTTP server: `server.close()`
    2. Emit disconnect to all clients: `io.emit('disconnect')`
    3. Close Socket.io: `io.close()`
    4. Disconnect Kafka: `await disconnect()`
  - Set timeout for shutdown (from `config.shutdown.timeout`)
  - Log each shutdown step completion
  - Log "Shutdown complete" and exit with code 0

- [ ] **Task 6.3:** Implement startup error handling
  - Wrap server startup in try-catch
  - Log any startup errors to console.error
  - Exit with code 1 on startup failure
  - Include error details in log message

- [ ] **Task 6.4:** Add logging for Socket.io client tracking
  - On connection, log with client ID
  - On disconnection, log with client ID
  - On subscribe/unsubscribe, log with client ID and topic
  - Use consistent log format

### Group 7: Testing

**Purpose:** Create comprehensive unit tests for the server

- [ ] **Task 7.1:** Set up test file and mocks
  - Create `src/__tests__/app.test.js`
  - Mock Kafka module using `vi.mock('../kafka/index.js')`
  - Create mock implementations:
    - `waitForInitialization`: returns resolved Promise
    - `onMessage`: stores callback for test invocation
    - `produce`: returns resolved Promise or throws
    - `getConnectionStatus`: returns mock status object
    - `disconnect`: returns resolved Promise
  - Set up beforeEach and afterEach hooks

- [ ] **Task 7.2:** Test health check endpoint
  - Test `GET /api/health` returns 200 status
  - Verify response body is `{status: "ok"}`
  - Ensure response is JSON format

- [ ] **Task 7.3:** Test Kafka status endpoint
  - Test `GET /api/kafka/status` returns 200 status
  - Verify `getConnectionStatus()` is called
  - Verify response matches mocked Kafka status
  - Test with different status values (connected, error, etc.)

- [ ] **Task 7.4:** Test produce endpoint with valid payload
  - Test `POST /api/kafka/produce` with valid `{topic, message}`
  - Verify `produce(topic, message)` is called with correct args
  - Verify response is `{success: true}` with status 200
  - Test with different topics and messages

- [ ] **Task 7.5:** Test produce endpoint validation errors
  - Test with missing `topic` field returns 400
  - Test with empty `topic` string returns 400
  - Test with missing `message` field returns 400
  - Test with null `message` returns 400
  - Verify error response format `{error, code}`

- [ ] **Task 7.6:** Test produce endpoint Kafka errors
  - Mock `produce()` to throw error
  - Verify response status is 503
  - Verify error response format `{error, code}`
  - Verify error code is appropriate

- [ ] **Task 7.7:** Test Kafka-to-Socket.io bridge
  - Invoke mocked `onMessage` callback with test message
  - Verify Socket.io emit called with correct parameters
  - Verify emitted to correct room (topic name)
  - Verify timestamp added to payload
  - Verify payload structure matches spec

- [ ] **Task 7.8:** Test Socket.io connection handling (if feasible)
  - Test client auto-joins all topic rooms on connection
  - Test subscribe:topic adds client to room
  - Test unsubscribe:topic removes client from room
  - Test invalid topic validation

- [ ] **Task 7.9:** Run all tests and verify coverage
  - Execute `bun test src/__tests__/app.test.js`
  - Verify all tests pass
  - Review test coverage for main code paths
  - Fix any failing tests

### Group 8: Code Quality and Documentation

**Purpose:** Ensure code quality, add comments, and create documentation

- [ ] **Task 8.1:** Add JSDoc comments
  - Add JSDoc for main server initialization function
  - Add JSDoc for all route handlers (health, status, produce)
  - Add JSDoc for Socket.io event handlers
  - Add JSDoc for Kafka message bridge handler
  - Document parameters and return types

- [ ] **Task 8.2:** Add inline comments for complex logic
  - Comment Kafka initialization timeout logic
  - Comment graceful shutdown sequence
  - Comment Socket.io room management
  - Comment error response formatting

- [ ] **Task 8.3:** Create server README
  - Create `src/server/README.md` or add to main README
  - Document server endpoints (health, status, produce)
  - Document Socket.io events (subscribe, unsubscribe, kafka:message)
  - Document configuration options
  - Include example usage for API endpoints
  - Include Socket.io client connection example

- [ ] **Task 8.4:** Code quality review
  - Review all files for consistent formatting
  - Ensure proper error handling in all routes
  - Verify all imports are correct
  - Check for any console.log (should use proper logging)
  - Ensure all async functions use await properly

### Group 9: Integration Verification

**Purpose:** Manually test the server with real dependencies

- [ ] **Task 9.1:** Start dependencies
  - Ensure Docker Compose is running (`docker-compose up -d`)
  - Verify Kafka is accessible on localhost:9092
  - Verify Kafka topics exist

- [ ] **Task 9.2:** Start Express server
  - Run `bun run src/app.js` (or appropriate script)
  - Verify server starts on port 4000
  - Verify "Kafka consumers ready" log appears
  - Verify "Server ready" log appears

- [ ] **Task 9.3:** Test HTTP endpoints manually
  - Test `GET http://localhost:4000/api/health` with curl or browser
  - Test `GET http://localhost:4000/api/kafka/status`
  - Test `POST http://localhost:4000/api/kafka/produce` with valid payload
  - Verify responses match expected format

- [ ] **Task 9.4:** Test Socket.io connection (if tool available)
  - Use Socket.io client or testing tool
  - Connect to `http://localhost:4000`
  - Verify connection succeeds
  - Test subscribe:topic event
  - Verify kafka:message events received when Kafka messages produced

- [ ] **Task 9.5:** Test graceful shutdown
  - Start server
  - Send SIGINT (Ctrl+C)
  - Verify shutdown sequence logs appear
  - Verify server exits cleanly
  - Verify no hanging processes

## Task Dependencies

### Critical Path
1. Group 1 (Setup) → Group 2 (Express) → Group 3 (Endpoints) → Group 6 (Startup) → Group 9 (Verification)
2. Group 1 (Setup) → Group 4 (Socket.io) → Group 6 (Startup) → Group 9 (Verification)
3. Group 1 (Setup) → Group 5 (Kafka Bridge) → Group 6 (Startup) → Group 9 (Verification)

### Parallel Work Opportunities
- Groups 3, 4, and 5 can be worked on in parallel after Group 2 completes
- Group 7 (Testing) can be written in parallel with implementation groups
- Group 8 (Documentation) can be done in parallel with Group 9 (Verification)

### Key Dependencies
- Task 2.3 depends on Task 2.1 (HTTP server needs Express app)
- Task 4.1 depends on Task 2.3 (Socket.io needs HTTP server)
- Task 5.3 depends on Task 5.1 (Kafka init needs imports)
- Task 6.1 depends on Tasks 2.3, 4.1, 5.2, 5.3 (startup needs all components)
- Group 7 depends on Groups 2-6 (tests need implementation)
- Group 9 depends on all implementation groups (verification needs complete server)

## Notes
- All tests use mocked Kafka module - no integration tests with real Kafka
- Server runs on port 4000 (configurable)
- React frontend will run on separate Vite dev server (port 5173)
- No authentication or authorization for PoC
- Socket.io rooms automatically created for four Kafka topics
- No message history or replay - real-time only
- Graceful shutdown ensures clean Kafka disconnection
