import { getClient, setConnected, setConnectionError } from "./client.js";
import config from "./config.json";

/**
 * Singleton producer instance
 */
let producerInstance = null;

/**
 * Initializes the producer if not already initialized
 * @returns {Promise<Producer>} The KafkaJS producer instance
 */
async function getProducer() {
  if (!producerInstance) {
    try {
      const client = getClient();
      producerInstance = client.producer({
        idempotent: true,
        maxInFlightRequests: 5,
      });

      await producerInstance.connect();
      setConnected();
    } catch (error) {
      console.error(
        "[Kafka Producer] Failed to initialize producer:",
        error.message
      );
      setConnectionError(error);
      throw error;
    }
  }

  return producerInstance;
}

/**
 * Calculates exponential backoff delay
 * @param {number} attempt - The current attempt number (0-based)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt) {
  const delay = Math.min(
    config.retry.initialRetryTime * Math.pow(2, attempt),
    config.retry.maxRetryTime
  );
  return delay;
}

/**
 * Sleeps for the specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Produces a message to a Kafka topic with automatic retry logic
 * @param {string} topic - The Kafka topic name
 * @param {object} message - The message object to send (will be JSON serialized)
 * @returns {Promise<void>}
 * @throws {Error} If topic is invalid, message is not serializable, or send fails after retries
 */
export async function produce(topic, message) {
  // Validate topic
  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    throw new Error("[Kafka Producer] Topic must be a non-empty string");
  }

  // Validate message is serializable
  let serializedMessage;
  try {
    serializedMessage = JSON.stringify(message);
  } catch (error) {
    throw new Error(
      `[Kafka Producer] Message is not JSON serializable: ${error.message}`
    );
  }

  const producer = await getProducer();

  // Retry logic
  let lastError;
  for (let attempt = 0; attempt < config.retry.maxRetries; attempt++) {
    try {
      await producer.send({
        topic,
        messages: [{ value: serializedMessage }],
      });

      // Success - return immediately
      return;
    } catch (error) {
      lastError = error;

      if (attempt < config.retry.maxRetries - 1) {
        const backoffDelay = calculateBackoff(attempt);
        console.error(
          `[Kafka Producer] Send failed (attempt ${attempt + 1}/${
            config.retry.maxRetries
          }), retrying in ${backoffDelay}ms...`,
          `Topic: ${topic}, Error: ${error.message}`
        );
        await sleep(backoffDelay);
      }
    }
  }

  // All retries exhausted
  console.error(
    `[Kafka Producer] Failed to send message after ${config.retry.maxRetries} attempts.`,
    `Topic: ${topic}, Error: ${lastError.message}`
  );
  throw new Error(
    `Failed to produce message to topic '${topic}' after ${config.retry.maxRetries} attempts: ${lastError.message}`
  );
}

/**
 * Disconnects the producer gracefully, flushing pending messages
 * @returns {Promise<void>}
 */
export async function disconnectProducer() {
  if (producerInstance) {
    try {
      await producerInstance.disconnect();
      producerInstance = null;
      console.log("[Kafka Producer] Producer disconnected successfully");
    } catch (error) {
      console.error(
        "[Kafka Producer] Error during producer disconnect:",
        error.message
      );
      throw error;
    }
  }
}
