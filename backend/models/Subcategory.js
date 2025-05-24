// ================================
// backend/models/Subcategory.js
// ================================
import * as db from '../config/db.js';

export const getAll = async (categoryId = null) => {
  let query;
  
  if (categoryId) {
    query = {
      text: 'SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name',
      values: [categoryId]
    };
  } else {
    query = {
      text: 'SELECT s.*, c.name as category_name FROM subcategories s JOIN categories c ON s.category_id = c.id ORDER BY c.name, s.name'
    };
  }
  
  const result = await db.query(query);
  return result.rows;
};

export const findById = async (id) => {
  const query = {
    text: 'SELECT * FROM subcategories WHERE id = $1',
    values: [id]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const create = async (data, client = null) => {
  const { category_id, name, slug, description } = data;
  const queryExecutor = client || db;
  
  const query = {
    text: `INSERT INTO subcategories(category_id, name, slug, description) 
           VALUES($1, $2, $3, $4) 
           RETURNING *`,
    values: [category_id, name, slug, description]
  };
  
  const result = await queryExecutor.query(query);
  return result.rows[0];
};

export const update = async (id, data, client = null) => {
  const { category_id, name, slug, description, active } = data;
  const queryExecutor = client || db;
  
  const query = {
    text: `UPDATE subcategories 
           SET category_id = $1, name = $2, slug = $3, description = $4, active = $5 
           WHERE id = $6 
           RETURNING *`,
    values: [category_id, name, slug, description, active, id]
  };
  
  const result = await queryExecutor.query(query);
  return result.rows[0];
};

export const remove = async (id, client = null) => {
  const queryExecutor = client || db;
  
  const query = {
    text: 'DELETE FROM subcategories WHERE id = $1 RETURNING *',
    values: [id]
  };
  
  const result = await queryExecutor.query(query);
  return result.rows[0];
};

export const findBySlug = async (categoryId, slug) => {
  const query = {
    text: 'SELECT * FROM subcategories WHERE category_id = $1 AND slug = $2',
    values: [categoryId, slug]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const getEvents = async (subcategoryId) => {
  const query = {
    text: `
      SELECT e.*, 
             CASE WHEN e.status = 'rescheduled' THEN true ELSE false END AS is_rescheduled,
             e.original_date, e.original_time
      FROM events e
      WHERE e.subcategory_id = $1
      AND e.status IN ('active', 'rescheduled')
      ORDER BY e.date ASC
    `,
    values: [subcategoryId]
  };
  
  const result = await db.query(query);
  return result.rows;
};

// Get all subcategories with event counts for a specific category
export const getAllWithEventCounts = async (categoryId) => {
  const query = {
    text: `
      SELECT s.*, COUNT(e.id) as event_count
      FROM subcategories s
      LEFT JOIN events e ON s.id = e.subcategory_id AND e.status IN ('active', 'rescheduled')
      WHERE s.category_id = $1
      GROUP BY s.id
      ORDER BY s.name ASC
    `,
    values: [categoryId]
  };
  
  const result = await db.query(query);
  return result.rows;
};

