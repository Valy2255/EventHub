// models/faqModel.js
import * as db from '../config/db.js';

/**
 * Get all active FAQs
 * @returns {Promise<Array>} Array of FAQ objects
 */
export const getAllFAQs = async () => {
  try {
    const result = await db.query(
      'SELECT id, question, answer, display_order FROM faqs WHERE is_active = true ORDER BY display_order ASC',
      []
    );
    return result.rows;
  } catch (error) {
    throw new Error(`Error fetching FAQs: ${error.message}`);
  }
};

/**
 * Get a single FAQ by ID
 * @param {number} id - FAQ ID
 * @returns {Promise<Object>} FAQ object
 */
export const getFAQById = async (id) => {
  try {
    const result = await db.query(
      'SELECT id, question, answer, display_order FROM faqs WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching FAQ: ${error.message}`);
  }
};

/**
 * Create a new FAQ
 * @param {Object} faqData - FAQ data object
 * @returns {Promise<Object>} Created FAQ object
 */
export const createFAQ = async (faqData) => {
  const { question, answer, display_order = 0 } = faqData;
  
  try {
    const result = await db.query(
      `INSERT INTO faqs (question, answer, display_order) 
       VALUES ($1, $2, $3) 
       RETURNING id, question, answer, display_order`,
      [question, answer, display_order]
    );
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating FAQ: ${error.message}`);
  }
};

/**
 * Update an existing FAQ
 * @param {number} id - FAQ ID
 * @param {Object} faqData - Updated FAQ data
 * @returns {Promise<Object>} Updated FAQ object
 */
export const updateFAQ = async (id, faqData) => {
  const { question, answer, display_order, is_active } = faqData;
  
  try {
    // Build the query dynamically based on provided fields
    let query = 'UPDATE faqs SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;
    
    if (question !== undefined) {
      query += `, question = $${paramCount}`;
      values.push(question);
      paramCount++;
    }
    
    if (answer !== undefined) {
      query += `, answer = $${paramCount}`;
      values.push(answer);
      paramCount++;
    }
    
    if (display_order !== undefined) {
      query += `, display_order = $${paramCount}`;
      values.push(display_order);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      query += `, is_active = $${paramCount}`;
      values.push(is_active);
      paramCount++;
    }
    
    query += ` WHERE id = $${paramCount} RETURNING id, question, answer, display_order, is_active`;
    values.push(id);
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating FAQ: ${error.message}`);
  }
};

/**
 * Delete a FAQ by ID
 * @param {number} id - FAQ ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteFAQ = async (id) => {
  try {
    const result = await db.query(
      'DELETE FROM faqs WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    throw new Error(`Error deleting FAQ: ${error.message}`);
  }
};

export const updateOrder = async (orderData) => {
    try {
      // Start transaction
      await db.query('BEGIN', []);
      
      for (const item of orderData) {
        await db.query(
          'UPDATE faqs SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.display_order, item.id]
        );
      }
      
      // Commit transaction
      await db.query('COMMIT', []);
      return true;
    } catch (error) {
      // Rollback on error
      await db.query('ROLLBACK', []);
      throw new Error(`Error updating FAQ order: ${error.message}`);
    }
  };