// backend/models/Event.js
import * as db from '../config/db.js';

// Find event by ID with detailed information
export const findById = async (id) => {
  const query = {
    text: `
      SELECT e.*, 
             c.name as category_name, c.slug as category_slug,
             s.name as subcategory_name, s.slug as subcategory_slug,
             u.name as organizer_name
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1 AND e.status = 'active'
    `,
    values: [id]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding event:', error);
    throw error;
  }
};

// Find related events (same category, future dates)
export const findRelated = async (categoryId, currentEventId, limit = 4) => {
  const query = {
    text: `
      SELECT e.*, c.name as category_name, c.slug as category_slug
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.category_id = $1 
        AND e.id != $2 
        AND e.date >= CURRENT_DATE
        AND e.status = 'active'
      ORDER BY e.date ASC
      LIMIT $3
    `,
    values: [categoryId, currentEventId, limit]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding related events:', error);
    throw error;
  }
};

// Increment view count for an event
export const incrementViews = async (id) => {
  // First, check if the views column exists, if not - add it
  try {
    // Check if column exists
    const checkColumnQuery = {
      text: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'views'
      `
    };
    
    const columnCheck = await db.query(checkColumnQuery);
    
    // If column doesn't exist, add it
    if (columnCheck.rows.length === 0) {
      const addColumnQuery = {
        text: `ALTER TABLE events ADD COLUMN views INTEGER DEFAULT 0`
      };
      await db.query(addColumnQuery);
    }
    
    // Now increment the view count
    const query = {
      text: `
        UPDATE events 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = $1
        RETURNING id
      `,
      values: [id]
    };
    
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error incrementing views:', error);
    throw error;
  }
};