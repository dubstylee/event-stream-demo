# Spec Requirements: Kafka Producer and Consumer Infrastructure

## Initial Description

Create KafkaJS service module with connection management, producer instance, and consumer group setup for all four topics. This is the second item on the product roadmap and provides the Node.js foundation for producing and consuming messages from the Kafka topics.

## Requirements Discussion

### First Round Questions

**Q1: Module Structure and Organization**
How should the KafkaJS service module be structured?
**Answer:** Separate producer and consumer concerns, located in `src/kafka/` directory structure.

**Q2: Connection Management**
How should the Kafka connection be initialized and managed?
**Answer:** Single instance, initialized on first use, configuration from config file, display error on failure.

**Q3: Producer Configuration**
What producer configuration and capabilities are needed?
**Answer:** Singleton is fine, JSON serialization, generic producer function is sufficient, enable idempotence.

**Q4: Consumer Group Setup**
How should the consumer(s) be configured?
**Answer:** Separate consumer group per topic, IDs based on topic name, start from earliest offset.

**Q5: Message Handling Pattern**
How should consumed messages be processed?
**Answer:** Event emitter pattern.

**Q6: Error Handling and Resilience**
What error handling is needed?
**Answer:** Automatic retry up to 3 times for production, processing errors to DLQ (Dead Letter Queue), expose connection health status, error logs to console.error.

**Q7: Graceful Shutdown**
How should the service handle application shutdown?
**Answer:** Yes - implement disconnect/close method, flush pending messages, commit offsets before shutdown.

**Q8: Type Safety and TypeScript**
Should this be implemented in TypeScript or JavaScript?
**Answer:** JavaScript is fine for this proof of concept.

**Q9: Testing Strategy**
What testing approach should be used?
**Answer:** Unit tests only with mocked KafkaJS.

**Q10: Dependencies and Integration Points**
What should this module integrate with?
**Answer:** Express will call the producer, Socket.io will be notified when messages are consumed.

### Existing Code to Reference

