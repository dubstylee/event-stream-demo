# Implementation Tasks: Kafka Producer and Consumer Infrastructure

## Overview

This tasks list breaks down the Kafka Producer and Consumer Infrastructure spec into actionable implementation steps. Tasks are grouped logically and ordered by dependencies to enable efficient development.

## Task Groups

### Group 1: Project Setup and Configuration

**Purpose:** Establish the foundational structure and configuration

- [x] **Task 1.1:** Install KafkaJS dependency

  - Run `bun add kafkajs` to install the KafkaJS client library
  - Verify installation in package.json dependencies

- [x] **Task 1.2:** Create Kafka module directory structure

  - Create `src/kafka/` directory
  - Create placeholder files: `client.js`, `producer.js`, `consumer.js`, `index.js`
  - Create `src/kafka/__tests__/` directory for unit tests

- [x] **Task 1.3:** Create configuration file
  - Create `src/kafka/config.json` with all required fields
  - Include brokers array with default `["localhost:9092"]`
  - Include clientId as `"event-stream-demo"`
  - Include retry settings: maxRetries (3), initialRetryTime (100), maxRetryTime (30000)
  - Include connectionTimeout (10000) and requestTimeout (30000)

### Group 2: Kafka Client Implementation

**Purpose:** Implement the shared KafkaJS client with connection management

- [x] **Task 2.1:** Implement client.js with lazy initialization

  - Import Kafka class from kafkajs package
  - Load configuration from config.json
  - Create `getClient()` function with lazy initialization pattern
  - Initialize client only on first call, cache for subsequent calls
  - Return client instance

- [x] **Task 2.2:** Add connection status tracking

  - Create internal state variable tracking connection status
  - Define status states: 'connected', 'disconnected', 'connecting', 'error'
  - Implement `getConnectionStatus()` function returning `{ status, timestamp, error? }`
  - Update status on connection lifecycle events

- [x] **Task 2.3:** Implement error handling and logging

  - Add try-catch blocks around client initialization
  - Log errors to console.error with descriptive messages
  - Update connection status to 'error' on failures
  - Include error details in status object

- [x] **Task 2.4:** Implement disconnect function

  - Create `disconnect()` async function for graceful shutdown
  - Close KafkaJS client connection
  - Update connection status to 'disconnected'
  - Handle disconnect errors gracefully

- [x] **Task 2.5:** Write unit tests for client.js
  - Create `src/kafka/__tests__/client.test.js`
  - Mock kafkajs module using `vi.mock('kafkajs')`
  - Test lazy initialization (client created on first call, cached after)
  - Test connection status tracking for all states
  - Test error handling and console.error logging
  - Test disconnect function

### Group 3: Producer Implementation

**Purpose:** Implement the producer singleton with produce method and retry logic

- [ ] **Task 3.1:** Create producer singleton

  - Import `getClient()` from client.js
  - Create singleton producer instance variable (initially null)
  - Initialize producer on first `produce()` call using `client.producer()`
  - Configure producer with `idempotent: true`
  - Configure producer with `maxInFlightRequests: 5`
  - Call `producer.connect()` on initialization

- [ ] **Task 3.2:** Implement produce function with JSON serialization

  - Create `produce(topic, message)` async function
  - Validate topic is non-empty string
  - Validate message is serializable to JSON
  - Serialize message using `JSON.stringify(message)`
  - Call `producer.send({ topic, messages: [{ value: serialized }] })`
  - Return Promise that resolves on success

- [ ] **Task 3.3:** Add automatic retry logic

  - Wrap `producer.send()` in try-catch block
  - Implement retry loop with max 3 attempts
  - Use retry settings from config.json (initialRetryTime, maxRetryTime)
  - Calculate exponential backoff between retries
  - Log each retry attempt to console.error
  - After 3 failed retries, throw error to caller

- [ ] **Task 3.4:** Implement producer disconnect

  - Create `disconnectProducer()` async function
  - Flush pending messages using `producer.disconnect()`
  - Wait for all in-flight operations to complete
  - Handle disconnect errors gracefully
  - Log disconnect completion

- [ ] **Task 3.5:** Add JSDoc comments and error messages

  - Add JSDoc comments for `produce()` function signature
  - Document parameters: topic (string), message (object)
  - Document return value: Promise<void>
  - Include descriptive error messages with context (topic, operation)

