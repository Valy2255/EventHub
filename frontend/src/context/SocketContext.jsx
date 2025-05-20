// src/context/SocketContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

// Create the context
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  // Remove unused state variable and only use ref
  const [connected, setConnected] = useState(false);
  const socketRef = useRef();

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;

    // Get token from storage
    let token = sessionStorage.getItem("token");
    if (!token && localStorage.getItem("authType") === "persistent") {
      token = localStorage.getItem("token");
    }

    if (!token) return;

    // Only create a new socket if one doesn't exist
    if (socketRef.current && socketRef.current.connected) {
      console.log("Socket already connected, reusing connection");
      setConnected(true);
      return;
    }

    // Create socket connection - use specific socket URL if available
    const API_URL =
      import.meta.env.VITE_SOCKET_API_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";

    console.log("Connecting to Socket.IO at:", API_URL);

    const newSocket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket"], // Force WebSocket - remove polling fallback
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    // Set up event listeners
    newSocket.on("connect", () => {
      console.log("Socket connected successfully with ID:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      console.error("Error message:", err.message);
      setConnected(false);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    // Track reconnection
    newSocket.io.on("reconnect", (attempt) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
      setConnected(true);
    });

    // Save socket reference
    socketRef.current = newSocket;

    // Cleanup only on unmount of the entire app
    return () => {
      console.log("App unmounting, disconnecting socket");
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Helper to emit socket events
  const emitEvent = useCallback(
    (event, data) => {
      if (!socketRef.current || !connected) {
        console.error(`Cannot emit ${event}: not connected`);
        return false;
      }

      socketRef.current.emit(event, data);
      return true;
    },
    [connected]
  );

  // Helper to add socket event listeners
  const onEvent = useCallback((event, callback) => {
    if (!socketRef.current) {
      console.error(`Cannot listen for ${event}: socket not initialized`);
      return () => {};
    }

    socketRef.current.on(event, callback);

    // Return a function to remove the event listener
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        emitEvent,
        onEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
