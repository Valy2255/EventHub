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

// Update available quantity
export const updateAvailability = async (ticketTypeId, quantityChange) => {
  // Ensure parameters are valid numbers
  const typeId = parseInt(ticketTypeId, 10);
  const change = parseInt(quantityChange, 10);
  
  if (isNaN(typeId) || isNaN(change)) {
    throw new Error(`Invalid ticket type ID (${ticketTypeId}) or quantity change (${quantityChange})`);
  }
  
  try {
    // First, get the current ticket type to validate
    const ticketType = await findById(typeId);
    
    if (!ticketType) {
      throw new Error(`Ticket type with ID ${typeId} not found`);
    }
    
    // Calculate new available quantity
    const newAvailability = ticketType.available_quantity + change;
    
    // Ensure we don't exceed the total quantity
    if (newAvailability > ticketType.quantity) {
      throw new Error(`Cannot have more available tickets (${newAvailability}) than total tickets (${ticketType.quantity})`);
    }
    
    // Ensure we don't go below zero
    if (newAvailability < 0) {
      throw new Error(`Available quantity cannot be negative (${newAvailability})`);
    }
    
    // Update the available quantity
    const query = {
      text: `
        UPDATE ticket_types
        SET available_quantity = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      values: [typeId, newAvailability]
    };
    
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket type availability:', error);
    throw error;
  }
};

// Decrease available quantity when tickets are reserved
export const decreaseAvailability = async (ticketTypeId, quantity) => {
  return updateAvailability(ticketTypeId, -Math.abs(quantity));
};

// Increase available quantity when tickets are cancelled
export const increaseAvailability = async (ticketTypeId, quantity) => {
  return updateAvailability(ticketTypeId, Math.abs(quantity));
};



