// backend/models/Ticket.js
import * as db from '../config/db.js';
import crypto from 'crypto';

// Find tickets by user and event
export const findByUserAndEvent = async (userId, eventId) => {
  const query = {
    text: `
      SELECT * FROM tickets
      WHERE user_id = $1 AND event_id = $2 AND status = 'purchased'
    `,
    values: [userId, eventId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding tickets:', error);
    throw error;
  }
};

// Find ticket by ID
export const findById = async (id) => {
  const query = {
    text: `
      SELECT t.*, tt.name as ticket_type_name, e.name as event_name, e.date, e.time, e.venue
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON t.event_id = e.id
      WHERE t.id = $1
    `,
    values: [id]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding ticket:', error);
    throw error;
  }
};

// Create a new ticket (reserved status initially)
export const createReserved = async (data) => {
  const { ticket_type_id, user_id, event_id, price } = data;
  
  // Calculate reservation expiration time (15 minutes from now)
  const now = new Date();
  const reservationExpires = new Date(now.getTime() + 15 * 60 * 1000);
  
  const query = {
    text: `
      INSERT INTO tickets(
        ticket_type_id, user_id, event_id, price, status, reservation_expires_at
      )
      VALUES($1, $2, $3, $4, 'reserved', $5)
      RETURNING *
    `,
    values: [ticket_type_id, user_id, event_id, price, reservationExpires]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

// Create a purchased ticket directly
export const createPurchased = async (client, data) => {
  const { ticket_type_id, user_id, event_id, price, qr_code } = data;
  
  // Use the provided client or the default connection pool
  const queryExecutor = client || db;
  
  const query = {
    text: `
      INSERT INTO tickets(
        ticket_type_id, user_id, event_id, qr_code, price, status, purchase_date
      )
      VALUES($1, $2, $3, $4, $5, 'purchased', CURRENT_TIMESTAMP)
      RETURNING *
    `,
    values: [ticket_type_id, user_id, event_id, qr_code, price]
  };
  
  try {
    const result = await queryExecutor.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating purchased ticket:', error);
    throw error;
  }
};

// Update ticket status to purchased
export const updateToPurchased = async (id, qrCode) => {
  const query = {
    text: `
      UPDATE tickets
      SET status = 'purchased', qr_code = $2, purchase_date = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    values: [id, qrCode]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket to purchased:', error);
    throw error;
  }
};

// Update ticket status to cancelled (when refunded)
export const updateToCancelled = async (id, refundStatus = 'requested') => {
  const query = {
    text: `
      UPDATE tickets
      SET status = 'cancelled',
          cancelled_at = CURRENT_TIMESTAMP,
          refund_status = $2
      WHERE id = $1
      RETURNING *
    `,
    values: [id, refundStatus]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket to cancelled:', error);
    throw error;
  }
};

// Update to capture check-in agent information
export const updateCheckinStatus = async (id, checkedIn, checkedInBy = null) => {
  const query = {
    text: `
      UPDATE tickets
      SET checked_in = $2,
          checked_in_at = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
          checked_in_by = $3
      WHERE id = $1
      RETURNING *
    `,
    values: [id, checkedIn, checkedInBy]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating check-in status:', error);
    throw error;
  }
};

// Get all tickets for a user
export const findByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue, e.image_url, e.cancellation_policy,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1
      ORDER BY e.date DESC, t.id ASC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding user tickets:', error);
    throw error;
  }
};

// Validate a ticket by QR code
export const validateQrCode = async (qrCode) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue,
             tt.name as ticket_type_name,
             u.name as user_name, u.email as user_email
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN users u ON t.user_id = u.id
      WHERE t.qr_code = $1 AND t.status = 'purchased'
    `,
    values: [qrCode]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error validating QR code:', error);
    throw error;
  }
};

// Get upcoming tickets for a user
export const findUpcomingByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue, e.image_url,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1 AND e.date >= CURRENT_DATE AND t.status = 'purchased'
      ORDER BY e.date ASC, e.time ASC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding upcoming tickets:', error);
    throw error;
  }
};

// Get past tickets for a user
export const findPastByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue, e.image_url,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1 AND e.date < CURRENT_DATE AND t.status = 'purchased'
      ORDER BY e.date DESC, e.time ASC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding past tickets:', error);
    throw error;
  }
};

