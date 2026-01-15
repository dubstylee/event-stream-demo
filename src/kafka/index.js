/**
 * Kafka Module - Public API
 * 
 * This module provides a unified interface for Kafka producer and consumer operations.
 * Consumers are automatically initialized when this module is imported.
 */

import { produce, disconnectProducer } from "./producer.js";
import { kafkaEvents, initializeConsumers, disconnectConsumers } from "./consumer.js";
import { getConnectionStatus, disconnect as disconnectClient } from "./client.js";

// Auto-initialize consumers on module import
let initializationPromise = null;

try {
  initializationPromise = initializeConsumers();
  initializationPromise
    .then(() => {
      console.log("[Kafka] Consumers initialized successfully");
    })
    .catch((error) => {
      console.error("[Kafka] Failed to initialize consumers:", error.message);
    });
} catch (error) {
  console.error("[Kafka] Error during consumer initialization:", error.message);
}

/**
 * Produces a message to a Kafka topic
 * @param {string} topic - The Kafka topic name
 * @param {object} message - The message object to send (will be JSON serialized)
 * @returns {Promise<void>}
 */
export { produce };

/**
 * Event emitter for Kafka events
 * Events:
 * - 'kafka:message': Emitted when a message is consumed { topic, message, partition, offset }
 * - 'kafka:connected': Emitted when Kafka connection is established
 * - 'kafka:disconnected': Emitted when Kafka connection is lost
 * - 'kafka:error': Emitted when an error occurs
 */
export { kafkaEvents };

/**
 * Gets the current connection status
 * @returns {{status: string, timestamp: number, error: string|null}}
 */
export { getConnectionStatus };

/**
 * Disconnects all Kafka connections gracefully
 * @returns {Promise<void>}
 */
export async function disconnect() {
  try {
    // Wait for initialization to complete before disconnecting
    if (initializationPromise) {
      await initializationPromise.catch(() => {
        // Ignore initialization errors during disconnect
      });
    }
    
    // Disconnect producer first to flush pending messages
    await disconnectProducer();
    
    // Disconnect all consumers to commit offsets
    await disconnectConsumers();
    
    // Disconnect client
    await disconnectClient();
    
    console.log("[Kafka] All connections disconnected successfully");
  } catch (error) {
    console.error("[Kafka] Error during disconnect:", error.message);
    throw error;
  }
}

/**
 * Convenience method to register a handler for consumed messages
 * @param {Function} handler - Callback function that receives { topic, message, partition, offset }
 * @returns {void}
 */
export function onMessage(handler) {
  kafkaEvents.on("kafka:message", handler);
}

/**
 * Convenience method to register a handler for connection status changes
 * @param {Function} handler - Callback function that receives event data
 * @returns {void}
 */
export function onConnectionChange(handler) {
  kafkaEvents.on("kafka:connected", handler);
  kafkaEvents.on("kafka:disconnected", handler);
  kafkaEvents.on("kafka:error", handler);
}

/**
 * Waits for consumer initialization to complete
 * @returns {Promise<void>}
 */
export async function waitForInitialization() {
  if (initializationPromise) {
    await initializationPromise;
  }
}
