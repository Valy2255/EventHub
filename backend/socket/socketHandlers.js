// socket/socketHandlers.js - Fixed typing and seen features + Online Presence
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import * as User from "../models/User.js";
import {
  saveMessage,
  getConversationMessages,
  createConversation,
  updateConversationStatus,
  markMessagesAsRead,
} from "../services/chatService.js";

// Map to store online users and conversations
const onlineUsers = new Map();
const onlineAdmins = new Map();
const activeConversations = new Map();
const onlineClients = new Map(); // NEW: Track which clients are online per conversation

export const setupSocketHandlers = (io) => {
  // Middleware for JWT authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("No token provided in socket handshake");
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret);

        if (!decoded.user || !decoded.user.id) {
          console.log("Invalid token payload structure");
          return next(new Error("Authentication error: Invalid token payload"));
        }

        const user = await User.findById(decoded.user.id);

        if (!user) {
          console.log("User not found with ID:", decoded.user.id);
          return next(new Error("Authentication error: User not found"));
        }

        socket.user = user;
        console.log(`Socket authenticated for user: ${user.id}, role: ${user.role}`);
        next();
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return next(new Error("Authentication error: Invalid token"));
      }
    } catch (error) {
      console.error("Socket authentication error:", error);
      return next(new Error("Authentication error: " + (error.message || "Unknown error")));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}, user ID: ${socket.user.id}, role: ${socket.user.role}`);

    // Handle user connection
    if (socket.user.role === "admin") {
      onlineAdmins.set(socket.id, socket.user.id);
      socket.join("admins");

      // Notify admins about online status
      io.to("admins").emit("admin_status_update", {
        onlineAdminsCount: onlineAdmins.size,
      });
    } else {
      onlineUsers.set(socket.user.id, socket.id);
    }

    // Handle joining a conversation
    socket.on("join_conversation", async (conversationId) => {
      try {
        // Remove user from any previous conversation rooms
        const userRooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id && room.startsWith("conversation:")
        );

        // NEW: Emit client_offline for previous conversations
        if (socket.user.role !== "admin") {
          for (const room of userRooms) {
            const prevConversationId = room.split(":")[1];
            onlineClients.delete(`${prevConversationId}:${socket.user.id}`);
            io.to("admins").emit("client_offline", { 
              conversationId: prevConversationId 
            });
          }
        }

        for (const room of userRooms) {
          socket.leave(room);
        }

        // Join the new conversation room
        socket.join(`conversation:${conversationId}`);

        // NEW: Track client online status and emit to admins
        if (socket.user.role !== "admin") {
          onlineClients.set(`${conversationId}:${socket.user.id}`, true);
          io.to("admins").emit("client_online", { 
            conversationId 
          });
        }

        // If admin is joining, update active conversations map
        if (socket.user.role === "admin") {
          const conversation = activeConversations.get(conversationId) || {};
          activeConversations.set(conversationId, {
            ...conversation,
            adminId: socket.user.id,
          });

          // Notify client that admin has joined
          io.to(`conversation:${conversationId}`).emit("admin_joined", {
            adminId: socket.user.id,
            adminName: socket.user.name,
            admin_profile_image: socket.user.profile_image || null,
          });
        }

        // Get conversation history
        const messages = await getConversationMessages(conversationId);
        socket.emit("conversation_history", { conversationId, messages });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Auto-subscribe for admins (without leaving other rooms)
    socket.on("auto_subscribe", (conversationId) => {
      try {
        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        console.error("Error auto-subscribing to conversation:", err);
      }
    });

    // Handle starting a new conversation (client side)
    socket.on("start_conversation", async (initialMessage) => {
      try {
        if (socket.user.role === "admin") {
          socket.emit("error", { message: "Admins cannot start conversations" });
          return;
        }

        // Create new conversation in database
        const conversationId = await createConversation(socket.user.id);

        // Join the conversation room
        socket.join(`conversation:${conversationId}`);

        // NEW: Mark client as online for this conversation
        onlineClients.set(`${conversationId}:${socket.user.id}`, true);
        io.to("admins").emit("client_online", { 
          conversationId 
        });

        // Save initial message
        const message = await saveMessage({
          conversationId,
          senderId: socket.user.id,
          senderType: "client",
          content: initialMessage,
        });

        // Update active conversations
        activeConversations.set(conversationId, {
          clientId: socket.user.id,
          adminId: null,
        });

        // Notify client of successful conversation creation
        socket.emit("conversation_started", {
          conversationId,
          message,
        });

        // Notify all admins about new conversation
        io.to("admins").emit("conversation_started", {
          conversationId,
          message,
          client_name: socket.user.name,
          client_email: socket.user.email,
          client_profile_image: socket.user.profile_image || null,
        });
      } catch (error) {
        console.error("Error starting conversation:", error);
        socket.emit("error", { message: "Failed to start conversation" });
      }
    });

    // NEW: Handle explicit client online/offline events
    socket.on("client_online", ({ conversationId }) => {
      if (socket.user.role !== "admin") {
        onlineClients.set(`${conversationId}:${socket.user.id}`, true);
        io.to("admins").emit("client_online", { conversationId });
      }
    });

    socket.on("client_offline", ({ conversationId }) => {
      if (socket.user.role !== "admin") {
        onlineClients.delete(`${conversationId}:${socket.user.id}`);
        io.to("admins").emit("client_offline", { conversationId });
      }
    });

    // Handle sending messages
    socket.on("send_message", async ({ conversationId, content, tempId }) => {
      try {
        const senderType = socket.user.role === "admin" ? "admin" : "client";

        // Save message to database
        const message = await saveMessage({
          conversationId,
          senderId: socket.user.id,
          senderType,
          content,
        });

        // Include tempId for client-side matching
        const messageWithTempId = { ...message, tempId };

        // Broadcast to all clients in conversation
        io.to(`conversation:${conversationId}`).emit("new_message", messageWithTempId);

        // Send confirmation to sender
        socket.emit("message_sent", { tempId, message: messageWithTempId });

        // If message is from client and no admin is assigned, notify all admins
        const conversation = activeConversations.get(conversationId);
        if (senderType === "client" && (!conversation || !conversation.adminId)) {
          io.to("admins").emit("unassigned_message", {
            conversationId,
            clientId: socket.user.id,
            clientName: socket.user.name,
            message: messageWithTempId,
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_failed", {
          tempId,
          error: "Failed to send message",
        });
      }
    });

    // Handle closing conversation
    socket.on("close_conversation", async (conversationId) => {
      try {
        if (socket.user.role !== "admin") {
          socket.emit("error", { message: "Only admins can close conversations" });
          return;
        }

        await updateConversationStatus(conversationId, "closed");
        activeConversations.delete(conversationId);

        // NEW: Clean up client online status for this conversation
        const clientKeysToDelete = [];
        for (const [key] of onlineClients) {
          if (key.startsWith(`${conversationId}:`)) {
            clientKeysToDelete.push(key);
          }
        }
        clientKeysToDelete.forEach(key => onlineClients.delete(key));

        io.to(`conversation:${conversationId}`).emit("conversation_closed", {
          conversationId,
        });

        io.to("admins").emit("active_conversations_update", {
          count: activeConversations.size,
        });
      } catch (error) {
        console.error("Error closing conversation:", error);
        socket.emit("error", { message: "Failed to close conversation" });
      }
    });

    // FIXED: Typing indicator events
    socket.on("typing", ({ conversationId }) => {
      const senderType = socket.user.role === "admin" ? "admin" : "client";
      
      // Broadcast to others in the conversation (excluding sender)
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        senderType, // Changed from senderId to senderType
        senderId: socket.user.id,
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      const senderType = socket.user.role === "admin" ? "admin" : "client";
      
      // Broadcast to others in the conversation (excluding sender)
      socket.to(`conversation:${conversationId}`).emit("stop_typing", {
        conversationId,
        senderType, // Changed from senderId to senderType
        senderId: socket.user.id,
      });
    });

    // FIXED: Read receipt events
    socket.on("read_messages", async ({ conversationId, readerType }) => {
      try {
        // Mark messages as read in database
        await markMessagesAsRead(conversationId, readerType);
        
        // Notify others in the conversation that messages were read
        socket.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,
          readerType,
        });
        
      } catch (err) {
        console.error("Error marking messages as read:", err);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      if (socket.user.role === "admin") {
        onlineAdmins.delete(socket.id);
        io.to("admins").emit("admin_status_update", {
          onlineAdminsCount: onlineAdmins.size,
        });
      } else {
        onlineUsers.delete(socket.user.id);
        
        // NEW: Clean up client online status and notify admins
        const clientKeysToDelete = [];
        const conversationsToNotify = new Set();
        
        for (const [key] of onlineClients) {
          if (key.endsWith(`:${socket.user.id}`)) {
            const conversationId = key.split(':')[0];
            conversationsToNotify.add(conversationId);
            clientKeysToDelete.push(key);
          }
        }
        
        clientKeysToDelete.forEach(key => onlineClients.delete(key));
        
        // Notify admins that this client went offline for each conversation
        conversationsToNotify.forEach(conversationId => {
          io.to("admins").emit("client_offline", { conversationId });
        });
      }
    });
  });
};