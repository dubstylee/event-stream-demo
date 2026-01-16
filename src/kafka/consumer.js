import { EventEmitter } from 'events';
import { getClient, setConnected, setConnectionError } from './client.js';
import { produce } from './producer.js';
import { handleOrderCreated } from './order-handler.js';
import { handleProductMatched } from './product-matched-handler.js';

/**
 * Event emitter for Kafka events
 */
export const kafkaEvents = new EventEmitter();

/**
 * Topics to consume from
 */
export const TOPICS = [
  'order-created',
  'product-needs-review',
  'product-matched',
  'import-requested'
];

/**
 * Array to store consumer instances
 */
let consumers = [];

/**
 * Map to track message processing attempts
 * Key: `${topic}-${partition}-${offset}`
 * Value: attempt count
 */
const processingAttempts = new Map();

/**
 * Tracks if consumers have been initialized
 */
let initialized = false;

/**
 * Creates a unique key for message attempt tracking
 * @param {string} topic - The topic name
 * @param {number} partition - The partition number
 * @param {string} offset - The message offset
 * @returns {string} Unique message key
 */
function getMessageKey(topic, partition, offset) {
  return `${topic}-${partition}-${offset}`;
}

/**
 * Sends a message to the Dead Letter Queue
 * @param {string} originalTopic - The original topic name
 * @param {object} originalMessage - The original message
 * @param {Error} error - The error that occurred
 * @returns {Promise<void>}
 */
async function sendToDLQ(originalTopic, originalMessage, error) {
  const dlqTopic = `${originalTopic}-dlq`;
  const dlqMessage = {
    originalMessage,
    error: error.message,
    timestamp: Date.now(),
    attempts: 3
  };
  
  try {
    await produce(dlqTopic, dlqMessage);
    console.error(
      `[Kafka Consumer] Message sent to DLQ. Topic: ${dlqTopic}, Error: ${error.message}`
    );
  } catch (dlqError) {
    console.error(
      `[Kafka Consumer] Failed to send message to DLQ. Topic: ${dlqTopic}, Error: ${dlqError.message}`
    );
  }
}

/**
 * Processes a consumed message
 * @param {object} payload - The message payload from Kafka
 * @returns {Promise<void>}
 */
async function processMessage({ topic, partition, message }) {
  const messageKey = getMessageKey(topic, partition, message.offset);
  
  try {
    // Parse message value from buffer to JSON
    const messageValue = JSON.parse(message.value.toString());
    
    // Create event payload
    const eventPayload = {
      topic,
      message: messageValue,
      partition,
      offset: message.offset
    };
    
    // Emit kafka:message event
    kafkaEvents.emit('kafka:message', eventPayload);
    
    // Handle topic-specific processing
    if (topic === 'order-created') {
      await handleOrderCreated(messageValue);
    } else if (topic === 'product-matched') {
      await handleProductMatched(messageValue);
    }
    
    // Clear attempt count on successful processing
    processingAttempts.delete(messageKey);
    
  } catch (error) {
    // Get current attempt count
    const currentAttempts = processingAttempts.get(messageKey) || 0;
    const newAttempts = currentAttempts + 1;
    
    console.error(
      `[Kafka Consumer] Error processing message (attempt ${newAttempts}/3). Topic: ${topic}, Error: ${error.message}`
    );
    
    if (newAttempts >= 3) {
      // Send to DLQ after 3 failed attempts
      const originalMessage = message.value.toString();
      await sendToDLQ(topic, originalMessage, error);
      
      // Clear attempt count after sending to DLQ
      processingAttempts.delete(messageKey);
      
      // Emit error event
      kafkaEvents.emit('kafka:error', {
        topic,
        error: error.message,
        message: originalMessage
      });
    } else {
      // Increment attempt count
      processingAttempts.set(messageKey, newAttempts);
      
      // Kafka will automatically redeliver the message
      // (since we're not committing the offset yet)
    }
  }
}

/**
 * Initializes consumers for all topics
 * @returns {Promise<void>}
 */
export async function initializeConsumers() {
  if (initialized) {
    return;
  }
  
  try {
    const client = getClient();
    
    // Create a consumer for each topic
    for (const topic of TOPICS) {
      const consumer = client.consumer({
        groupId: `${topic}-consumer-group`,
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      });
      
      // Connect consumer
      await consumer.connect();
      
      // Subscribe to topic
      await consumer.subscribe({
        topic,
        fromBeginning: true
      });
      
      // Start consuming messages
      await consumer.run({
        autoCommit: true,
        eachMessage: async (payload) => {
          await processMessage(payload);
        }
      });
      
      consumers.push(consumer);
    }
    
    initialized = true;
    setConnected();
    kafkaEvents.emit('kafka:connected');
    
  } catch (error) {
    console.error('[Kafka Consumer] Failed to initialize consumers:', error.message);
    setConnectionError(error);
    kafkaEvents.emit('kafka:error', { error: error.message });
    throw error;
  }
}

/**
 * Disconnects all consumers gracefully
 * @returns {Promise<void>}
 */
export async function disconnectConsumers() {
  if (consumers.length === 0) {
    return;
  }
  
  try {
    // Disconnect all consumers
    await Promise.all(
      consumers.map(consumer => consumer.disconnect())
    );
    
    consumers = [];
    initialized = false;
    processingAttempts.clear();
    
    kafkaEvents.emit('kafka:disconnected');
    
  } catch (error) {
    console.error('[Kafka Consumer] Error during consumer disconnect:', error.message);
    throw error;
  }
}
