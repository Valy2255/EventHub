// backend/models/Category.js
import * as db from '../config/db.js';

export const getAll = async () => {
  const query = {
    text: 'SELECT * FROM categories ORDER BY name'
  };
  
  const result = await db.query(query);
  return result.rows;
};

export const findById = async (id) => {
  const query = {
    text: 'SELECT * FROM categories WHERE id = $1',
    values: [id]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const create = async (data) => {
  const { name, slug, description } = data;
  
  const query = {
    text: `INSERT INTO categories(name, slug, description) 
           VALUES($1, $2, $3) 
           RETURNING *`,
    values: [name, slug, description]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const update = async (id, data) => {
  const { name, slug, description } = data;
  
  const query = {
    text: `UPDATE categories 
           SET name = $1, slug = $2, description = $3 
           WHERE id = $4 
           RETURNING *`,
    values: [name, slug, description, id]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const remove = async (id) => {
  const query = {
    text: 'DELETE FROM categories WHERE id = $1 RETURNING *',
    values: [id]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const findBySlug = async (slug) => {
  const query = {
    text: 'SELECT * FROM categories WHERE slug = $1',
    values: [slug]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const getEvents = async (categoryId) => {
  const query = {
    text: `
      SELECT e.* FROM events e
      WHERE e.category_id = $1
      ORDER BY e.date DESC
    `,
    values: [categoryId]
  };
  
  const result = await db.query(query);
  return result.rows;
};