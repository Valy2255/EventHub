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
      SELECT 
        e.*,
        er.avg_rating as rating,
        er.review_count,
        c.name as category_name,
        s.name as subcategory_name,
        CASE WHEN e.status = 'rescheduled' THEN true ELSE false END AS is_rescheduled
      FROM events e
      LEFT JOIN event_ratings er ON e.id = er.event_id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE c.id = $1 AND e.status IN ('active', 'rescheduled')
      ORDER BY e.date DESC, er.avg_rating DESC NULLS LAST
    `,
    values: [categoryId]
  };
  
  const result = await db.query(query);
  return result.rows;
};

// Get featured events for a category (e.g. top 2 based on some criteria)
export const getFeaturedEvents = async (categoryId) => {
  const query = {
    text: `
      SELECT 
        e.*,
        er.avg_rating as rating,
        er.review_count,
        c.name as category_name,
        s.name as subcategory_name,
        CASE WHEN e.status = 'rescheduled' THEN true ELSE false END AS is_rescheduled
      FROM events e
      LEFT JOIN event_ratings er ON e.id = er.event_id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE c.id = $1 
        AND e.status IN ('active', 'rescheduled')
        AND e.date >= CURRENT_DATE
        AND er.avg_rating IS NOT NULL
        AND er.review_count >= 3       -- At least 3 reviews for credibility
        AND er.avg_rating >= 4.0       -- Minimum 4.0 to be "featured"
      ORDER BY er.avg_rating DESC, er.review_count DESC
      LIMIT 10
    `,
    values: [categoryId]
  };
  
  const result = await db.query(query);
  return result.rows;
};

// Get paginated events for a category
export const getEventsPaginated = async (categoryId, limit, offset) => {
  // Query to fetch events with pagination
  const eventsQuery = {
    text: `
      SELECT *, 
             CASE WHEN status = 'rescheduled' THEN true ELSE false END AS is_rescheduled
      FROM events
      WHERE category_id = $1 
      AND status IN ('active', 'rescheduled')
      ORDER BY date ASC
      LIMIT $2 OFFSET $3
    `,
    values: [categoryId, limit, offset]
  };
  
  // Query to count total events - THIS IS THE KEY PART THAT NEEDS TO BE FIXED
  const countQuery = {
    text: `
      SELECT COUNT(*) AS total FROM events
      WHERE category_id = $1
      AND status IN ('active', 'rescheduled')
    `,
    values: [categoryId]
  };
  
  // Execute both queries
  const [resultEvents, resultCount] = await Promise.all([
    db.query(eventsQuery),
    db.query(countQuery)
  ]);
  
  const totalCount = parseInt(resultCount.rows[0].total, 10);
  
  return { 
    events: resultEvents.rows, 
    totalCount, 
    totalPages: Math.ceil(totalCount / limit)
  };
};

// Get all categories with event counts
export const getAllWithEventCounts = async () => {
  const query = {
    text: `
      SELECT 
        c.*,
        COALESCE(event_counts.event_count, 0) as event_count
      FROM categories c
      LEFT JOIN (
        SELECT 
          s.category_id,
          COUNT(DISTINCT e.id) as event_count
        FROM subcategories s
        LEFT JOIN events e ON e.subcategory_id = s.id 
          AND e.status IN ('active', 'rescheduled')
        GROUP BY s.category_id
      ) event_counts ON c.id = event_counts.category_id
      ORDER BY c.name
    `
  };
  
  const result = await db.query(query);
  return result.rows;
};

// Get total events count across all categories
export const getTotalEventsCount = async () => {
  const query = {
    text: `
      SELECT COUNT(*) as total_events
      FROM events 
      WHERE status IN ('active', 'rescheduled')
    `
  };
  
  const result = await db.query(query);
  return parseInt(result.rows[0].total_events, 10);
};

// Add this to backend/models/Category.js

// Get upcoming events across all categories
export const getUpcomingEvents = async (limit = 6) => {
  const query = {
    text: `
      SELECT 
        e.*,
        er.avg_rating as rating,
        er.review_count,
        c.name as category_name,
        c.slug as category_slug,
        s.name as subcategory_name,
        s.slug as subcategory_slug,
        CASE WHEN e.status = 'rescheduled' THEN true ELSE false END AS is_rescheduled
      FROM events e
      LEFT JOIN event_ratings er ON e.id = er.event_id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      WHERE e.date >= CURRENT_DATE 
        AND e.status IN ('active', 'rescheduled')
      ORDER BY e.date ASC, e.time ASC, er.avg_rating DESC NULLS LAST
      LIMIT $1
    `,
    values: [limit]
  };
  
  const result = await db.query(query);
  return result.rows;
};

// Get upcoming events with filtering options
export const getUpcomingEventsFiltered = async (options = {}) => {
  const {
    limit = 6,
    categoryId = null,
    location = null,
    startDate = null,
    endDate = null,
    lat = null, 
    lng = null
  } = options;
  
  // Base SQL query
  let sqlQuery = `
    SELECT e.*, c.name as category_name, c.slug as category_slug,
           s.name as subcategory_name, s.slug as subcategory_slug
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subcategories s ON e.subcategory_id = s.id
    WHERE e.date >= CURRENT_DATE AND e.status = 'active'
  `;
  
  // Parameters array
  const queryParams = [];
  let paramCounter = 1; // Start from the first parameter
  
  // Apply category filter if provided
  if (categoryId) {
    sqlQuery += ` AND e.category_id = $${paramCounter}`;
    queryParams.push(categoryId);
    paramCounter++;
  }
  
  // Apply location filter if provided
  if (location && location !== 'Current Location') {
    sqlQuery += ` AND (e.city ILIKE $${paramCounter} OR e.address ILIKE $${paramCounter})`;
    queryParams.push(`%${location}%`);
    paramCounter++;
  }
  
  // Apply date range filter if provided
  if (startDate && endDate) {
    sqlQuery += ` AND e.date BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
    queryParams.push(startDate, endDate);
    paramCounter += 2;
  }
  
  // Add order and limit
  sqlQuery += ` ORDER BY e.date ASC, e.time ASC LIMIT $${paramCounter}`;
  queryParams.push(limit);
  
  // Execute the query
  const result = await db.query(sqlQuery, queryParams);
  
  // Calculate distances if coordinates are provided
  let events = result.rows;
  if (lat && lng && location === 'Current Location') {
    events = events.map(event => {
      if (event.latitude && event.longitude) {
        // Calculate distance using Haversine formula (using the function from the categoryController)
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          parseFloat(event.latitude),
          parseFloat(event.longitude)
        );
        return { ...event, distance };
      }
      return event;
    });
    
    // Sort by distance if available
    events.sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }
  
  return events;
};

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  // Convert string coordinates to numbers if needed
  const latitude1 = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
  const longitude1 = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
  const latitude2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
  const longitude2 = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;
  
  // Validation check
  if (isNaN(latitude1) || isNaN(longitude1) || isNaN(latitude2) || isNaN(longitude2)) {
    console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return null;
  }
  
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert latitude and longitude from degrees to radians
  const dLat = (latitude2 - latitude1) * Math.PI / 180;
  const dLon = (longitude2 - longitude1) * Math.PI / 180;
  
  // Apply Haversine formula
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(latitude1 * Math.PI / 180) * Math.cos(latitude2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}