- [ ] **Task 3.6:** Write unit tests for producer.js
  - Create `src/kafka/__tests__/producer.test.js`
  - Mock client.js and kafkajs modules
  - Test produce function with valid message
  - Test JSON serialization of message objects
  - Test retry logic with simulated failures
  - Test error handling after 3 failed retries
  - Test producer singleton pattern (same instance reused)
  - Test disconnectProducer flushes and disconnects
  - Verify console.error logging on errors

### Group 4: Consumer Implementation

**Purpose:** Implement consumers with event emission and DLQ handling

- [ ] **Task 4.1:** Create EventEmitter and define topics

  - Import EventEmitter from Node.js events module
  - Create and export single EventEmitter instance
  - Define array of all four topics: order-created, product-needs-review, product-matched, import-requested
  - Export topics array for use in tests

- [ ] **Task 4.2:** Implement consumer initialization for all topics

  - Import `getClient()` from client.js
  - Create array to store all consumer instances
  - For each topic, create consumer with group ID format: `${topicName}-consumer-group`
  - Configure consumers with `fromBeginning: true`
  - Configure consumers with `autoCommit: true`
  - Configure consumers with `sessionTimeout: 30000` and `heartbeatInterval: 3000`
  - Store each consumer instance in array

- [ ] **Task 4.3:** Implement message processing with event emission

  - For each consumer, call `consumer.subscribe({ topic })`
  - Call `consumer.run({ eachMessage })` to start processing
  - In eachMessage handler, extract message value from buffer
  - Parse message value to JSON using `JSON.parse()`
  - Create event payload: `{ topic, message, partition, offset }`
  - Emit `kafka:message` event with payload
  - Emit `kafka:connected` event after all consumers are running

- [ ] **Task 4.4:** Add message processing retry logic

  - Create in-memory Map to track processing attempts per message
  - Use message offset as key for attempt tracking
  - Wrap message processing in try-catch block
  - On error, increment attempt count in Map
  - If attempts < 3, log error and continue (Kafka will redeliver)
  - If attempts >= 3, send message to DLQ

- [ ] **Task 4.5:** Implement Dead Letter Queue (DLQ) handling

  - Import `produce()` function from producer.js
  - Create DLQ topic name format: `${originalTopic}-dlq`
  - Create DLQ message object: `{ originalMessage, error: error.message, timestamp: Date.now(), attempts: 3 }`
  - Call `produce(dlqTopic, dlqMessage)` to send to DLQ
  - Log DLQ message send to console.error with topic and error details
  - Clear attempt count from Map after sending to DLQ
  - DLQ topics auto-created by Kafka on first produce

- [ ] **Task 4.6:** Implement consumer disconnect

  - Create `disconnectConsumers()` async function
  - For each consumer, call `consumer.disconnect()` to commit offsets
  - Wait for all consumers to finish processing current messages
  - Handle disconnect errors gracefully
  - Emit `kafka:disconnected` event after all consumers disconnected

- [ ] **Task 4.7:** Add connection lifecycle event emission

  - Emit `kafka:connected` event when all consumers successfully running
  - Emit `kafka:disconnected` event when connection lost
  - Emit `kafka:error` event with error details on connection errors
  - Update client connection status on each event

- [ ] **Task 4.8:** Write unit tests for consumer.js
  - Create `src/kafka/__tests__/consumer.test.js`
  - Mock client.js, producer.js, and kafkajs modules
  - Test consumer initialization for all four topics
  - Test event emission with `kafka:message` event
  - Test JSON parsing of message values
  - Test retry logic increments attempts correctly
  - Test DLQ routing after 3 failed attempts
  - Test DLQ message format includes all required fields
  - Test consumer disconnect commits offsets
  - Test connection lifecycle event emissions
  - Verify console.error calls for errors

### Group 5: Public API and Integration

**Purpose:** Create the public API and integration points

- [ ] **Task 5.1:** Implement index.js public API

  - Import `produce` from producer.js
  - Import EventEmitter as `kafkaEvents` from consumer.js
  - Import `getConnectionStatus` from client.js
  - Import `disconnectProducer` from producer.js
  - Import `disconnectConsumers` from consumer.js
  - Export `produce`, `kafkaEvents`, `getConnectionStatus`

