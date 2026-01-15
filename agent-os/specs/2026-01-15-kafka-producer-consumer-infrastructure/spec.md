# Specification: Kafka Producer and Consumer Infrastructure

## Goal
Create a KafkaJS service module with connection management, producer instance, and consumer group setup for all four topics, enabling the Node.js application to publish and consume messages from Kafka with automatic retry, dead letter queue handling, and real-time event emission.

## User Stories
- As a backend developer, I want a simple producer API so that I can publish messages to any Kafka topic with a single function call
- As a backend developer, I want automatic retry and DLQ handling so that transient failures don't result in lost messages
- As a technical learner, I want consumers that automatically process all messages from the beginning so that I can observe the complete message flow
- As a developer, I want an event-based architecture so that I can decouple Kafka message handling from business logic

## Specific Requirements

**File Structure and Organization**
- Create `src/kafka/` directory to contain all Kafka-related modules
- Create `src/kafka/config.json` for broker configuration settings
- Create `src/kafka/client.js` to export the shared KafkaJS client instance
- Create `src/kafka/producer.js` to export the producer singleton with produce method
- Create `src/kafka/consumer.js` to export consumer setup and event emission logic
- Create `src/kafka/index.js` as the public API that re-exports all necessary functions and objects

**Configuration File (config.json)**
- Create configuration file at `src/kafka/config.json` with JSON format
- Include `brokers` array with default value `["localhost:9092"]`
- Include `clientId` string with value `"event-stream-demo"`
- Include `retry` object with `maxRetries: 3`, `initialRetryTime: 100`, `maxRetryTime: 30000`
- Include `connectionTimeout` set to `10000` milliseconds
- Include `requestTimeout` set to `30000` milliseconds
- Configuration should be loadable via `require()` or `import()`

**Kafka Client Instance (client.js)**
- Import `Kafka` class from `kafkajs` package
- Create single shared client instance using configuration from `config.json`
- Use lazy initialization pattern (create on first access, not on module import)
- Export `getClient()` function that returns the initialized client
- Include internal connection state tracking (connected, disconnected, connecting, error)
- Export `getConnectionStatus()` function returning `{ status, timestamp, error? }`
- Log connection errors to `console.error` with descriptive messages
- Export `disconnect()` function for graceful shutdown

**Producer Module (producer.js)**
- Import client from `client.js` using `getClient()` function
- Create singleton producer instance via `client.producer()` on first use
- Configure producer with `idempotent: true` to prevent duplicate messages
- Configure producer with `maxInFlightRequests: 5`
- Export `produce(topic, message)` async function as primary API
- Accept `topic` as string parameter (any valid Kafka topic name)
- Accept `message` as JavaScript object parameter
- Serialize message to JSON string using `JSON.stringify(message)`
- Send message to Kafka with `await producer.send({ topic, messages: [{ value }] })`
- Implement automatic retry up to 3 times on send failures
- Log production errors to `console.error` with topic and error details
- After 3 failed retries, throw error to caller
- Export `disconnectProducer()` function that flushes pending messages and disconnects
- Ensure producer connects automatically on first `produce()` call

**Consumer Module (consumer.js)**
- Import `EventEmitter` from Node.js `events` module
- Create and export single EventEmitter instance for all Kafka events
- Import client from `client.js` using `getClient()` function
- Define array of all four topics: `['order-created', 'product-needs-review', 'product-matched', 'import-requested']`
- For each topic, create separate consumer with unique group ID
- Consumer group ID format: `${topicName}-consumer-group` (e.g., `order-created-consumer-group`)
- Configure each consumer with `fromBeginning: true` to start at earliest offset
- Configure each consumer with `autoCommit: true` for automatic offset commits
- Configure each consumer with `sessionTimeout: 30000` milliseconds
- Configure each consumer with `heartbeatInterval: 3000` milliseconds
- Call `consumer.run()` for each consumer to begin message processing
- In `eachMessage` handler, parse message value from buffer to JSON using `JSON.parse()`
- Extract only message value, not message key
- Emit `kafka:message` event with payload `{ topic, message, partition, offset }`
- Implement error handling with retry logic for message processing failures
- Track processing attempts per message (use in-memory Map with message offset as key)
- On processing error, increment attempt count and retry up to 3 times
- After 3 failed attempts, send message to Dead Letter Queue topic
- DLQ topic name format: `${originalTopic}-dlq` (e.g., `order-created-dlq`)
- DLQ message format: `{ originalMessage, error: error.message, timestamp: Date.now(), attempts: 3 }`
- Auto-create DLQ topics using `producer.send()` with Kafka's auto-create feature
- Log consumer processing errors to `console.error` with topic and error details
- Export `disconnectConsumers()` function that commits offsets and disconnects all consumers
- Emit `kafka:connected` event when all consumers are successfully running
- Emit `kafka:disconnected` event when connection is lost
- Emit `kafka:error` event with error details when connection or processing errors occur

