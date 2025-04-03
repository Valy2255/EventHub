// backend/models/Ticket.js
import * as db from '../config/db.js';

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
export const updateToCancelled = async (id) => {
  const query = {
    text: `
      UPDATE tickets
      SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    values: [id]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket to cancelled:', error);
    throw error;
  }
};

// Update ticket check-in status
export const updateCheckinStatus = async (id, isCheckedIn) => {
  const query = {
    text: `
      UPDATE tickets
      SET checked_in = $2, checked_in_at = $3
      WHERE id = $1
      RETURNING *
    `,
    values: [id, isCheckedIn, isCheckedIn ? new Date() : null]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket check-in status:', error);
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