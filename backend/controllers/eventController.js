// backend/controllers/eventController.js
import * as db from '../config/db.js';
import * as Event from '../models/Event.js';
import * as TicketType from '../models/TicketType.js';
import * as Review from '../models/Review.js';

// Get single event by ID with ticket types and reviews
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch event details
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Fetch ticket types for this event
    const ticketTypes = await TicketType.findByEventId(id);
    
    // Fetch reviews for this event
    const reviews = await Review.findByEventId(id);
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }
    
    // Fetch related events (same category, future dates)
    const relatedEvents = await Event.findRelated(event.category_id, id, 4);
    
    // Construct response
    const response = {
      event,
      ticketTypes,
      reviews: {
        items: reviews,
        count: reviews.length,
        averageRating
      },
      relatedEvents
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error);
  }
};

// Add a view count to an event
export const incrementViewCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Update view count
    await Event.incrementViews(id);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    next(error);
  }
};

// Get all ticket types for an event
export const getEventTicketTypes = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if the event exists
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        error: 'Event not found' 
      });
    }
    
    // Fetch ticket types for this event
    const ticketTypes = await TicketType.findByEventId(id);
    
    res.status(200).json({
      success: true,
      data: ticketTypes
    });
  } catch (error) {
    console.error('Error fetching event ticket types:', error);
    next(error);
  }
};


// Helper to check if user has permission to modify an event
export const checkEventPermission = async (eventId, userId) => {
  try {
    // Find event
    const result = await db.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );
    
    if (result.rows.length === 0) {
      return false; // Event not found
    }
    
    const event = result.rows[0];
    
    // If creator_id matches userId, user has permission
    if (event.creator_id !== null && event.creator_id === userId) {
      return true;
    }
    
    // Check if user is admin
    const userResult = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return false; // User not found
    }
    
    const user = userResult.rows[0];
    return user.role === 'admin';
  } catch (error) {
    console.error('Error checking event permission:', error);
    return false;
  }
};

// Cancel an event
export const cancelEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    
    // Check if user has permission
    const hasPermission = await checkEventPermission(id, req.user.id);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to cancel this event' });
    }
    
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current event details
      const eventResult = await client.query('SELECT * FROM events WHERE id = $1', [id]);
      
      if (eventResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      
      const event = eventResult.rows[0];
      
      if (event.status === 'canceled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Event is already canceled' });
      }
      
      // Update event status
      await client.query(`
        UPDATE events 
        SET status = 'canceled', 
            status_change_reason = $1, 
            status_changed_at = CURRENT_TIMESTAMP,
            notification_status = 'pending'
        WHERE id = $2
      `, [cancelReason || 'Event canceled by organizer', id]);
      
      await client.query('COMMIT');
      
      // Return success response
      res.status(200).json({ 
        success: true, 
        message: 'Event canceled successfully. Refunds will be processed automatically.'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error canceling event:', error);
    next(error);
  }
};

// Reschedule an event
export const rescheduleEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, rescheduleReason } = req.body;
    
    // Validate new date and time
    if (!newDate || !newTime) {
      return res.status(400).json({ error: 'New date and time are required' });
    }
    
    // Check if user has permission
    const hasPermission = await checkEventPermission(id, req.user.id);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to reschedule this event' });
    }
    
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current event details
      const eventResult = await client.query('SELECT * FROM events WHERE id = $1', [id]);
      
      if (eventResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      
      const event = eventResult.rows[0];
      
      if (event.status === 'canceled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot reschedule a canceled event' });
      }
      
      // Update event with new date and time
      await client.query(`
        UPDATE events 
        SET date = $1, 
            time = $2, 
            original_date = COALESCE(original_date, date),
            original_time = COALESCE(original_time, time),
            status = 'rescheduled', 
            status_change_reason = $3,
            status_changed_at = CURRENT_TIMESTAMP,
            notification_status = 'pending'
        WHERE id = $4
      `, [newDate, newTime, rescheduleReason || 'Event rescheduled by organizer', id]);
      
      await client.query('COMMIT');
      
      // Return success response
      res.status(200).json({ 
        success: true, 
        message: 'Event rescheduled successfully. Attendees will be notified automatically.' 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error rescheduling event:', error);
    next(error);
  }
};

