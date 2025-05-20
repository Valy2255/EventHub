// socket/socketHandlers.js
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

export const setupSocketHandlers = (io) => {
  // Middleware for JWT authentication - using same approach as your passport config
  io.use(async (socket, next) => {
    try {
      // Get token from socket handshake auth
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("No token provided in socket handshake");
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        // Verify token with same secret from config
        const decoded = jwt.verify(token, config.jwt.secret);

        // Match the payload structure from your jwtGenerator.js
        if (!decoded.user || !decoded.user.id) {
          console.log("Invalid token payload structure");
          return next(new Error("Authentication error: Invalid token payload"));
        }

        // Find user by ID - same as in your passport.js
        const user = await User.findById(decoded.user.id);

        if (!user) {
          console.log("User not found with ID:", decoded.user.id);
          return next(new Error("Authentication error: User not found"));
        }

        // Store user in socket for later use
        socket.user = user;
        console.log(
          `Socket authenticated for user: ${user.id}, role: ${user.role}`
        );
        next();
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return next(new Error("Authentication error: Invalid token"));
      }
    } catch (error) {
      console.error("Socket authentication error:", error);
      return next(
        new Error("Authentication error: " + (error.message || "Unknown error"))
      );
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.id}, user ID: ${socket.user.id}, role: ${socket.user.role}`
    );

    // Handle user connection
    if (socket.user.role === "admin") {
      onlineAdmins.set(socket.id, socket.user.id);
      socket.join("admins");

      // Notify admins about online status
      io.to("admins").emit("admin_status_update", {
        onlineAdminsCount: onlineAdmins.size,
      });
    } else {
      // Add regular user to online users
      onlineUsers.set(socket.user.id, socket.id);
    }

    // Handle joining a conversation
    socket.on("join_conversation", async (conversationId) => {
      try {
        // Remove user from any previous conversation rooms
        const userRooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id && room.startsWith("conversation:")
        );

        for (const room of userRooms) {
          socket.leave(room);
        }

        // Join the new conversation room
        socket.join(`conversation:${conversationId}`);

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

    // Handle starting a new conversation (client side)
    socket.on("start_conversation", async (initialMessage) => {
      try {
        if (socket.user.role === "admin") {
          socket.emit("error", {
            message: "Admins cannot start conversations",
          });
          return;
        }

        // Create new conversation in database
        const conversationId = await createConversation(socket.user.id);

        // Join the conversation room
        socket.join(`conversation:${conversationId}`);

        // Save initial message
        const message = await saveMessage({
          conversationId,
          senderId: socket.user.id,
          senderType: "client", // Only clients can start conversations
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
        io.to("admins").emit("new_conversation", {
          conversationId,
          clientId: socket.user.id,
          clientName: socket.user.name,
          initialMessage,
        });
      } catch (error) {
        console.error("Error starting conversation:", error);
        socket.emit("error", { message: "Failed to start conversation" });
      }
    });

    // Handle sending messages
    // In socketHandlers.js - add acknowledgment functionality to the send_message handler
    // Modify your send_message handler
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

        // Important: Include tempId in the message object for client-side matching
        const messageWithTempId = { ...message, tempId };

        // Broadcast to all clients in conversation immediately
        io.to(`conversation:${conversationId}`).emit(
          "new_message",
          messageWithTempId
        );

        // Also send direct confirmation to sender
        socket.emit("message_sent", { tempId, message: messageWithTempId });

        // If message is from client and no admin is assigned, notify all admins
        const conversation = activeConversations.get(conversationId);
        if (
          senderType === "client" &&
          (!conversation || !conversation.adminId)
        ) {
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
        // Only admins can close conversations
        if (socket.user.role !== "admin") {
          socket.emit("error", {
            message: "Only admins can close conversations",
          });
          return;
        }

        // Update conversation status in database
        await updateConversationStatus(conversationId, "closed");

        // Remove from active conversations
        activeConversations.delete(conversationId);

        // Notify all users in the conversation
        io.to(`conversation:${conversationId}`).emit("conversation_closed", {
          conversationId,
        });

        // Update admins about active conversations count
        io.to("admins").emit("active_conversations_update", {
          count: activeConversations.size,
        });
      } catch (error) {
        console.error("Error closing conversation:", error);
        socket.emit("error", { message: "Failed to close conversation" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      if (socket.user.role === "admin") {
        onlineAdmins.delete(socket.id);

        // Notify admins about updated online count
        io.to("admins").emit("admin_status_update", {
          onlineAdminsCount: onlineAdmins.size,
        });
      } else {
        onlineUsers.delete(socket.user.id);
      }
    });
  });
};
