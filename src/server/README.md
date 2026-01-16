# Express API with WebSocket Integration

Backend API server providing HTTP endpoints and real-time WebSocket connections for Kafka message streaming.

## Overview

This server bridges Kafka consumer messages to browser clients via Socket.io WebSockets and provides REST API endpoints for health checks and message production.

## Architecture

- **Express** - HTTP server framework
- **Socket.io** - WebSocket real-time communication
- **Kafka Module** - Message broker integration (from spec #2)

## Configuration

Configuration is stored in `src/server/config.json`:

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

## HTTP API Endpoints

### GET /api/health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- 200 - Always returns OK

### GET /api/kafka/status

Returns the current Kafka connection status.

**Response:**
```json
{
  "status": "connected|disconnected|connecting|error",
  "timestamp": 1234567890,
  "error": "optional error message"
}
```

**Status Codes:**
- 200 - Always returns status (even if Kafka is down)

### POST /api/kafka/produce

Produces a message to a Kafka topic.

**Request Body:**
```json
{
  "topic": "order-created",
  "message": {
    "orderId": 123,
    "items": ["item1", "item2"]
  }
}
```

**Success Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Status Codes:**
- 200 - Message produced successfully
- 400 - Invalid request (missing topic or message)
- 503 - Kafka unavailable

**Valid Topics:**
- `order-created`
- `product-needs-review`
- `product-matched`
- `import-requested`

## Socket.io Events

### Connection

Clients automatically join all topic rooms on connection.

**Client → Server Events:**

#### subscribe:topic
Join a specific topic room.

```javascript
socket.emit('subscribe:topic', { topic: 'order-created' });
```

**Response:**
```javascript
socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.topic);
});
```

#### unsubscribe:topic
Leave a specific topic room.

```javascript
socket.emit('unsubscribe:topic', { topic: 'order-created' });
```

**Response:**
```javascript
socket.on('unsubscribed', (data) => {
  console.log('Unsubscribed from:', data.topic);
});
```

**Server → Client Events:**

#### kafka:message
Emitted when a Kafka message is consumed.

```javascript
socket.on('kafka:message', (payload) => {
  console.log('Topic:', payload.topic);
  console.log('Message:', payload.message);
  console.log('Partition:', payload.partition);
  console.log('Offset:', payload.offset);
  console.log('Server Timestamp:', payload.timestamp);
});
```

**Payload Structure:**
```json
{
  "topic": "order-created",
  "message": { "orderId": 123 },
  "partition": 0,
  "offset": "10",
  "timestamp": 1234567890
}
```

#### error
Emitted when an error occurs (e.g., invalid topic).

```javascript
socket.on('error', (data) => {
  console.error('Error:', data.message);
  console.error('Code:', data.code);
});
```

## Usage Examples

### Connecting with Socket.io Client

```javascript
import { io } from 'socket.io-client';

// Connect to server
const socket = io('http://localhost:4000');

// Listen for connection
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Listen for Kafka messages
socket.on('kafka:message', (payload) => {
  console.log(`[${payload.topic}]`, payload.message);
});

// Subscribe to specific topic
socket.emit('subscribe:topic', { topic: 'order-created' });

// Unsubscribe from topic
socket.emit('unsubscribe:topic', { topic: 'order-created' });
```

### Producing Messages via HTTP

```javascript
// Using fetch
const response = await fetch('http://localhost:4000/api/kafka/produce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'order-created',
    message: { orderId: 123, items: ['item1'] }
  })
});

const result = await response.json();
console.log('Success:', result.success);
```

```bash
# Using curl
curl -X POST http://localhost:4000/api/kafka/produce \
  -H "Content-Type: application/json" \
  -d '{"topic":"order-created","message":{"orderId":123}}'
```

## Starting the Server

```bash
# Start Docker Compose (Kafka must be running)
docker-compose up -d

# Start the server
bun run src/app.js
```

**Startup Sequence:**
1. Load configuration
2. Wait for Kafka consumers (max 60 seconds)
3. Create Express app with middleware
4. Set up Socket.io with rooms
5. Register Kafka message handlers
6. Start HTTP server on port 4000

## Graceful Shutdown

The server handles SIGINT (Ctrl+C) and SIGTERM signals gracefully:

```bash
# Stop with Ctrl+C
^C
```

**Shutdown Sequence:**
1. Close HTTP server (stop new connections)
2. Notify Socket.io clients of disconnect
3. Close Socket.io connections
4. Disconnect from Kafka
5. Exit process (max 5 second timeout)

## Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `INVALID_REQUEST` | Missing or invalid parameters | 400 |
| `INVALID_TOPIC` | Topic not in valid topics list | 400 |
| `KAFKA_UNAVAILABLE` | Kafka connection unavailable | 503 |

## Room Management

**Automatic Rooms:**
- `order-created`
- `product-needs-review`
- `product-matched`
- `import-requested`

All clients automatically join all rooms on connection. Clients can subscribe/unsubscribe dynamically.

## Logging

**Startup:**
- Configuration loaded
- Kafka initialization status
- Server listening on port
- Number of connected clients

**Runtime:**
- Socket.io client connections/disconnections
- Subscribe/unsubscribe events
- HTTP API errors
- Individual Kafka messages NOT logged (too verbose)

**Shutdown:**
- Shutdown initiated
- HTTP server closed
- Socket.io closed
- Kafka disconnected
- Shutdown complete

## Testing

```bash
# Run unit tests
bun test src/__tests__/app.test.js
```

**Test Coverage:**
- ✅ Health check endpoint
- ✅ Kafka status endpoint
- ✅ Produce endpoint with validation
- ✅ Error response formatting
- ✅ Socket.io connection handling
- ✅ Kafka-to-Socket.io bridge
- ✅ Graceful shutdown
- ✅ CORS configuration

## Dependencies

- `express@5.2.1` - Web server
- `socket.io@4.8.3` - WebSocket library
- `cors@2.8.5` - CORS middleware
- Kafka module (internal)

## Troubleshooting

### Server won't start
- Ensure Kafka is running: `docker-compose ps`
- Check Kafka initialization timeout (60 seconds default)
- Verify port 4000 is not in use

### Clients not receiving messages
- Verify client is connected: check connection logs
- Ensure client is in correct room
- Check Kafka messages are being produced

### CORS errors
- Ensure client is on localhost
- Check browser console for specific CORS error

## Security Considerations

⚠️ **This is a proof-of-concept for local development only.**

- No authentication/authorization
- CORS restricted to localhost
- Not suitable for production use
- Production would require proper auth and HTTPS
