// backend/models/Review.js
import * as db from "../config/db.js";

// Find review by ID
export const findById = async (id) => {
  const query = {
    text: `
        SELECT * FROM reviews
        WHERE id = $1
      `,
    values: [id],
  };

  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding review by ID:", error);
    throw error;
  }
};

// Find all reviews for an event
export const findByEventId = async (eventId) => {
  const query = {
    text: `
      SELECT r.*, u.name as user_name, u.profile_image
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.created_at DESC
    `,
    values: [eventId],
  };

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error finding reviews:", error);
    throw error;
  }
};

// Find if a user has reviewed an event
export const findUserReview = async (userId, eventId) => {
  const query = {
    text: `
      SELECT * FROM reviews
      WHERE user_id = $1 AND event_id = $2
    `,
    values: [userId, eventId],
  };

  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding user review:", error);
    throw error;
  }
};

// Create a new review
export const create = async (data) => {
  const { user_id, event_id, rating, comment } = data;

  const query = {
    text: `
      INSERT INTO reviews(user_id, event_id, rating, comment)
      VALUES($1, $2, $3, $4)
      RETURNING *
    `,
    values: [user_id, event_id, rating, comment],
  };

  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
};

// Update a review
export const update = async (id, data) => {
  const { rating, comment } = data;

  const query = {
    text: `
      UPDATE reviews
      SET rating = $2, comment = $3
      WHERE id = $1
      RETURNING *
    `,
    values: [id, rating, comment],
  };

  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
};

// Delete a review
export const remove = async (id) => {
  const query = {
    text: `
      DELETE FROM reviews
      WHERE id = $1
      RETURNING id
    `,
    values: [id],
  };

  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};