- [ ] **Task 5.2:** Create combined disconnect function

  - Create `disconnect()` async function
  - Call `disconnectProducer()` first to flush messages
  - Call `disconnectConsumers()` to commit offsets
  - Call `disconnect()` from client.js to close connection
  - Return Promise that resolves when all complete
  - Export `disconnect` function

- [ ] **Task 5.3:** Add convenience methods for event handling

  - Create `onMessage(handler)` function that registers handler for `kafka:message` events
  - Create `onConnectionChange(handler)` function for connection status events
  - Export both convenience functions
  - Add JSDoc comments for all exported functions

- [ ] **Task 5.4:** Initialize consumers on module import

  - Call consumer initialization function when index.js is imported
  - Ensure consumers start automatically without explicit call
  - Handle initialization errors gracefully
  - Log initialization completion

- [ ] **Task 5.5:** Write integration tests for index.js
  - Create `src/kafka/__tests__/index.test.js`
  - Mock all submodules (client, producer, consumer)
  - Test all exported functions are available
  - Test `disconnect()` calls all submodule disconnect functions
  - Test convenience methods register event handlers correctly
  - Test consumers auto-initialize on module import

### Group 6: Testing and Verification

**Purpose:** Ensure comprehensive test coverage and functionality

- [ ] **Task 6.1:** Configure Vitest for Kafka module tests

  - Verify Vitest is installed (or run `bun add -D vitest`)
  - Create or update vitest.config.js if needed
  - Ensure test files can import Kafka modules

- [ ] **Task 6.2:** Run all unit tests and fix failures

  - Run `bun test src/kafka/__tests__/` to execute all tests
  - Review test results and identify failures
  - Fix any failing tests or implementation issues
  - Ensure all tests pass with green status

- [ ] **Task 6.3:** Verify test coverage

  - Check that all major code paths are tested
  - Ensure error handling paths are covered
  - Ensure retry logic is thoroughly tested
  - Ensure DLQ routing is tested

- [ ] **Task 6.4:** Manual integration verification with Docker Compose

  - Ensure Docker Compose is running (from spec #1)
  - Create simple test script that imports Kafka module
  - Test producing messages to all four topics
  - Verify consumers receive and emit events
  - Verify DLQ topics are auto-created on errors
  - Test graceful shutdown with disconnect()
  - Verify connection status changes are tracked

- [ ] **Task 6.5:** Code quality review
  - Review all files for consistent code style
  - Ensure all exported functions have JSDoc comments
  - Ensure error messages are descriptive and include context
  - Ensure edge cases are handled (empty messages, invalid JSON)
  - Run linter (if configured) and fix any issues

### Group 7: Documentation

**Purpose:** Document the module for future developers

- [ ] **Task 7.1:** Add README to Kafka module

  - Create `src/kafka/README.md`
  - Document module purpose and architecture
  - Document all exported functions with examples
  - Document event emitter pattern and available events
  - Document configuration options in config.json
  - Include example usage for producer and consumer
  - Document error handling and DLQ behavior
  - Document graceful shutdown process

- [ ] **Task 7.2:** Add inline code comments
  - Add comments explaining complex logic (retry logic, DLQ routing)
  - Add comments explaining design decisions (singleton pattern, event emitter)
  - Add comments for any non-obvious code
  - Keep comments concise and focused on "why" not "what"

## Task Dependencies

### Critical Path

1. Group 1 (Setup) → Group 2 (Client) → Group 3 (Producer) → Group 4 (Consumer) → Group 5 (Public API) → Group 6 (Testing) → Group 7 (Documentation)

### Parallel Work Opportunities

- Tasks 3.6 (producer tests) and 4.8 (consumer tests) can be written in parallel after implementation
- Group 7 (Documentation) can be worked on in parallel with Group 6 (Testing)

### Key Dependencies

- Task 3.1 depends on Task 2.1 (producer needs client)
- Task 4.2 depends on Task 2.1 (consumers need client)
- Task 4.5 depends on Task 3.2 (DLQ needs producer)
- Group 5 depends on Groups 2, 3, and 4 (public API exports from submodules)
- Group 6 depends on Groups 2, 3, 4, 5 (testing needs implementation)

## Notes

- All tests use mocked KafkaJS - no integration tests against real Kafka
- DLQ topics are auto-created by Kafka, no manual setup required
- Module is framework-agnostic - Socket.io and Express integration happens in calling code
- Consumers start automatically on module import for immediate message processing
- Connection status tracking enables health monitoring by other application components