**Public API (index.js)**
- Import and re-export `produce` function from `producer.js`
- Import and re-export EventEmitter instance as `kafkaEvents` from `consumer.js`
- Import and re-export `getConnectionStatus` function from `client.js`
- Import disconnectProducer and disconnectConsumers, combine into single `disconnect` function
- Export `disconnect()` async function that calls both producer and consumer disconnect methods
- Ensure all consumers start automatically when module is imported (call initialization in index.js)
- Export convenience method `onMessage(handler)` that registers handler for `kafka:message` events
- Export convenience method `onConnectionChange(handler)` for connection status events

**Error Handling and Resilience**
- All Kafka operations wrapped in try-catch blocks
- Producer retry logic: attempt send 3 times with exponential backoff from config
- Consumer retry logic: track attempts per message, retry 3 times before DLQ
- Connection errors caught and logged with `console.error`
- Update connection status on all connection state changes
- Emit appropriate events (`kafka:error`, `kafka:disconnected`) on failures
- DLQ messages include full context: original message, error message, timestamp, attempt count
- Never throw errors that would crash the Node.js process
- Failed producer messages after retries should throw error to caller for explicit handling

**Integration with Socket.io**
- Consumer module emits `kafka:message` events that Socket.io handlers can listen to
- Connection status changes emit events that Socket.io can broadcast
- Socket.io integration happens in calling code, not within Kafka module
- Module should be framework-agnostic except for event emission
- Events emitted include all necessary data for Socket.io to broadcast to clients

**Integration with Express**
- Express routes will import and call `produce(topic, message)` function
- Producer returns Promise that resolves on success or rejects on failure
- Express error handling middleware can catch producer failures
- No direct dependency on Express within Kafka module

**Graceful Shutdown**
- Implement `disconnect()` function that orchestrates full shutdown
- First, flush all pending producer messages using `producer.disconnect()`
- Wait for in-flight producer operations to complete
- Commit all consumer offsets using `consumer.disconnect()` for each consumer
- Wait for all consumers to finish processing current messages
- Close the KafkaJS client connection
- Update connection status to 'disconnected'
- Emit `kafka:disconnected` event
- Function should be async and return Promise that resolves when complete
- Handle shutdown errors gracefully, log to console.error

**Unit Testing Requirements**
- Use Vitest as testing framework
- Mock KafkaJS client using `vi.mock('kafkajs')`
- Test file: `src/kafka/__tests__/producer.test.js` for producer tests
- Test file: `src/kafka/__tests__/consumer.test.js` for consumer tests
- Test file: `src/kafka/__tests__/client.test.js` for client tests
- Test producer: message serialization, retry logic, error handling
- Test consumer: event emission, JSON parsing, DLQ routing, retry logic
- Test client: connection status tracking, lazy initialization
- Test graceful shutdown: flush, commit, disconnect sequence
- Mock producer.send() to simulate success and failure scenarios
- Mock consumer.run() to simulate message consumption
- Verify event emissions with event listener spies
- Verify console.error calls for error logging
- Test DLQ message format includes all required fields
- Test retry logic counts attempts correctly

**Dependencies**
- Install `kafkajs` package (KafkaJS client library)
- Use Node.js built-in `events` module (EventEmitter)
- Use Node.js built-in `fs` module for reading config file if needed
- Bun runtime provides Node.js compatibility for these modules

**Code Quality Standards**
- Follow JavaScript ES modules syntax (import/export)
- Use async/await for all asynchronous operations
- Use descriptive variable and function names
- Include JSDoc comments for all exported functions
- Handle edge cases: empty messages, invalid JSON, null values
- Log meaningful error messages with context (topic, operation, error message)
- Keep modules focused: separate concerns between producer, consumer, client
- Export minimal public API surface from index.js
- Validate topic names are non-empty strings
- Validate messages are serializable to JSON

## Visual Design
No visual assets provided - this is a backend infrastructure module with no UI components.

## Existing Code to Leverage
Docker Compose setup (spec #1) provides the running Kafka and Zookeeper infrastructure with pre-created topics: `order-created`, `product-needs-review`, `product-matched`, `import-requested`.

## Out of Scope
- Socket.io server setup and configuration (handled in spec #3)
- Express server setup and routing (handled in spec #3)
- Business logic for processing specific message types (handled in specs #5-8)
- Kafka topic creation or management (topics already exist from spec #1)
- Production-grade monitoring, metrics, or observability tools
- Schema validation or Schema Registry integration
- Message transformation or enrichment logic
- Kafka Streams or ksqlDB integration
- Message batching strategies or custom batching logic
- Custom partitioning strategies or partition assignment
- Transactional message guarantees or exactly-once semantics
- Integration tests against real Kafka cluster
- Frontend components or UI elements (handled in spec #4)
- Authentication or authorization for Kafka connections
- SSL/TLS encryption configuration
- SASL authentication mechanisms
- Message compression configuration
- Custom serializers or deserializers beyond JSON
- Consumer lag monitoring or alerting
- Message replay functionality
- Kafka admin operations (create topics, delete topics, etc.)
