# Specification: Express API with WebSocket Integration

## Goal
Set up an Express server with Socket.io for real-time browser updates, providing HTTP API endpoints for health checks and Kafka message production, and automatically broadcasting Kafka consumer messages to connected WebSocket clients through topic-based rooms.

## User Stories
- As a frontend developer, I want a WebSocket connection to receive real-time Kafka messages so that I can update the dashboard immediately when events occur
- As a frontend developer, I want to send HTTP requests to produce Kafka messages so that I can trigger order creation and other actions
- As a developer, I want health check and status endpoints so that I can monitor the server and Kafka connection state
- As a technical learner, I want automatic topic room management so that I can easily subscribe to specific Kafka topics without manual setup

## Specific Requirements

**Server Configuration and Setup**
- Create main server file at `src/app.js`
- Create configuration file at `src/server/config.json`
- Configure server to run on port 4000 (must be configurable via config.json)
- Load configuration synchronously on startup using `require()` or similar
- Use Express framework as the HTTP server
- Include `express.json()` middleware for automatic JSON body parsing
- Set up CORS middleware to allow all localhost origins with any port
- Do not serve static files (React runs on separate Vite dev server at port 5173)

**Configuration File Structure (src/server/config.json)**
- Create JSON configuration file with following structure:
  - `port`: number (default 4000)
  - `cors.origins`: array of strings (patterns like "http://localhost:*")
  - `cors.credentials`: boolean (false for PoC)
  - `kafka.initTimeout`: number in milliseconds (60000 = 60 seconds)
  - `shutdown.timeout`: number in milliseconds (5000 = 5 seconds)
- Configuration must be separate from Kafka module configuration
- All timeouts and ports must be easily adjustable

