// models/faqModel.js
import * as db from '../config/db.js';

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

export const createFAQ = async (faqData, client = null) => {
  const { question, answer, display_order = 0 } = faqData;
  const queryExecutor = client || db;
  
  try {
    const result = await queryExecutor.query(
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

export const updateFAQ = async (id, faqData, client = null) => {
  const { question, answer, display_order, is_active } = faqData;
  const queryExecutor = client || db;
  
  try {
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
    
    const result = await queryExecutor.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating FAQ: ${error.message}`);
  }
};

export const deleteFAQ = async (id, client = null) => {
  const queryExecutor = client || db;
  
  try {
    const result = await queryExecutor.query(
      'DELETE FROM faqs WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    throw new Error(`Error deleting FAQ: ${error.message}`);
  }
};

export const updateOrder = async (orderData, client = null) => {
  const queryExecutor = client || db;
  
  try {
    if (!client) {
      await db.query('BEGIN', []);
    }
    
    for (const item of orderData) {
      await queryExecutor.query(
        'UPDATE faqs SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.display_order, item.id]
      );
    }
    
    if (!client) {
      await db.query('COMMIT', []);
    }
    
    return true;
  } catch (error) {
    if (!client) {
      await db.query('ROLLBACK', []);
    }
    throw new Error(`Error updating FAQ order: ${error.message}`);
  }
};