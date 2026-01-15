# Spec Requirements: Express API with WebSocket Integration

## Initial Description

Set up Express server with Socket.io for real-time browser updates, including event emission when messages are consumed from Kafka. This provides the backend API server that bridges Kafka events to browser clients and exposes HTTP endpoints for the React dashboard.

## Requirements Discussion

### First Round Questions

**Q1: Express Server Configuration**
How should the Express server be configured?
**Answer:** Port 4000, include body-parser middleware, React will run on separate dev server, server structure in `src/app.js`.

**Q2: Socket.io Setup**
How should Socket.io be configured?
**Answer:** Default namespace, clients join rooms per topic, open for PoC (no auth), emit `kafka:message` events.

**Q3: Kafka-to-Socket.io Bridge**
How should Kafka consumer events be bridged to Socket.io clients?
**Answer:** Keep it simple, filter messages per topic.

**Q4: HTTP API Endpoints**
What REST API endpoints are needed?
**Answer:** Health check, Kafka status, producer endpoint, use `/api` prefix.

**Q5: CORS Configuration**
How should CORS be configured?
**Answer:** Localhost only, no authentication.

**Q6: Error Handling**
How should errors be handled?
**Answer:** Errors should be written to console.

**Q7: Environment Configuration**
How should configuration be managed?
**Answer:** Use `config.json` for port, CORS, etc.

**Q8: Server Startup and Lifecycle**
How should the server start and stop?
**Answer:** Wait for consumers to initialize, graceful shutdown, log critical details (port, status, etc.).

**Q9: Testing Strategy**
What testing approach should be used?
**Answer:** Unit tests, mock Kafka module, no integration tests for now.

**Q10: Additional Features**
Any other features needed?
**Answer:** N/A.

### Existing Code to Reference

