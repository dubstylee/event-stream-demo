import { useEffect } from "react";

/**
 * Toast notification component for displaying temporary success or error messages.
 * Auto-dismisses after a configured duration and supports manual dismissal.
 *
 * @param {Object} props
 * @param {string} props.message - The message to display in the toast
 * @param {"success" | "error"} props.type - The type of toast (determines styling)
 * @param {Function} props.onClose - Callback function called when toast is dismissed
 */
function Toast({ message, type, onClose }) {
  const AUTO_DISMISS_DURATION = 4000; // 4 seconds

  // Configuration for different toast types
  const typeConfig = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600",
      icon: "✓",
      ariaLabel: "Success notification",
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconBgColor: "bg-red-100",
      iconColor: "text-red-600",
      icon: "✕",
      ariaLabel: "Error notification",
    },
  };

  const config = typeConfig[type] || typeConfig.error;

  // Auto-dismiss functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, AUTO_DISMISS_DURATION);

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  /**
   * Handles manual dismissal of the toast
   */
  function handleDismiss() {
    onClose();
  }

  return (
    <div
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg animate-slide-in"
      role="alert"
      aria-live="polite"
      aria-label={config.ariaLabel}
    >
      <div className={`p-4 ${config.bgColor} ${config.borderColor} border`}>
        <div className="flex items-start">
          {/* Icon */}
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.iconBgColor}`}
          >
            <span
              className={`text-sm font-bold ${config.iconColor}`}
              aria-hidden="true"
            >
              {config.icon}
            </span>
          </div>

          {/* Message */}
          <div className="ml-3 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${config.textColor}`}>
              {message}
            </p>
          </div>

          {/* Close button */}
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-md ${config.bgColor} ${config.textColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === "success" ? "focus:ring-green-500" : "focus:ring-red-500"
              }`}
              aria-label="Dismiss notification"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Toast;
