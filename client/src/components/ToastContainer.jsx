import { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast";

/**
 * Context for toast notifications
 */
const ToastContext = createContext(null);

/**
 * Hook to access toast functions
 * @returns {Object} Toast management functions
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * ToastProvider manages multiple toast notifications.
 * Provides a simple API for showing success and error toasts.
 * Toasts are displayed in the top-right corner of the screen.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Shows a success toast notification
   * @param {string} message - The success message to display
   */
  const showSuccess = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type: "success" }]);
  }, []);

  /**
   * Shows an error toast notification
   * @param {string} message - The error message to display
   */
  const showError = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type: "error" }]);
  }, []);

  /**
   * Removes a toast notification by ID
   * @param {number} id - The ID of the toast to remove
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div
        className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-start gap-4 p-4 sm:p-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
