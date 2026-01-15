import { Kafka } from 'kafkajs';
import config from './config.json';

/**
 * Kafka client instance (initialized lazily)
 */
let kafkaClient = null;

/**
 * Connection status tracking
 */
let connectionStatus = {
  status: 'disconnected',
  timestamp: Date.now(),
  error: null
};

/**
 * Updates the connection status
 * @param {string} status - One of: 'connected', 'disconnected', 'connecting', 'error'
 * @param {Error|null} error - Optional error object
 */
function updateConnectionStatus(status, error = null) {
  connectionStatus = {
    status,
    timestamp: Date.now(),
    error: error ? error.message : null
  };
}

/**
 * Gets or creates the Kafka client instance (lazy initialization)
 * @returns {Kafka} The KafkaJS client instance
 */
export function getClient() {
  if (!kafkaClient) {
    try {
      updateConnectionStatus('connecting');
      
      kafkaClient = new Kafka({
        clientId: config.clientId,
        brokers: config.brokers,
        retry: {
          maxRetryTime: config.retry.maxRetryTime,
          initialRetryTime: config.retry.initialRetryTime,
          retries: config.retry.maxRetries
        },
        connectionTimeout: config.connectionTimeout,
        requestTimeout: config.requestTimeout
      });

      // Note: The Kafka client itself doesn't have a connect() method
      // Connection happens when producers/consumers connect
      // We'll update status to 'connected' when first producer/consumer connects successfully
      
    } catch (error) {
      console.error('[Kafka Client] Failed to create Kafka client:', error.message);
      updateConnectionStatus('error', error);
      throw error;
    }
  }
  
  return kafkaClient;
}

/**
 * Gets the current connection status
 * @returns {{status: string, timestamp: number, error: string|null}}
 */
export function getConnectionStatus() {
  return { ...connectionStatus };
}

/**
 * Updates the connection status to connected (called by producer/consumer on successful connection)
 */
export function setConnected() {
  updateConnectionStatus('connected');
}

/**
 * Updates the connection status to error (called by producer/consumer on connection error)
 * @param {Error} error - The error that occurred
 */
export function setConnectionError(error) {
  updateConnectionStatus('error', error);
}

/**
 * Disconnects the Kafka client gracefully
 * @returns {Promise<void>}
 */
export async function disconnect() {
  try {
    if (kafkaClient) {
      // Note: KafkaJS client doesn't have a disconnect method
      // Disconnection happens through producer/consumer disconnect
      // This function mainly updates the status
      updateConnectionStatus('disconnected');
      kafkaClient = null;
    }
  } catch (error) {
    console.error('[Kafka Client] Error during disconnect:', error.message);
    updateConnectionStatus('error', error);
    throw error;
  }
}
