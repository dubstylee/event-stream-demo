import { useState, useEffect, useCallback } from "react";

const TOPICS = [
  "order-created",
  "product-needs-review",
  "product-matched",
  "import-requested",
];

const MAX_MESSAGES_PER_TOPIC = 10;

/**
 * Creates initial state for all topics with empty message arrays and zero counts.
 * @returns {Object} Initial topic state
 */
function createInitialTopicState() {
  const state = {};
  TOPICS.forEach((topic) => {
    state[topic] = {
      messages: [],
      count: 0,
    };
  });
  return state;
}

/**
 * Custom hook for managing Kafka messages received via Socket.io.
 * Maintains separate message arrays for each topic and tracks message counts.
 *
 * @param {Object|null} socket - Socket.io client instance from useSocket
 * @returns {Object} Topic state with messages and counts for each topic
 */
export function useKafkaMessages(socket) {
  const [topicState, setTopicState] = useState(createInitialTopicState);

  const handleKafkaMessage = useCallback((payload) => {
    const { topic, message, partition, offset, timestamp } = payload;

    if (!TOPICS.includes(topic)) {
      return;
    }

    setTopicState((prevState) => {
      const topicData = prevState[topic];
      const newMessages = [
        ...topicData.messages,
        { message, partition, offset, timestamp },
      ];

      // Keep only the most recent messages (newest at end)
      const trimmedMessages =
        newMessages.length > MAX_MESSAGES_PER_TOPIC
          ? newMessages.slice(-MAX_MESSAGES_PER_TOPIC)
          : newMessages;

      return {
        ...prevState,
        [topic]: {
          messages: trimmedMessages,
          count: topicData.count + 1,
        },
      };
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("kafka:message", handleKafkaMessage);

    return () => {
      socket.off("kafka:message", handleKafkaMessage);
    };
  }, [socket, handleKafkaMessage]);

  return topicState;
}

export { TOPICS };