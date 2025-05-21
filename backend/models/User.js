// backend/models/User.js
import bcrypt from 'bcrypt';
import * as db from '../config/db.js';

export const create = async (userData) => {
  const { name, email, password } = userData;
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const query = {
    text: 'INSERT INTO users(name, email, password, credits) VALUES($1, $2, $3, $4) RETURNING id, name, email, role, created_at, credits',
    values: [name, email, hashedPassword, 0]
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
    text: 'SELECT id, name, email, profile_image, role, created_at, credits FROM users WHERE id = $1',
    values: [id]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const updateResetToken = async (userId, resetToken, resetTokenExpire) => {
  const query = {
    text: 'UPDATE users SET reset_token = $1, reset_token_expire = $2 WHERE id = $3 RETURNING id',
    values: [resetToken, resetTokenExpire ? new Date(resetTokenExpire) : null, userId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const findByResetToken = async (resetToken) => {
  const query = {
    text: 'SELECT * FROM users WHERE reset_token = $1',
    values: [resetToken]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

export const updatePassword = async (userId, password) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const query = {
    text: 'UPDATE users SET password = $1, reset_token = NULL, reset_token_expire = NULL WHERE id = $2 RETURNING id',
    values: [hashedPassword, userId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};

// Add credits to user
export const addCredits = async (userId, amount, type, description, referenceId = null, referenceType = null) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, update the user's credit balance
    const updateQuery = {
      text: `
        UPDATE users 
        SET credits = credits + $1 
        WHERE id = $2 
        RETURNING credits
      `,
      values: [amount, userId]
    };
    
    const userResult = await client.query(updateQuery);
    
    if (userResult.rows.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Record the transaction
    const transactionQuery = {
      text: `
        INSERT INTO credit_transactions 
        (user_id, amount, type, description, reference_id, reference_type) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      values: [userId, amount, type, description, referenceId, referenceType]
    };
    
    const transactionResult = await client.query(transactionQuery);
    
    await client.query('COMMIT');
    
    return {
      currentCredits: userResult.rows[0].credits,
      transaction: transactionResult.rows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in addCredits:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get user's credit balance
export const getCreditBalance = async (userId) => {
  const query = {
    text: 'SELECT credits FROM users WHERE id = $1',
    values: [userId]
  };
  
  const result = await db.query(query);
  
  if (result.rows.length === 0) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  return result.rows[0].credits;
};

// Get user's credit transactions history
export const getCreditTransactions = async (userId, limit = 10, offset = 0) => {
  const query = {
    text: `
      SELECT * FROM credit_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `,
    values: [userId, limit, offset]
  };
  
  const result = await db.query(query);
  return result.rows;
};

// Update user profile (including profile image)
export const updateProfile = async (userId, updateData) => {
  const { name, email, profile_image } = updateData;
  
  const query = {
    text: `
      UPDATE users 
      SET name = COALESCE($1, name), 
          email = COALESCE($2, email), 
          profile_image = COALESCE($3, profile_image),
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, email, profile_image, role, created_at, credits
    `,
    values: [name, email, profile_image, userId]
  };
  
  const result = await db.query(query);
  return result.rows[0];
};