- Kafka module (spec #2): `src/kafka/index.js` with `produce()`, `kafkaEvents`, `getConnectionStatus()`, `onMessage()`, `disconnect()`
- Docker Compose (spec #1): Kafka running on `localhost:9092`

### Follow-up Questions

**F1: Socket.io Room Structure**
Room naming and subscription behavior?
**Answer:** Room names are just the topic name, auto-join all rooms on connect, provide `subscribe:topic` and `unsubscribe:topic` events.

**F2: Socket.io Message Format**
Message format and emission strategy?
**Answer:** Raw Kafka payload, emit to topic-specific rooms only, add server timestamp.

**F3: HTTP API Endpoint Details**
Exact endpoint specifications?
**Answer:** Health check returns `{status:"ok"}`, Kafka status returns connection status from `getConnectionStatus()`, produce endpoint is `POST /api/kafka/produce` with `{topic, message}` in request body.

**F4: CORS Origins**
What localhost origins to allow?
**Answer:** Allow all localhost origins.

**F5: Configuration File Structure**
Location and structure of config file?
**Answer:** `src/server/config.json` with typical fields (port, CORS, etc.), separate from Kafka config.

**F6: Server Initialization Flow**
Startup sequence and timing?
**Answer:** Start HTTP server after consumers are ready, 60 second timeout if Kafka doesn't connect.

**F7: Graceful Shutdown Details**
Shutdown sequence and timing?
**Answer:** Close HTTP server → Socket.io → Kafka, notify clients on disconnect, 5 second timeout for cleanup.

**F8: Logging Details**
What should be logged?
**Answer:** Log port/Kafka status/connected clients on startup, log Socket.io connection/disconnection events, don't log message flow (too verbose).

**F9: Error Response Format**
HTTP error format and status codes?
**Answer:** Standard error format `{error: "message", code: "ERROR_CODE"}` with appropriate HTTP status codes (400, 500, 503).

**F10: Message History/State**
Should server maintain state?
**Answer:** No message replay or history for proof of concept - clients only receive messages from moment they connect.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

Not applicable - architecture is straightforward: Express ↔ Socket.io ↔ Kafka bridge.

## Requirements Summary

### Functional Requirements

**Express Server**
- Server file located at `src/app.js`
- Run on port 4000 (configurable)
- Include body-parser middleware for JSON parsing
- Use `/api` prefix for all API endpoints
- Configuration file at `src/server/config.json`
- Wait for Kafka consumers to initialize before accepting connections (60s timeout)
- Graceful shutdown handling with 5s cleanup timeout
- Log startup details: port, Kafka status, connected Socket.io clients
- Log Socket.io connection/disconnection events
- Do not log individual Kafka message flow (too verbose)

**Socket.io Setup**
- Use default namespace (no custom namespaces)
- Automatic room creation per Kafka topic
- Room names match topic names exactly (e.g., `order-created`, `product-needs-review`)
- Auto-join all topic rooms when client connects
- Provide `subscribe:topic` and `unsubscribe:topic` events for manual room management
- No authentication required (PoC simplicity)
- Emit `kafka:message` events to clients
- Notify clients on server shutdown

**Kafka-to-Socket.io Bridge**
- Listen to Kafka events via `onMessage()` from Kafka module
- Emit messages to topic-specific rooms only (filtered by topic)
- Message format: raw Kafka payload `{topic, message, partition, offset}` plus server `timestamp`
- No message history or replay - real-time only
- No rate limiting or throttling (PoC simplicity)

**HTTP API Endpoints**
- `GET /api/health` - Returns `{status: "ok"}`
- `GET /api/kafka/status` - Returns connection status from Kafka `getConnectionStatus()`
- `POST /api/kafka/produce` - Accepts `{topic: string, message: object}`, produces to Kafka

**CORS Configuration**
- Allow all localhost origins (any port)
- No authentication required
- Credentials not needed for PoC

**Error Handling**
- All errors logged to console.error
- HTTP errors return standard format: `{error: "message", code: "ERROR_CODE"}`
- HTTP status codes: 400 (bad request), 500 (server error), 503 (Kafka unavailable)
- Socket.io disconnection handled gracefully with client notification
- Kafka connection errors logged and reflected in status endpoint

**Graceful Shutdown**
- Listen for SIGINT and SIGTERM signals
- Shutdown sequence: HTTP server → Socket.io connections → Kafka disconnect
- Emit disconnect event to all connected Socket.io clients
- Wait up to 5 seconds for cleanup before forcing exit
- Log shutdown progress

### Technical Specifications

**Technology Stack**
- Runtime: Bun
- Language: JavaScript
- Framework: Express
- WebSocket: Socket.io
- Kafka Integration: Uses Kafka module from spec #2
- Testing: Vitest with mocked Kafka module

**Dependencies**
- `express` - Web server framework
- `socket.io` - WebSocket library
- `cors` - CORS middleware
- Internal: Kafka module (`src/kafka/index.js`)

**File Structure**
```
src/
  ├── app.js              # Main Express server
  ├── server/
  │   ├── config.json     # Server configuration
  │   ├── routes.js       # API route handlers (optional)
  │   └── socketio.js     # Socket.io setup (optional)
  ├── kafka/              # Kafka module (from spec #2)
  └── __tests__/
      └── app.test.js     # Server unit tests
```

**Configuration Schema (src/server/config.json)**
```json
{
  "port": 4000,
  "cors": {
    "origins": ["http://localhost:*"],
    "credentials": false
  },
  "kafka": {
    "initTimeout": 60000
  },
  "shutdown": {
    "timeout": 5000
  }
}
```

**Socket.io Events**

*Client → Server:*
- `subscribe:topic` - Join a specific topic room `{topic: string}`
- `unsubscribe:topic` - Leave a specific topic room `{topic: string}`

*Server → Client:*
- `kafka:message` - New Kafka message `{topic, message, partition, offset, timestamp}`
- `disconnect` - Server shutting down

**Socket.io Rooms**
- Automatic rooms created for each Kafka topic
- Room names: `order-created`, `product-needs-review`, `product-matched`, `import-requested`
- Clients auto-join all rooms on connection
- Messages emitted to topic-specific room only

**HTTP API Specification**

*GET /api/health*
- Response: `{status: "ok"}`
- Status Code: 200

*GET /api/kafka/status*
- Response: `{status: "connected|disconnected|connecting|error", timestamp: number, error?: string}`
- Status Code: 200

*POST /api/kafka/produce*
- Request Body: `{topic: string, message: object}`
- Response: `{success: true}` or `{error: string, code: string}`
- Status Codes: 200 (success), 400 (bad request), 503 (Kafka unavailable)
- Validates topic is non-empty string
- Validates message is present

**Error Response Format**
```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

**Startup Flow**
1. Load configuration from `src/server/config.json`
2. Wait for Kafka consumers to initialize (max 60s)
3. If Kafka timeout, log error and exit
4. Create Express app with middleware
5. Set up Socket.io with room management
6. Register Kafka event listeners
7. Start HTTP server on configured port
8. Log startup: port, Kafka status, ready message

**Message Flow**
1. Kafka consumer receives message
2. Kafka module emits `kafka:message` event
3. Server listens via `onMessage()` callback
4. Server adds server timestamp
5. Server emits to Socket.io room matching topic name
6. All clients in that room receive the message

### Reusability Opportunities

**Socket.io Bridge Pattern**
- Generic room-based message routing
- Can be extended to other event sources beyond Kafka
- Topic-based filtering reusable for other messaging systems

**API Route Structure**
- RESTful endpoint pattern
- Can be extended with additional endpoints
- Standard error handling middleware

**Configuration Pattern**
- Centralized configuration file
- Easy to extend with new settings
- Separate from Kafka configuration

### Scope Boundaries

**In Scope:**
- Express server with body-parser middleware
- Socket.io setup with topic-based rooms
- Kafka-to-Socket.io message bridge
- Three HTTP API endpoints (health, status, produce)
- CORS configuration for localhost
- Server configuration file
- Wait for Kafka initialization before starting
- Graceful shutdown with cleanup
- Error handling and logging
- Unit tests with mocked Kafka
- Subscribe/unsubscribe Socket.io events

**Out of Scope:**
- React frontend (handled in spec #4)
- Business logic for message processing (specs #5-8)
- Static file serving (React runs on separate dev server)
- Request logging middleware (morgan, winston)
- Compression middleware
- Security headers (helmet)
- Rate limiting or throttling
- Message history or replay functionality
- Authentication or authorization
- Database integration
- Integration tests with real Kafka
- Production deployment configuration
- HTTPS/SSL configuration
- Load balancing or clustering
- Monitoring or observability tools
- API documentation (Swagger/OpenAPI)

### Technical Considerations

**Dependencies on Previous Specs**
- Requires Kafka module (spec #2) with `produce()`, `onMessage()`, `getConnectionStatus()`, `disconnect()`
- Requires Docker Compose (spec #1) running Kafka on `localhost:9092`

**Dependencies for Future Specs**
- Spec #4 (React Dashboard) will connect to Socket.io and call HTTP endpoints
- Specs #5-8 (Business Logic) will use the API endpoints to produce messages

**Design Decisions**
- No authentication for PoC simplicity
- No message replay to keep server stateless
- Auto-join all rooms for simplicity (clients can unsubscribe)
- Topic rooms for efficient message filtering
- Wait for Kafka before accepting connections ensures clean startup
- 60s timeout prevents infinite hanging if Kafka unavailable
- 5s shutdown timeout ensures timely cleanup
- Raw Kafka payload preserves full message context

**Testing Strategy**
- Mock Kafka module in unit tests
- Test Express routes with supertest (if available) or direct function calls
- Test Socket.io event handling
- No integration tests to keep PoC simple

**Performance Considerations**
- Topic-based rooms prevent broadcasting to uninterested clients
- No message history reduces memory usage
- Stateless server enables easy scaling (future)
- Single server sufficient for PoC

**Security Considerations**
- No authentication (local development only)
- CORS restricted to localhost
- Suitable for PoC/development only
- Production would require proper auth and HTTPS

