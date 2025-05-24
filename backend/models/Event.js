import * as db from "../config/db.js";

// Find event by ID with detailed information
export const findById = async (id) => {
  const query = {
    text: `
      SELECT e.*, 
             c.name as category_name, c.slug as category_slug,
             s.name as subcategory_name, s.slug as subcategory_slug
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      WHERE e.id = $1 AND e.status IN ('active', 'rescheduled')
    `,
    values: [id],
  };

  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding event:", error);
    throw error;
  }
};

// Find related events (same category, future dates)
export const findRelated = async (categoryId, currentEventId, limit = 4) => {
  const query = {
    text: `
      SELECT e.*, 
             c.name as category_name, c.slug as category_slug,
             CASE WHEN e.status = 'rescheduled' THEN true ELSE false END AS is_rescheduled
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.category_id = $1 
        AND e.id != $2 
        AND e.date >= CURRENT_DATE
        AND e.status IN ('active', 'rescheduled')
      ORDER BY e.date ASC
      LIMIT $3
    `,
    values: [categoryId, currentEventId, limit],
  };

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error finding related events:", error);
    throw error;
  }
};

// Increment view count for an event
export const incrementViews = async (id) => {
  try {
    const query = {
      text: `
        UPDATE events 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = $1
        RETURNING id
      `,
      values: [id],
    };

    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error incrementing views:", error);
    throw error;
  }
};

// Create a new event
export const create = async (data, client = null) => {
  const {
    name,
    description,
    date,
    time,
    venue,
    address,
    image_url,
    category_id,
    subcategory_id,
    organizer_id,
    price_range,
    status = "active",
    cancellation_policy,
    max_tickets,
  } = data;

  const queryExecutor = client || db;

  const query = {
    text: `
      INSERT INTO events(
        name, description, date, time, venue, address, image_url, 
        category_id, subcategory_id, organizer_id, price_range, 
        status, cancellation_policy, max_tickets
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `,
    values: [
      name,
      description,
      date,
      time,
      venue,
      address,
      image_url,
      category_id,
      subcategory_id,
      organizer_id,
      price_range,
      status,
      cancellation_policy,
      max_tickets,
    ],
  };

  try {
    const result = await queryExecutor.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// Update an event
export const update = async (id, data, client = null) => {
  const queryExecutor = client || db;

  // Construct set statement
  const updates = [];
  const values = [];

  Object.keys(data).forEach((key, index) => {
    updates.push(`${key} = $${index + 1}`);
    values.push(data[key]);
  });

  // Add event ID as the last parameter
  values.push(id);

  const query = {
    text: `
      UPDATE events
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `,
    values,
  };

  try {
    const result = await queryExecutor.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (id, client = null) => {
  const queryExecutor = client || db;

  const query = {
    text: "DELETE FROM events WHERE id = $1 RETURNING id",
    values: [id],
  };

  try {
    const result = await queryExecutor.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// Find all events - for admin use
export const findAll = async (filters = {}, pagination = {}) => {
  const { sort = "newest", status, search } = filters;
  const { page = 1, limit = 10 } = pagination;

  // Default query
  let query = `
    SELECT e.*,
           c.name as category_name,
           s.name as subcategory_name
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subcategories s ON e.subcategory_id = s.id
  `;

  // Build where clause
  const whereConditions = [];
  const values = [];

  if (status) {
    whereConditions.push(`e.status = $${values.length + 1}`);
    values.push(status);
  } else {
    // Default - only show active and rescheduled events
    whereConditions.push(`e.status IN ('active', 'rescheduled')`);
  }

  if (search) {
    whereConditions.push(`(
      e.name ILIKE $${values.length + 1} OR
      e.description ILIKE $${values.length + 1} OR
      e.venue ILIKE $${values.length + 1}
    )`);
    values.push(`%${search}%`);
  }

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  // Order by
  if (sort === "newest") {
    query += ` ORDER BY e.created_at DESC`;
  } else if (sort === "oldest") {
    query += ` ORDER BY e.created_at ASC`;
  } else if (sort === "name_asc") {
    query += ` ORDER BY e.name ASC`;
  } else if (sort === "name_desc") {
    query += ` ORDER BY e.name DESC`;
  } else if (sort === "date_asc") {
    query += ` ORDER BY e.date ASC, e.time ASC`;
  } else if (sort === "date_desc") {
    query += ` ORDER BY e.date DESC, e.time DESC`;
  }

  // Pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  try {
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error finding all events:", error);
    throw error;
  }
};

// Helper to check if user has permission to modify an event
export const checkEventPermission = async (eventId, userId) => {
  try {
    // Find event
    const result = await db.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );
    
    if (result.rows.length === 0) {
      return false; // Event not found
    }
    
    const event = result.rows[0];
    
    // If creator_id matches userId, user has permission
    if (event.creator_id !== null && event.creator_id === userId) {
      return true;
    }
    
    // Check if user is admin
    const userResult = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return false; // User not found
    }
    
    const user = userResult.rows[0];
    return user.role === 'admin';
  } catch (error) {
    console.error('Error checking event permission:', error);
    return false;
  }
};