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

// Get all refunds (including all statuses)
export const getAllRefunds = async (req, res, next) => {
  try {
    const refunds = await Ticket.getAllRefunds();
    
    // Count pending refunds (those with status 'requested' or null)
    const pendingCount = refunds.filter(
      refund => refund.refund_status === 'requested' || refund.refund_status === null
    ).length;
    
    // Process any automatic completions for tickets in 'processing' status for more than 5 days
    const autoCompletedRefunds = await Ticket.processAutomaticRefundCompletion();
    
    // If any refunds were automatically completed, refresh the list
    let finalRefunds = refunds;
    if (autoCompletedRefunds.length > 0) {
      console.log(`Automatically completed ${autoCompletedRefunds.length} refunds that were processing for more than 5 days`);
      finalRefunds = await Ticket.getAllRefunds();
    }
    
    res.status(200).json({
      success: true,
      count: pendingCount,
      total: finalRefunds.length,
      data: finalRefunds
    });
  } catch (error) {
    console.error('Error fetching all refunds:', error);
    next(error);
  }
};

// Get all events (admin)
export const getAllEvents = async (req, res, next) => {
  try {
    // Default order by most recent
    const { sort = 'newest', status, search, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT e.*, 
             c.name as category_name,
             s.name as subcategory_name,
             COUNT(t.id) as tickets_sold
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN tickets t ON e.id = t.event_id AND t.status = 'purchased'
    `;
    
    // Build where clause
    const whereConditions = [];
    const queryParams = [];
    
    if (status) {
      whereConditions.push(`e.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    
    if (search) {
      whereConditions.push(`(
        e.name ILIKE $${queryParams.length + 1} OR
        e.description ILIKE $${queryParams.length + 1} OR
        e.venue ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search}%`);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Group by event fields
    query += ` GROUP BY e.id, c.name, s.name`;
    
    // Order by
    if (sort === 'newest') {
      query += ` ORDER BY e.created_at DESC`;
    } else if (sort === 'oldest') {
      query += ` ORDER BY e.created_at ASC`;
    } else if (sort === 'name_asc') {
      query += ` ORDER BY e.name ASC`;
    } else if (sort === 'name_desc') {
      query += ` ORDER BY e.name DESC`;
    } else if (sort === 'date_asc') {
      query += ` ORDER BY e.date ASC, e.time ASC`;
    } else if (sort === 'date_desc') {
      query += ` ORDER BY e.date DESC, e.time DESC`;
    } else if (sort === 'popular') {
      query += ` ORDER BY tickets_sold DESC, e.views DESC`;
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    // Count total events for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
    `;
    
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    const [eventsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, whereConditions.length))
    ]);
    
    const totalEvents = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalEvents / limit);
    
    res.status(200).json({
      success: true,
      count: eventsResult.rows.length,
      total: totalEvents,
      pagination: {
        current: parseInt(page),
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      data: eventsResult.rows
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    next(error);
  }
};

// Get event by ID (admin)
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // Get ticket types
    const ticketTypes = await TicketType.findByEventId(id);
    
    // Get tickets sold
    const ticketsSoldQuery = {
      text: `
        SELECT COUNT(*) as tickets_sold
        FROM tickets
        WHERE event_id = $1 AND status = 'purchased'
      `,
      values: [id]
    };
    
    const ticketsSoldResult = await db.query(ticketsSoldQuery);
    const ticketsSold = parseInt(ticketsSoldResult.rows[0].tickets_sold);
    
    res.status(200).json({
      success: true,
      data: {
        event,
        ticketTypes,
        ticketsSold
      }
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error);
  }
};

// Create new event (admin)
export const createEvent = async (req, res, next) => {
  try {
    const eventData = req.body;
    
    // Validate event data
    if (!eventData.name || !eventData.date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide all required fields' 
      });
    }
    
    // Create event
    const event = await Event.create(eventData);
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    next(error);
  }
};

// Update event (admin)
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    
    // Check if event exists
    const existingEvent = await Event.findById(id);
    
    if (!existingEvent) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // Update event
    const event = await Event.update(id, eventData);
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    next(error);
  }
};

// Delete event (admin)
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if event exists
    const existingEvent = await Event.findById(id);
    
    if (!existingEvent) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // Check if tickets have been sold
    const ticketsQuery = {
      text: `
        SELECT COUNT(*) as count
        FROM tickets
        WHERE event_id = $1 AND status = 'purchased'
      `,
      values: [id]
    };
    
    const ticketsResult = await db.query(ticketsQuery);
    const ticketsSold = parseInt(ticketsResult.rows[0].count);
    
    if (ticketsSold > 0) {
      // Don't delete, just set status to cancelled
      await Event.update(id, { status: 'cancelled' });
      
      return res.status(200).json({
        success: true,
        data: { id },
        message: 'Event has been cancelled since tickets have been sold'
      });
    }
    
    // Delete event
    await Event.deleteEvent(id);
    
    res.status(200).json({
      success: true,
      data: { id },
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    next(error);
  }
};