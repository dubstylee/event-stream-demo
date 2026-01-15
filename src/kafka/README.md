# Kafka Module

A comprehensive KafkaJS-based module providing producer and consumer functionality with automatic retry, dead letter queue (DLQ) handling, and real-time event emission.

## Architecture

The module is organized into four main components:

- **`client.js`** - Shared KafkaJS client with connection management
- **`producer.js`** - Singleton producer with retry logic
- **`consumer.js`** - Multiple consumers with event emission and DLQ handling
- **`index.js`** - Public API that orchestrates all components

## Features

### Producer
- ✅ Singleton pattern for efficient resource usage
- ✅ Automatic JSON serialization
- ✅ Idempotent message production (no duplicates)
- ✅ Automatic retry with exponential backoff (max 3 attempts)
- ✅ Topic and message validation

### Consumer
- ✅ Separate consumer group per topic
- ✅ Automatic message consumption from beginning of topics
- ✅ Event-driven architecture with EventEmitter
- ✅ Automatic JSON deserialization
- ✅ Retry logic with attempt tracking (max 3 attempts)
- ✅ Dead Letter Queue (DLQ) for failed messages
- ✅ Auto-initialization on module import

### Connection Management
- ✅ Lazy initialization
- ✅ Connection health status tracking
- ✅ Graceful shutdown with message flush and offset commits

## Installation

```bash
bun add kafkajs
```

## Configuration

The module uses `src/kafka/config.json` for configuration:

```json
{
  "brokers": ["localhost:9092"],
  "clientId": "event-stream-demo",
  "retry": {
    "maxRetries": 3,
    "initialRetryTime": 100,
    "maxRetryTime": 30000
  },
  "connectionTimeout": 10000,
  "requestTimeout": 30000
}
```

## Usage

### Basic Producer Example

```javascript
import { produce } from "./kafka/index.js";

// Produce a message to a topic
await produce("order-created", {
  orderId: "12345",
  items: ["item1", "item2"],
  timestamp: new Date().toISOString()
});
```

### Basic Consumer Example

```javascript
import { onMessage } from "./kafka/index.js";

// Register a message handler
onMessage(({ topic, message, partition, offset }) => {
  console.log(`Received message on ${topic}:`, message);
  
  // Process the message
  if (topic === "order-created") {
    processOrder(message);
  }
});
```

### Connection Status Monitoring

```javascript
import { getConnectionStatus, onConnectionChange } from "./kafka/index.js";

// Get current status
const status = getConnectionStatus();
console.log("Status:", status.status); // 'connected', 'disconnected', 'connecting', 'error'

// Listen for connection changes
onConnectionChange((event) => {
  console.log("Connection changed:", event);
});
```

### Graceful Shutdown

```javascript
import { disconnect } from "./kafka/index.js";

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await disconnect(); // Flushes messages, commits offsets, closes connections
  process.exit(0);
});
```

## Topics

The module is configured to work with four topics:

| Topic                    | Purpose                                                |
|--------------------------|--------------------------------------------------------|
| `order-created`          | Triggered when user creates a new order               |
| `product-needs-review`   | Triggered when a product requires manual review       |
| `product-matched`        | Triggered when user approves a product from review    |
| `import-requested`       | Triggered when all products for an order are processed|

### Dead Letter Queue Topics

Failed messages are automatically sent to DLQ topics after 3 retry attempts:

- `order-created-dlq`
- `product-needs-review-dlq`
- `product-matched-dlq`
- `import-requested-dlq`

DLQ messages include:
```javascript
{
  originalMessage: "...", // The original message value
  error: "Error message",
  timestamp: 1234567890,
  attempts: 3
}
```

## Events

The module emits the following events via `kafkaEvents`:

### `kafka:message`
Emitted when a message is successfully consumed.

```javascript
{
  topic: "order-created",
  message: { /* parsed JSON message */ },
  partition: 0,
  offset: "12345"
}
```

### `kafka:connected`
Emitted when Kafka connection is established.

### `kafka:disconnected`
Emitted when Kafka connection is lost.

### `kafka:error`
Emitted when an error occurs.

```javascript
{
  topic: "order-created",  // Optional
  error: "Error message",
  message: "..."          // Optional
}
```

## API Reference

### `produce(topic, message)`
Produces a message to a Kafka topic.

**Parameters:**
- `topic` (string) - The Kafka topic name
- `message` (object) - The message object (will be JSON serialized)

**Returns:** `Promise<void>`

**Throws:** Error if topic is invalid, message is not serializable, or send fails after retries

**Example:**
```javascript
await produce("order-created", { orderId: 123 });
```

