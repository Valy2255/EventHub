// backend/models/TicketType.js
import * as db from '../config/db.js';

// Find all ticket types for an event
export const findByEventId = async (eventId) => {
  const query = {
    text: `
      SELECT * FROM ticket_types
      WHERE event_id = $1
      ORDER BY price ASC
    `,
    values: [eventId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding ticket types:', error);
    throw error;
  }
};

// Find a specific ticket type by ID
export const findById = async (id) => {
  const query = {
    text: `
      SELECT * FROM ticket_types
      WHERE id = $1
    `,
    values: [id]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding ticket type:', error);
    throw error;
  }
};

// Create a new ticket type
export const create = async (data) => {
  const { event_id, name, description, price, quantity } = data;
  
  const query = {
    text: `
      INSERT INTO ticket_types(event_id, name, description, price, quantity, available_quantity)
      VALUES($1, $2, $3, $4, $5, $5)
      RETURNING *
    `,
    values: [event_id, name, description, price, quantity]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating ticket type:', error);
    throw error;
  }
};

// Update available quantity of a ticket type
export const updateAvailability = async (client, ticketTypeId, quantityChange) => {
    // Make sure we're using integers
    const id = parseInt(ticketTypeId, 10);
    const change = parseInt(quantityChange, 10);
    
    if (isNaN(id) || isNaN(change)) {
      throw new Error(`Invalid ticket type ID (${ticketTypeId}) or quantity change (${quantityChange})`);
    }
  
    const query = `
      UPDATE ticket_types 
      SET available_quantity = available_quantity + $2
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await client.query(query, [id, change]);
    return result.rows[0];
  };