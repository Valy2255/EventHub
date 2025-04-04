// backend/controllers/adminController.js
import * as User from '../models/User.js';
import * as db from '../config/db.js';
import * as Ticket from '../models/Ticket.js';

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const query = {
      text: 'SELECT id, name, email, role, profile_image, created_at FROM users ORDER BY created_at DESC'
    };
    
    const result = await db.query(query);
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (admin only)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin"' });
    }
    
    const query = {
      text: 'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      values: [role, req.params.id]
    };
    
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    // Don't allow deleting your own account
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    
    const query = {
      text: 'DELETE FROM users WHERE id = $1 RETURNING id',
      values: [req.params.id]
    };
    
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Dashboard stats (admin only)
export const getDashboardStats = async (req, res, next) => {
  try {
    // Total number of users
    const usersQuery = {
      text: 'SELECT COUNT(*) FROM users'
    };
    
    // Total number of events
    const eventsQuery = {
      text: 'SELECT COUNT(*) FROM events'
    };
    
    // Total number of tickets sold
    const ticketsQuery = {
      text: "SELECT COUNT(*) FROM tickets WHERE status = 'purchased'"
    };
    
    // Number of categories
    const categoriesQuery = {
      text: 'SELECT COUNT(*) FROM categories'
    };
    
    const [usersResult, eventsResult, ticketsResult, categoriesResult] = await Promise.all([
      db.query(usersQuery),
      db.query(eventsQuery),
      db.query(ticketsQuery),
      db.query(categoriesQuery)
    ]);
    
    res.json({
      stats: {
        users: parseInt(usersResult.rows[0].count),
        events: parseInt(eventsResult.rows[0].count),
        tickets: parseInt(ticketsResult.rows[0].count),
        categories: parseInt(categoriesResult.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all pending refund requests
export const getPendingRefunds = async (req, res, next) => {
  try {
    const refunds = await Ticket.findPendingRefunds();
    
    res.status(200).json({
      success: true,
      count: refunds.length,
      data: refunds
    });
  } catch (error) {
    console.error('Error fetching pending refunds:', error);
    next(error);
  }
};

// Approve a refund request
export const approveRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['processing', 'completed', 'failed', 'denied'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status. Status must be one of: processing, completed, failed, denied' 
      });
    }
    
    const ticket = await Ticket.updateRefundStatus(id, status);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: ticket,
      message: `Refund status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating refund status:', error);
    next(error);
  }
};