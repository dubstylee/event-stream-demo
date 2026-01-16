import { useEffect, useRef } from "react";

/**
 * Formats a timestamp for display in the message log.
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string (HH:MM:SS.mmm)
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

/**
 * Formats message content for display.
 * Handles both object and primitive message types.
 * @param {*} message - Message content to format
 * @returns {string} Formatted message string
 */
function formatMessage(message) {
  if (typeof message === "object" && message !== null) {
    return JSON.stringify(message);
  }
  return String(message);
}

/**
 * TopicWidget displays a Kafka topic's message count and recent messages.
 * Provides auto-scroll functionality to keep newest messages visible.
 *
 * @param {Object} props
 * @param {string} props.topicName - Name of the Kafka topic
 * @param {number} props.messageCount - Running count of messages received
 * @param {Array} props.messages - Array of message objects with timestamp and message content
 */
function TopicWidget({ topicName, messageCount, messages }) {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">{topicName}</h3>
        <span
          className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800"
          aria-label={`${messageCount} messages received`}
        >
          {messageCount}
        </span>
      </header>

      <div
        ref={scrollContainerRef}
        className="h-48 overflow-y-auto p-4"
        role="log"
        aria-label={`Message log for ${topicName}`}
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No messages received yet
          </p>
        ) : (
          <ul className="space-y-2">
            {messages.map((entry, index) => (
              <li
                key={`${entry.timestamp}-${entry.offset}-${index}`}
                className="text-sm"
              >
                <span className="mr-2 text-gray-400">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span className="font-mono text-gray-700">
                  {formatMessage(entry.message)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default TopicWidget;