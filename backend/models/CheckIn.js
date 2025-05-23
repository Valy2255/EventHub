// backend/models/CheckIn.js
import * as db from '../config/db.js';

/**
 * Find ticket by ID with all related information (same as original)
 */
export const findTicketById = async (ticketId) => {
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
      WHERE t.id = $1 AND t.status = 'purchased'
    `,
    values: [ticketId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

/**
 * Update ticket check-in status
 */
export const updateCheckInStatus = async (ticketId) => {
  const query = {
    text: `
      UPDATE tickets
      SET checked_in = true,
          checked_in_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    values: [ticketId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

/**
 * Get event by ID
 */
export const findEventById = async (eventId) => {
  const query = {
    text: `SELECT * FROM events WHERE id = $1`,
    values: [eventId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

/**
 * Get check-in statistics for an event
 */
export const getEventStats = async (eventId) => {
  const query = {
    text: `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'purchased' THEN 1 ELSE 0 END) as valid_tickets,
        SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as checked_in_count
      FROM tickets
      WHERE event_id = $1
    `,
    values: [eventId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

/**
 * Get recent check-ins for an event
 */
export const getRecentCheckIns = async (eventId) => {
  const query = {
    text: `
      SELECT t.id, t.checked_in_at, 
             tt.name as ticket_type,
             u.name as user_name
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN users u ON t.user_id = u.id
      WHERE t.event_id = $1 AND t.checked_in = true
      ORDER BY t.checked_in_at DESC
      LIMIT 10
    `,
    values: [eventId]
  };
  
  const result = await db.query(query);
  return result.rows;
};