// backend/models/PaymentMethod.js
import * as db from '../config/db.js';

export const findAllByUserId = async (userId) => {
  try {
    const result = await db.query(
      `SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

export const findById = async (id, userId) => {
  try {
    const result = await db.query(
      `SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching payment method:', error);
    throw error;
  }
};

export const create = async (paymentMethodData) => {
  const { 
    userId, 
    cardType, 
    lastFour, 
    cardHolderName, 
    expiryMonth, 
    expiryYear, 
    isDefault, 
    token 
  } = paymentMethodData;

  try {
    // If this is the default card, first unset any existing default
    if (isDefault) {
      await db.query(
        `UPDATE payment_methods SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await db.query(
      `INSERT INTO payment_methods 
       (user_id, card_type, last_four, card_holder_name, expiry_month, expiry_year, is_default, token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, cardType, lastFour, cardHolderName, expiryMonth, expiryYear, isDefault, token]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw error;
  }
};

export const update = async (id, userId, paymentMethodData) => {
  const { 
    cardHolderName, 
    expiryMonth, 
    expiryYear, 
    isDefault 
  } = paymentMethodData;

  try {
    // If this is being set as default, first unset any existing default
    if (isDefault) {
      await db.query(
        `UPDATE payment_methods SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }

    const result = await db.query(
      `UPDATE payment_methods 
       SET card_holder_name = $1, 
           expiry_month = $2, 
           expiry_year = $3, 
           is_default = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [cardHolderName, expiryMonth, expiryYear, isDefault, id, userId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
};

export const setDefault = async (id, userId) => {
  try {
    // First, unset all defaults for this user
    await db.query(
      `UPDATE payment_methods SET is_default = false WHERE user_id = $1`,
      [userId]
    );
    
    // Then set the selected one as default
    const result = await db.query(
      `UPDATE payment_methods SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw error;
  }
};

export const remove = async (id, userId) => {
  try {
    const result = await db.query(
      `DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};