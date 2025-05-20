// services/chatService.js - Updated with improved logging and validation
import { pool } from "../config/db.js";

/**
 * Create a new conversation
 * @param {number} clientId - The user ID of the client
 * @returns {Promise<number>} - The ID of the created conversation
 */
export const createConversation = async (clientId) => {
  try {
    const result = await pool.query(
      "INSERT INTO chat_conversations (client_id, status) VALUES ($1, $2) RETURNING id",
      [clientId, "active"]
    );

    console.log(
      `Created new conversation with ID ${result.rows[0].id} for client ${clientId}`
    );
    return result.rows[0].id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Save a new message
 * @param {Object} messageData - The message data
 * @param {number} messageData.conversationId - The conversation ID
 * @param {number} messageData.senderId - The sender's user ID
 * @param {string} messageData.senderType - The type of sender ('admin' or 'client')
 * @param {string} messageData.content - The message content
 * @returns {Promise<Object>} - The saved message
 */
export const saveMessage = async ({ conversationId, senderId, senderType, content }) => {
  try {
    // Messages are automatically read by the sender, but not by the recipient
    const adminRead = senderType === 'admin';
    const clientRead = senderType === 'client';
    
    // Insert the message
    const messageResult = await global.pool.query(`
      INSERT INTO public.chat_messages 
        (conversation_id, sender_id, sender_type, message, read, admin_read, client_read, created_at) 
      VALUES 
        ($1, $2, $3, $4, false, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `, [conversationId, senderId, senderType, content, adminRead, clientRead]);
    
    // Update the conversation timestamp
    await global.pool.query(
      'UPDATE public.chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );
    
    return messageResult.rows[0];
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 * @param {number} conversationId - The conversation ID
 * @returns {Promise<Array>} - The conversation messages
 */
export const getConversationMessages = async (conversationId) => {
  try {
    const query = `
      SELECT 
        id, conversation_id, sender_id, sender_type, message, 
        read, admin_read, client_read, created_at
      FROM public.chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `;

    const result = await global.pool.query(query, [conversationId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

/**
 * Update conversation status
 * @param {number} conversationId - The conversation ID
 * @param {string} status - The new status ('active' or 'closed')
 */
export const updateConversationStatus = async (conversationId, status) => {
  try {
    const closedAt = status === "closed" ? "CURRENT_TIMESTAMP" : null;

    await pool.query(
      `UPDATE chat_conversations 
       SET status = $1, updated_at = CURRENT_TIMESTAMP${
         status === "closed" ? ", closed_at = CURRENT_TIMESTAMP" : ""
       }
       WHERE id = $2`,
      [status, conversationId]
    );

    console.log(`Updated conversation ${conversationId} status to ${status}`);
  } catch (error) {
    console.error("Error updating conversation status:", error);
    throw error;
  }
};

/**
 * Get active conversations
 * @param {number} [clientId] - Optional client ID to filter by
 * @returns {Promise<Array>} - The active conversations
 */
export const getActiveConversations = async (clientId = null) => {
  try {
    let query;
    let params = [];

    if (clientId) {
      // Get conversations for a specific client
      query = `
        SELECT 
          c.id, c.client_id, c.status, c.created_at, c.updated_at,
          u.name as client_name, u.email as client_email,
          (SELECT COUNT(*) FROM public.chat_messages WHERE conversation_id = c.id AND sender_type = 'admin' AND client_read = false) as unread_count,
          (SELECT message FROM public.chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM public.chat_conversations c
        JOIN users u ON c.client_id = u.id
        WHERE c.client_id = $1 AND c.status = 'active'
        ORDER BY c.updated_at DESC
      `;
      params = [clientId];
    } else {
      // Get all active conversations (for admin)
      query = `
        SELECT 
          c.id, c.client_id, c.status, c.created_at, c.updated_at,
          u.name as client_name, u.email as client_email,
          (SELECT COUNT(*) FROM public.chat_messages WHERE conversation_id = c.id AND sender_type = 'client' AND admin_read = false) as unread_count,
          (SELECT message FROM public.chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM public.chat_conversations c
        JOIN users u ON c.client_id = u.id
        WHERE c.status = 'active'
        ORDER BY c.updated_at DESC
      `;
    }

    const result = await global.pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

/**
 * Get conversation by ID
 * @param {number} conversationId - The conversation ID
 * @returns {Promise<Object>} - The conversation details
 */
export const getConversationById = async (conversationId) => {
  try {
    const result = await pool.query(
      `SELECT cc.id, cc.client_id, cc.status, cc.created_at, cc.updated_at, cc.closed_at,
              u.name as client_name, u.email as client_email
       FROM chat_conversations cc
       JOIN users u ON cc.client_id = u.id
       WHERE cc.id = $1`,
      [conversationId]
    );

    if (result.rows.length === 0) {
      console.log(`Conversation ${conversationId} not found`);
      throw new Error("Conversation not found");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw error;
  }
};

// Add these functions to your chatService.js file

/**
 * Mark messages as read for a specific conversation and reader type
 * @param {number} conversationId - The ID of the conversation
 * @param {string} readerType - Either 'admin' or 'client'
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const markMessagesAsRead = async (conversationId, readerType) => {
  if (!conversationId || !readerType) {
    throw new Error("Missing required parameters");
  }

  if (readerType !== "admin" && readerType !== "client") {
    throw new Error("Invalid reader type");
  }

  // Determine which field to update based on reader type
  const readField = readerType === "admin" ? "admin_read" : "client_read";

  // Update the read status for messages in this conversation
  // Only update messages not sent by the reader (no need to mark your own messages as read)
  const query = `
    UPDATE public.chat_messages
    SET ${readField} = true, 
        read = CASE 
                WHEN sender_type = $2 THEN read
                ELSE true 
              END
    WHERE conversation_id = $1 
    AND ${readField} = false
    AND sender_type != $2
    RETURNING id
  `;

  try {
    const result = await global.pool.query(query, [conversationId, readerType]);
    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

/**
 * Get the count of unread messages for a conversation and reader type
 * @param {number} conversationId - The ID of the conversation
 * @param {string} readerType - Either 'admin' or 'client'
 * @returns {Promise<number>} - Returns the count of unread messages
 */
export const getUnreadCount = async (conversationId, readerType) => {
  if (!conversationId || !readerType) {
    throw new Error("Missing required parameters");
  }

  if (readerType !== "admin" && readerType !== "client") {
    throw new Error("Invalid reader type");
  }

  // Determine which field to check based on reader type
  const readField = readerType === "admin" ? "admin_read" : "client_read";

  // Count unread messages - only count messages sent by the other party
  const senderType = readerType === "admin" ? "client" : "admin";

  const query = `
    SELECT COUNT(*) as unread_count
    FROM public.chat_messages
    WHERE conversation_id = $1 
    AND ${readField} = false
    AND sender_type = $2
  `;

  try {
    const result = await global.pool.query(query, [conversationId, senderType]);
    return parseInt(result.rows[0].unread_count, 10);
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

/**
 * Get total unread message count across all conversations for a user
 * @param {number} userId - The ID of the user
 * @param {string} userType - Either 'admin' or 'client'
 * @returns {Promise<number>} - Returns the total count of unread messages
 */
export const getTotalUnreadCount = async (userId, userType) => {
  if (!userId || !userType) {
    throw new Error("Missing required parameters");
  }

  if (userType !== "admin" && userType !== "client") {
    throw new Error("Invalid user type");
  }

  // For admin, get count of all messages from clients across all conversations that admin hasn't read
  // For client, get count of admin messages in their conversations they haven't read
  const readField = userType === "admin" ? "admin_read" : "client_read";
  const senderType = userType === "admin" ? "client" : "admin";

  let query;
  let params;

  if (userType === "admin") {
    // Admin needs to see unread messages in all conversations
    query = `
      SELECT COUNT(*) as unread_count
      FROM public.chat_messages m
      JOIN public.chat_conversations c ON m.conversation_id = c.id
      WHERE m.${readField} = false
      AND m.sender_type = $1
      AND c.status = 'active'
    `;
    params = [senderType];
  } else {
    // Client only sees their conversations
    query = `
      SELECT COUNT(*) as unread_count
      FROM public.chat_messages m
      JOIN public.chat_conversations c ON m.conversation_id = c.id
      WHERE m.${readField} = false
      AND m.sender_type = $1
      AND c.client_id = $2
      AND c.status = 'active'
    `;
    params = [senderType, userId];
  }

  try {
    const result = await global.pool.query(query, params);
    return parseInt(result.rows[0].unread_count, 10);
  } catch (error) {
    console.error("Error getting total unread count:", error);
    throw error;
  }
};