Docker Compose setup (spec #1) provides the running Kafka and Zookeeper infrastructure with pre-created topics.

### Follow-up Questions

**F1: Configuration File Details**
What format and location for the config file?
**Answer:** `src/kafka/config.json` with broker URL, retry settings, and timeout values.

**F2: Dead Letter Queue (DLQ) Configuration**
How should DLQ topics be named and configured?
**Answer:** Naming convention `<topic>-dlq`, auto-created, max retry of 3 before sending to DLQ.

**F3: Event Emitter Event Names**
What event naming convention should be used?
**Answer:** Event name `kafka:message`, emit parsed JSON.

**F4: Connection Health Status**
How should health status be exposed?
**Answer:** Synchronous getter method with states: connected, disconnected, connecting, error. Broadcast status changes to Socket.io clients.

**F5: Kafka Broker Configuration**
Should broker URL be hard-coded or configurable?
**Answer:** Configurable with default of `localhost:9092`.

**F6: Consumer Message Processing**
How should messages be parsed and broadcast?
**Answer:** Automatically parse JSON, expose just values (not keys), broadcast to all connected clients.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

Not applicable - this is a backend infrastructure module with no UI components.

## Requirements Summary

### Functional Requirements

**Module Structure**
- Separate producer and consumer modules in `src/kafka/` directory
- Producer module: handles message production to Kafka topics
- Consumer module: handles message consumption with event emission
- Configuration file: `src/kafka/config.json` for broker settings

**Producer Capabilities**
- Singleton producer instance shared across application
- Generic `produce(topic, message)` function accepting any topic and message object
- Automatic JSON serialization of message payloads
- Idempotent producer configuration to prevent duplicate messages
- Automatic retry up to 3 times on production failures
- Graceful shutdown with pending message flush

**Consumer Capabilities**
- Separate consumer group per topic (4 total consumers)
- Consumer group IDs based on topic names (e.g., `order-created-consumer-group`)
- Start consuming from earliest offset (beginning of topic)
- Event emitter pattern for message handling (`kafka:message` events)
- Automatic JSON deserialization of consumed messages
- Message value extraction (keys not exposed)
- Error handling with 3 retry attempts before DLQ
- Graceful shutdown with offset commits

**Connection Management**
- Single shared KafkaJS client instance
- Lazy initialization on first use (not on module import)
- Configuration from `src/kafka/config.json`
- Connection health status tracking (connected, disconnected, connecting, error)
- Synchronous `getConnectionStatus()` method
- Error display/logging on connection failures
- Console.error logging for all errors

**Dead Letter Queue (DLQ)**
- Auto-created DLQ topic per source topic
- Naming convention: `<topic>-dlq` (e.g., `order-created-dlq`)
- Messages sent to DLQ after 3 failed processing attempts
- DLQ messages include original message and error metadata

**Integration Points**
- Express routes call producer to publish messages
- Socket.io broadcasts consumed messages to all connected clients
- Socket.io broadcasts connection health status changes
- Event emitter pattern allows decoupled message handling

### Technical Specifications

**Technology Stack**
- Runtime: Bun
- Language: JavaScript (no TypeScript for PoC)
- Kafka Client: KafkaJS
- Event Pattern: Node.js EventEmitter
- Testing: Vitest with mocked KafkaJS

**File Structure**
```
src/kafka/
  ├── config.json          # Kafka broker configuration
  ├── client.js            # Shared KafkaJS client instance
  ├── producer.js          # Producer singleton with produce() method
  ├── consumer.js          # Consumer setup with event emission
  └── index.js             # Public API exports
```

**Configuration Schema (config.json)**
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

**Producer Configuration**
- Idempotence: enabled
- Compression: none (simple PoC)
- Max in-flight requests: 5
- Serialization: JSON.stringify
- Retry logic: automatic with 3 max attempts

**Consumer Configuration**
- Consumer groups: 4 separate groups (one per topic)
  - `order-created-consumer-group`
  - `product-needs-review-consumer-group`
  - `product-matched-consumer-group`
  - `import-requested-consumer-group`
- Auto offset commit: true
- From beginning: true (earliest offset)
- Deserialization: automatic JSON.parse
- Session timeout: 30000ms
- Heartbeat interval: 3000ms

**Event Emitter Events**
- `kafka:message` - Emitted when message consumed (payload: { topic, message, partition, offset })
- `kafka:connected` - Emitted when Kafka connection established
- `kafka:disconnected` - Emitted when Kafka connection lost
- `kafka:error` - Emitted on connection or processing errors

**Error Handling**
- Producer errors: retry 3 times, then throw/log
- Consumer processing errors: retry 3 times, then send to DLQ
- Connection errors: log to console.error, update health status
- DLQ message format: { originalMessage, error, timestamp, attempts }

**Health Status API**
```javascript
getConnectionStatus() // Returns: { status: 'connected|disconnected|connecting|error', timestamp, error? }
```

**Graceful Shutdown**
- `disconnect()` method to close all connections
- Flush producer pending messages
- Commit consumer offsets
- Wait for in-flight operations
- Close KafkaJS client

### Reusability Opportunities

**Shared Kafka Client**
- Single client instance reused by all producers and consumers
- Connection pooling benefits
- Consistent configuration across all Kafka operations

**Event Emitter Pattern**
- Decouples message consumption from business logic
- Allows multiple handlers to listen to same topic
- Extensible for future features

**Generic Producer**
- Single `produce(topic, message)` function handles all topics
- Easy to add new topics without code changes
- Consistent message serialization

**DLQ Infrastructure**
- Reusable error handling pattern
- Can be extended to other error scenarios
- Preserves failed messages for investigation

### Scope Boundaries

**In Scope:**
- KafkaJS client initialization and connection management
- Producer singleton with generic `produce(topic, message)` method
- Four consumer groups (one per topic) with event emission
- Configuration file (`src/kafka/config.json`)
- Connection health status tracking and API
- Automatic retry logic (3 attempts) for producer and consumer
- Dead Letter Queue (DLQ) implementation with auto-created topics
- Event emitter pattern for consumed messages
- Graceful shutdown with flush and commit
- Socket.io integration (event emission only, not Socket.io setup)
- Console.error logging for errors
- Unit tests with mocked KafkaJS

**Out of Scope:**
- Socket.io server setup (handled in spec #3)
- Express server setup (handled in spec #3)
- Business logic for message processing (handled in specs #5-8)
- Kafka topic creation (already handled in spec #1)
- Production-grade monitoring/observability
- Schema validation or Schema Registry integration
- Message transformation or enrichment logic
- Kafka Streams or ksqlDB integration
- Message batching strategies
- Custom partitioning logic
- Transactional message guarantees
- Integration tests against real Kafka (unit tests only)
- Frontend components (handled in spec #4)

### Technical Considerations

**Dependencies on Previous Specs**
- Requires Docker Compose setup (spec #1) to be running
- Kafka broker must be available at configured broker URL
- Four topics must exist: order-created, product-needs-review, product-matched, import-requested

**Dependencies for Future Specs**
- Spec #3 (Express/Socket.io) will consume this module's events
- Specs #5-8 will use the producer to publish messages
- Specs #5-8 will register handlers for consumed messages

**Design Decisions**
- JavaScript over TypeScript: faster PoC development, less boilerplate
- Event emitter pattern: decouples Kafka from business logic, enables future extensibility
- Separate consumer groups: ensures independent processing of each topic
- Earliest offset: allows replay of all messages for learning/debugging
- Idempotent producer: prevents duplicate messages on retry
- DLQ auto-creation: simplifies setup, no manual topic management
- Config file: centralizes settings, easy to modify without code changes

**Testing Strategy**
- Mock KafkaJS client in unit tests
- Test producer message serialization and retry logic
- Test consumer event emission and error handling
- Test DLQ message routing
- Test connection status tracking
- Test graceful shutdown sequence
- No integration tests to avoid complexity in PoC

**Performance Considerations**
- Single broker sufficient for PoC throughput
- No batching needed for learning application
- Default partition count (1) adequate
- Connection pooling via shared client
- Lazy initialization avoids startup overhead

**Security Considerations**
- No authentication/authorization (PoC only)
- PLAINTEXT protocol (matching Docker Compose setup)
- Suitable for local development only
- Production would require SASL/SSL