// Add this function to your models/Ticket.js file

/**
 * Find all cancelled tickets for a user and organize them by event
 */
export const findCancelledByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, 
             e.date, 
             e.time, 
             e.venue, 
             e.image_url,
             e.address,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1 
      AND t.status = 'cancelled'
      ORDER BY t.cancelled_at DESC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    
    // Group tickets by event
    const ticketsByEvent = {};
    
    result.rows.forEach(ticket => {
      const eventId = ticket.event_id;
      
      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventAddress: ticket.address,
          eventImage: ticket.image_url,
          tickets: []
        };
      }
      
      ticketsByEvent[eventId].tickets.push(ticket);
    });
    
    return Object.values(ticketsByEvent);
  } catch (error) {
    console.error('Error finding cancelled tickets:', error);
    throw error;
  }
};

/**
 * Find all pending refund requests
 */
export const findPendingRefunds = async () => {
  const query = {
    text: `
      SELECT t.*, 
             u.name as user_name, 
             u.email as user_email,
             e.name as event_name, 
             e.date as event_date,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.status = 'cancelled' 
      AND (t.refund_status = 'requested' OR t.refund_status IS NULL)
      ORDER BY t.cancelled_at DESC
    `,
    values: []
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding pending refunds:', error);
    throw error;
  }
};

/**
 * Update the refund status of a ticket
 */
export const updateRefundStatus = async (id, status) => {
  const validStatuses = ['requested', 'processing', 'completed', 'failed', 'denied'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid refund status: ${status}`);
  }
  
  const query = {
    text: `
      UPDATE tickets
      SET refund_status = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    values: [id, status]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating refund status:', error);
    throw error;
  }
};

/**
 * Find all refunds with their status (for admin)
 */
export const getAllRefunds = async () => {
  const query = {
    text: `
      SELECT t.*, 
             u.name as user_name, 
             u.email as user_email,
             e.name as event_name, 
             e.date as event_date,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.status = 'cancelled' 
      ORDER BY 
        CASE
          WHEN t.refund_status = 'requested' OR t.refund_status IS NULL THEN 1
          WHEN t.refund_status = 'processing' THEN 2
          ELSE 3
        END,
        t.cancelled_at DESC
    `,
    values: []
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding all refunds:', error);
    throw error;
  }
};

/**
 * Process refunds that have been in 'processing' status for more than the specified days
 * This should be called by a scheduled job rather than using setTimeout
 */
export const processAutomaticRefundCompletion = async (daysThreshold = 5) => {
  const query = {
    text: `
      UPDATE tickets
      SET refund_status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE status = 'cancelled'
      AND refund_status = 'processing'
      AND cancelled_at < (CURRENT_TIMESTAMP - INTERVAL '${daysThreshold} days')
      RETURNING id, event_id, ticket_type_id, user_id
    `,
    values: []
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error processing automatic refund completion:', error);
    throw error;
  }
};

// Add these new functions to your Ticket.js model

// Find ticket by QR code data
export const findByQrData = async (qrData) => {
  try {
    // The qrData is expected to be a JSON string with ticketId and hash
    const data = JSON.parse(qrData);
    
    if (!data || !data.id || !data.hash) {
      throw new Error('Invalid QR code data format');
    }
    
    const query = {
      text: `
        SELECT t.*, 
              e.name as event_name, e.date, e.time, e.venue, e.address,
              tt.name as ticket_type_name,
              u.name as user_name, u.email as user_email
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.status = 'purchased'
      `,
      values: [data.id]
    };
    
    const result = await db.query(query);
    const ticket = result.rows[0];
    
    if (!ticket) {
      return null;
    }
    
    // Verify the hash to prevent forgery
    const expectedHash = generateTicketHash(ticket.id, ticket.event_id, ticket.user_id);
    if (expectedHash !== data.hash) {
      throw new Error('Invalid ticket signature');
    }
    
    return ticket;
  } catch (error) {
    console.error('Error validating ticket by QR data:', error);
    throw error;
  }
};

// Generate hash for ticket verification
export const generateTicketHash = (ticketId, eventId, userId) => {
  const secret = process.env.QR_SECRET || 'eventhub-ticket-secret';
  return crypto.createHmac('sha256', secret)
    .update(`${ticketId}-${eventId}-${userId}`)
    .digest('hex')
    .substring(0, 16); // Shorten for smaller QR code
};
