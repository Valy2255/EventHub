// backend/routes/chatRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import { 
  getActiveConversations, 
  getConversationById, 
  getConversationMessages,
  markMessagesAsRead,
  updateConversationStatus,
  getUnreadCount,
  getTotalUnreadCount
} from '../services/chatService.js';

const router = express.Router();

// Get active conversations (admin only)
router.get('/conversations', auth, admin, async (req, res) => {
  try {
    const conversations = await getActiveConversations();
    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get client's active conversations
router.get('/my-conversations', auth, async (req, res) => {
  try {
    const conversations = await getActiveConversations(req.user.id);
    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching client conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation details
router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await getConversationById(conversationId);
    
    // Check if user is authorized to view this conversation
    if (req.user.role !== 'admin' && conversation.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }
    
    res.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get conversation messages
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await getConversationById(conversationId);
    
    // Check if user is authorized to view this conversation
    if (req.user.role !== 'admin' && conversation.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }
    
    const messages = await getConversationMessages(conversationId);
    
    // Mark messages as read
    const readerType = req.user.role === 'admin' ? 'admin' : 'client';
    await markMessagesAsRead(conversationId, readerType);
    
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Close a conversation (admin only)
router.patch('/conversations/:id/close', auth, admin, async (req, res) => {
  try {
    const conversationId = req.params.id;
    await updateConversationStatus(conversationId, 'closed');
    res.json({ message: 'Conversation closed successfully' });
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ error: 'Failed to close conversation' });
  }
});

// Mark messages as read
router.post('/conversations/:id/read', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await getConversationById(conversationId);
    
    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Check if user is authorized to view this conversation
    if (req.user.role !== 'admin' && conversation.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }
    
    // Use the reader type from the request body, or determine it from user role
    const readerType = req.body.reader_type || (req.user.role === 'admin' ? 'admin' : 'client');
    
    // Mark messages as read
    await markMessagesAsRead(conversationId, readerType);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread count for a conversation
router.get('/conversations/:id/unread', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await getConversationById(conversationId);
    
    // Check if conversation exists
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Check if user is authorized to view this conversation
    if (req.user.role !== 'admin' && conversation.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }
    
    // Determine the reader type based on user role
    const readerType = req.user.role === 'admin' ? 'admin' : 'client';
    
    // Get unread count
    const count = await getUnreadCount(conversationId, readerType);
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get total unread count across all conversations
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'admin' ? 'admin' : 'client';
    
    const count = await getTotalUnreadCount(userId, userType);
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting total unread count:', error);
    res.status(500).json({ error: 'Failed to get total unread count' });
  }
});

export default router;