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
      SELECT t.*, tt.name as ticket_type_name, e.name as event_name, e.date, e.time
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
             e.name as event_name, e.date, e.time, e.venue, e.image_url,
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