/**
 * ConnectionStatus displays the current Socket.io connection state
 * with a color-coded indicator and status text.
 *
 * @param {Object} props
 * @param {string} props.connectionStatus - One of: connecting, connected, disconnected, error
 */
function ConnectionStatus({ connectionStatus }) {
  const statusConfig = {
    connected: {
      color: "bg-green-500",
      text: "Connected",
      ariaLabel: "Connection status: Connected",
    },
    connecting: {
      color: "bg-yellow-500",
      text: "Connecting...",
      ariaLabel: "Connection status: Connecting",
    },
    disconnected: {
      color: "bg-red-500",
      text: "Disconnected",
      ariaLabel: "Connection status: Disconnected",
    },
    error: {
      color: "bg-red-500",
      text: "Connection Error",
      ariaLabel: "Connection status: Error",
    },
  };

  const config = statusConfig[connectionStatus] || statusConfig.disconnected;

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={config.ariaLabel}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full ${config.color}`}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-gray-700">{config.text}</span>
    </div>
  );
}

export default ConnectionStatus;