### `kafkaEvents`
EventEmitter instance for Kafka events.

**Example:**
```javascript
import { kafkaEvents } from "./kafka/index.js";

kafkaEvents.on("kafka:message", (payload) => {
  console.log("Message:", payload);
});
```

### `getConnectionStatus()`
Gets the current connection status.

**Returns:** `{ status: string, timestamp: number, error: string|null }`

**Example:**
```javascript
const status = getConnectionStatus();
if (status.status === "connected") {
  console.log("Connected to Kafka");
}
```

### `disconnect()`
Disconnects all Kafka connections gracefully.

**Returns:** `Promise<void>`

**Example:**
```javascript
await disconnect();
```

### `onMessage(handler)`
Convenience method to register a handler for consumed messages.

**Parameters:**
- `handler` (Function) - Callback that receives `{ topic, message, partition, offset }`

**Example:**
```javascript
onMessage(({ topic, message }) => {
  console.log(`${topic}:`, message);
});
```

### `onConnectionChange(handler)`
Convenience method to register a handler for connection status changes.

**Parameters:**
- `handler` (Function) - Callback that receives event data

**Example:**
```javascript
onConnectionChange((event) => {
  console.log("Connection event:", event);
});
```

### `waitForInitialization()`
Waits for consumer initialization to complete.

**Returns:** `Promise<void>`

**Example:**
```javascript
await waitForInitialization();
console.log("Consumers ready");
```

## Error Handling

### Producer Errors
- Invalid topic or message: Throws immediately
- Send failures: Retries 3 times with exponential backoff
- After 3 retries: Throws error to caller

### Consumer Errors
- JSON parse errors: Retries 3 times
- Processing errors: Retries 3 times
- After 3 retries: Sends to Dead Letter Queue (DLQ)

### Connection Errors
- Logged to `console.error`
- Connection status updated to 'error'
- `kafka:error` event emitted

## Testing

### Unit Tests
```bash
# Run all tests
bun test src/kafka/__tests__/

# Run specific test file
bun test src/kafka/__tests__/client.test.js
bun test src/kafka/__tests__/producer.test.js
bun test src/kafka/__tests__/consumer.test.js
bun test src/kafka/__tests__/index.test.js
```

Test coverage:
- **Client:** 12 tests - connection management, status tracking, disconnect
- **Producer:** 17 tests - singleton, retry logic, validation, disconnect
- **Consumer:** 23 tests - initialization, event emission, DLQ, retry logic
- **Index:** 18 tests - public API, convenience methods, auto-initialization

**Total: 70 unit tests passing ✅**

### Manual Integration Test
```bash
# Ensure Docker Compose is running
docker-compose up -d

# Run integration test
bun run src/kafka/manual-test.js
```

## Design Decisions

### Singleton Producer
Using a singleton producer reduces resource usage and connection overhead. A single producer can efficiently handle all message production across the application.

### Separate Consumer Groups
Each topic has its own consumer group to ensure independent processing and offset management. This allows flexible scaling and prevents cross-topic interference.

### Event Emitter Pattern
The EventEmitter pattern decouples Kafka message handling from business logic, making the code more maintainable and testable.

### Earliest Offset
Consumers start from the earliest offset (`fromBeginning: true`) to allow replay of all messages for learning and debugging purposes.

### Idempotent Producer
Idempotent configuration prevents duplicate messages when retries occur due to transient failures.

### DLQ Auto-Creation
DLQ topics are auto-created by Kafka on first produce, simplifying setup and reducing manual configuration.

### Auto-Initialization
Consumers auto-initialize on module import to ensure immediate message processing without explicit initialization calls.

## Troubleshooting

### "Connection failed" errors
- Ensure Docker Compose is running: `docker-compose up -d`
- Verify Kafka is accessible: `docker ps`
- Check configuration in `config.json`

### Messages not being consumed
- Check consumers initialized: `await waitForInitialization()`
- Verify connection status: `getConnectionStatus()`
- Check for errors in console logs

### DLQ topics not created
- DLQ topics are created automatically on first message
- Verify producer can reach Kafka
- Check Kafka logs for creation events

## Performance Considerations

- Single broker is sufficient for PoC throughput
- No batching needed for learning application
- Default partition count (1) is adequate
- Connection pooling via shared client
- Lazy initialization avoids startup overhead

## Security Considerations

⚠️ **This is a proof-of-concept module designed for local development only.**

- No authentication/authorization
- PLAINTEXT protocol
- Suitable for local development only
- Production would require SASL/SSL

## License

This is a proof-of-concept module for learning purposes.
