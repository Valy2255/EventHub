// backend/models/User.js
import bcrypt from 'bcrypt';
import * as db from '../config/db.js';

export const create = async (userData) => {
  const { name, email, password } = userData;
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const query = {
    text: 'INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email, role, created_at',
    values: [name, email, hashedPassword]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const findByEmail = async (email) => {
  const query = {
    text: 'SELECT * FROM users WHERE email = $1',
    values: [email]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const findById = async (id) => {
  const query = {
    text: 'SELECT id, name, email, profile_image, role, created_at FROM users WHERE id = $1',
    values: [id]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};