**Kafka Module Integration**
- Import Kafka module from `../kafka/index.js` (spec #2)
- Use `waitForInitialization()` to wait for Kafka consumers to be ready
- Wait maximum of 60 seconds (configurable via `kafka.initTimeout`)
- If Kafka initialization times out, log error to console.error and exit process with code 1
- Only start HTTP server after Kafka consumers are successfully initialized
- Use `onMessage()` to register callback for all consumed Kafka messages
- Use `produce(topic, message)` for HTTP endpoint message production
- Use `getConnectionStatus()` for Kafka status endpoint
- Use `disconnect()` during graceful shutdown

**Socket.io Configuration**
- Install and import Socket.io server
- Attach Socket.io to the HTTP server created by Express
- Use default namespace (no custom namespaces needed)
- Configure CORS for Socket.io matching Express CORS settings
- No authentication or authorization required (PoC simplicity)
- Create rooms for each Kafka topic automatically on server startup
- Room names must exactly match topic names: `order-created`, `product-needs-review`, `product-matched`, `import-requested`

**Socket.io Connection Handling**
- On client connection (`connection` event), automatically join client to all four topic rooms
- Log each Socket.io connection with client ID to console
- Log each Socket.io disconnection with client ID to console
- Track total number of connected clients (use `io.sockets.sockets.size` or similar)
- Do not log individual message broadcasts (too verbose)

**Socket.io Client Events (Client → Server)**
- `subscribe:topic` event: Accept `{topic: string}` payload, join client to specified topic room
- `unsubscribe:topic` event: Accept `{topic: string}` payload, remove client from specified topic room
- Validate topic name matches one of the four valid topics before join/leave
- Log subscription and unsubscription events with client ID and topic
- Emit acknowledgment or error response back to client on subscribe/unsubscribe

**Socket.io Server Events (Server → Client)**
- `kafka:message` event: Emit to topic-specific room when Kafka message received
  - Payload structure: `{topic: string, message: object, partition: number, offset: string, timestamp: number}`
  - `topic`: original Kafka topic name
  - `message`: parsed JSON message from Kafka (already parsed by Kafka module)
  - `partition`: Kafka partition number
  - `offset`: Kafka message offset
  - `timestamp`: server timestamp when message was received (Date.now())
- Emit only to room matching the topic name, not broadcast globally
- Do not emit to default room or clients not in topic room

**Kafka-to-Socket.io Message Bridge**
- Register callback with Kafka module using `onMessage(handler)`
- Handler receives `{topic, message, partition, offset}` from Kafka module
- Add server timestamp: `timestamp: Date.now()`
- Create Socket.io payload: `{topic, message, partition, offset, timestamp}`
- Emit to Socket.io room named exactly the topic value: `io.to(topic).emit('kafka:message', payload)`
- No filtering, transformation, or buffering - immediate real-time relay
- No message history or replay functionality

**HTTP API Endpoints - Health Check**
- Endpoint: `GET /api/health`
- No request parameters or body needed
- Response body: `{status: "ok"}` as JSON
- Response status code: always 200
- No authentication required
- Purpose: Allow load balancers or monitoring to verify server is running

**HTTP API Endpoints - Kafka Status**
- Endpoint: `GET /api/kafka/status`
- No request parameters or body needed
- Call Kafka module's `getConnectionStatus()` function
- Return the exact response from `getConnectionStatus()` as JSON
- Expected response format: `{status: "connected"|"disconnected"|"connecting"|"error", timestamp: number, error?: string}`
- Response status code: always 200 (even if Kafka status is error)
- No authentication required

**HTTP API Endpoints - Produce Message**
- Endpoint: `POST /api/kafka/produce`
- Request body must be JSON: `{topic: string, message: object}`
- Request body validation:
  - Ensure `topic` field exists and is a non-empty string
  - Ensure `message` field exists and is an object (not null, not array)
  - If validation fails, return 400 status with error response
- Call Kafka module's `produce(topic, message)` function
- If produce succeeds, return `{success: true}` with status 200
- If produce fails, return error response with status 503 (service unavailable)
- Wrap produce call in try-catch to handle errors
- Log production errors to console.error

**Error Response Format**
- All error responses must follow standard format: `{error: string, code: string}`
- `error` field: human-readable error message describing what went wrong
- `code` field: machine-readable error code in UPPER_SNAKE_CASE
- Example error codes:
  - `INVALID_REQUEST`: missing or invalid request parameters
  - `KAFKA_UNAVAILABLE`: Kafka connection is not available
  - `PRODUCE_FAILED`: message production to Kafka failed
  - `INVALID_TOPIC`: topic name is not one of the valid four topics
- HTTP status codes:
  - 400: Bad request (validation errors, invalid parameters)
  - 500: Internal server error (unexpected errors)
  - 503: Service unavailable (Kafka not connected or produce failed)

**Server Startup Flow**
- Load configuration from `src/server/config.json`
- Log configuration values (port, timeouts) to console
- Import and wait for Kafka module initialization using `waitForInitialization()`
- Set timeout for Kafka initialization (60 seconds from config)
- If timeout occurs, log error message and exit with code 1
- After Kafka ready, create Express app instance
- Add `express.json()` middleware for body parsing
- Add CORS middleware with configuration from config file
- Define all HTTP API routes (health, status, produce)
- Create HTTP server from Express app using `app.listen()`
- Attach Socket.io to HTTP server with CORS configuration
- Register Socket.io connection event handler
- Auto-join clients to all topic rooms on connection
- Register Kafka message handler using `onMessage()`
- Bridge Kafka messages to Socket.io rooms
- Log startup completion with server port and Kafka status
- Log "Server ready" message with number of connected clients (0 initially)

**Graceful Shutdown Handling**
- Listen for SIGINT signal (Ctrl+C) using `process.on('SIGINT', handler)`
- Listen for SIGTERM signal using `process.on('SIGTERM', handler)`
- On shutdown signal received, log "Shutting down gracefully..." message
- Execute shutdown sequence in order:
  1. Close HTTP server using `server.close()` to stop accepting new connections
  2. Emit disconnect event to all Socket.io clients: `io.emit('disconnect')`
  3. Close all Socket.io connections: `io.close()`
  4. Disconnect from Kafka using Kafka module's `disconnect()` function
- Set timeout for shutdown sequence (5 seconds from config)
- If shutdown completes before timeout, log "Shutdown complete" and exit with code 0
- If timeout reached, log warning and force exit with code 0
- Ensure process always exits (don't hang indefinitely)

**Logging Requirements**
- On startup:
  - Log "Starting server..." message
  - Log loaded configuration values (port, timeouts)
  - Log "Waiting for Kafka initialization..." message
  - Log "Kafka consumers ready" when initialization succeeds
  - Log "Server listening on port {port}" when HTTP server starts
  - Log "Server ready - {count} clients connected" with initial client count
- During operation:
  - Log each Socket.io client connection: "Client connected: {clientId}"
  - Log each Socket.io client disconnection: "Client disconnected: {clientId}"
  - Log subscribe/unsubscribe events: "Client {clientId} subscribed to {topic}"
  - Log HTTP API errors to console.error with endpoint and error details
  - Do NOT log individual Kafka messages (too verbose)
- On shutdown:
  - Log "Shutting down gracefully..." when signal received
  - Log "HTTP server closed" after server.close()
  - Log "Socket.io connections closed" after io.close()
  - Log "Kafka disconnected" after Kafka disconnect
  - Log "Shutdown complete" when all cleanup done

**Testing Requirements**
- Create test file at `src/__tests__/app.test.js`
- Use Vitest as testing framework
- Mock Kafka module using `vi.mock('../kafka/index.js')`
- Mock implementations for mocked Kafka functions:
  - `waitForInitialization`: returns resolved Promise
  - `onMessage`: stores callback for later invocation in tests
  - `produce`: returns resolved Promise or throws error
  - `getConnectionStatus`: returns mock status object
  - `disconnect`: returns resolved Promise
- Test HTTP API endpoints:
  - Test `GET /api/health` returns `{status: "ok"}`
  - Test `GET /api/kafka/status` returns mocked Kafka status
  - Test `POST /api/kafka/produce` with valid payload succeeds
  - Test `POST /api/kafka/produce` with missing topic returns 400
  - Test `POST /api/kafka/produce` with missing message returns 400
  - Test `POST /api/kafka/produce` when Kafka produce fails returns 503
- Test Socket.io integration (if feasible with mocking):
  - Test client auto-joins all topic rooms on connection
  - Test subscribe:topic event adds client to room
  - Test unsubscribe:topic event removes client from room
- Test Kafka-to-Socket.io bridge:
  - Invoke mocked onMessage callback with test message
  - Verify Socket.io emit called with correct room and payload
  - Verify timestamp added to payload
- Test error handling:
  - Test error responses have correct format
  - Test appropriate HTTP status codes returned
- Do not test actual Socket.io connections or real HTTP requests
- Do not test Kafka integration (Kafka module tested separately)

**Code Quality Requirements**
- Use ES modules syntax (import/export)
- Use async/await for all asynchronous operations
- Include JSDoc comments for all major functions
- Descriptive variable and function names
- Proper error handling with try-catch blocks
- Consistent code formatting (Prettier-compatible)
- No console.log for debugging (use proper logging)
- Validate all user inputs before processing

**Dependencies to Install**
- `express` - HTTP server framework
- `socket.io` - WebSocket library for real-time communication
- `cors` - CORS middleware for Express
- Kafka module is internal dependency (already exists from spec #2)

## Visual Design
No visual assets provided - this is a backend API server with no UI components. The server provides the backend infrastructure for the React dashboard (spec #4).

## Existing Code to Leverage
- Kafka module from spec #2 (`src/kafka/index.js`) with complete producer/consumer functionality
- Docker Compose from spec #1 provides running Kafka infrastructure on `localhost:9092`
- Kafka topics already created: `order-created`, `product-needs-review`, `product-matched`, `import-requested`

## Out of Scope
- React frontend application (handled in spec #4)
- Business logic for order processing, product review, etc. (specs #5-8)
- Static file serving for production React build
- Request logging middleware (morgan, winston, pino)
- Response compression middleware
- Security headers middleware (helmet)
- Rate limiting or request throttling
- Message history, replay, or buffering functionality
- Authentication or authorization for WebSocket or HTTP
- User sessions or session management
- Database integration
- Persistent storage of any kind
- Integration tests with real Socket.io clients or HTTP requests
- Integration tests with real Kafka broker
- Production deployment configuration or Docker image
- HTTPS/SSL/TLS configuration
- Load balancing or clustering configuration
- Health check with detailed system metrics (CPU, memory, etc.)
- API versioning (e.g., /v1/api/)
- API documentation generation (Swagger/OpenAPI)
- Monitoring, metrics, or observability tools (Prometheus, Grafana)
- Distributed tracing
- Request ID tracking
- GraphQL API
- REST API pagination
- REST API filtering or sorting
- WebSocket authentication tokens
- WebSocket reconnection handling (client-side responsibility)
- Message acknowledgment or delivery confirmation
- Client-side JavaScript SDK or library
