import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

/**
 * Custom hook for managing Socket.io connection to the server.
 * Auto-connects on mount and cleans up on unmount.
 *
 * @returns {Object} Connection state and socket instance
 * @returns {string} connectionStatus - Current connection state: connecting, connected, disconnected, error
 * @returns {Object|null} socket - Socket.io client instance
 */
export function useSocket() {
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const socket = useMemo(() => {
    return io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
    });
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", () => {
      setConnectionStatus("error");
    });

    socket.on("reconnecting", () => {
      setConnectionStatus("connecting");
    });

    socket.on("reconnect", () => {
      setConnectionStatus("connected");
    });

    socket.on("reconnect_failed", () => {
      setConnectionStatus("error");
    });

    // Connect after event listeners are set up
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return {
    connectionStatus,
    socket,
  };
}