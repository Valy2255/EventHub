// src/routes/searchRoutes.js
import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as db from '../config/db.js';

const router = express.Router();

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  
  return distance;
};

/**
 * @route   GET /api/search/events
 * @desc    Search events with filters (location, date, query)
 * @access  Public
 */
router.get('/events', asyncHandler(async (req, res) => {
  const { 
    location, 
    date, 
    q: query, 
    lat, 
    lng, 
    category, 
    subcategory,
    // Support for new date range parameters
    startDate,
    endDate,
    specificDate
  } = req.query;
  
  let sqlQuery = `
    SELECT e.*, c.name as category_name, c.slug as category_slug, 
           s.name as subcategory_name, s.slug as subcategory_slug
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subcategories s ON e.subcategory_id = s.id
    WHERE e.status = 'active'
  `;
  
  const queryParams = [];
  
  // Add query filters
  if (query) {
    sqlQuery += ` AND (
      e.name ILIKE $${queryParams.length + 1} OR 
      e.description ILIKE $${queryParams.length + 1} OR 
      e.venue ILIKE $${queryParams.length + 1} OR
      e.city ILIKE $${queryParams.length + 1}
    )`;
    queryParams.push(`%${query}%`);
  }
  
  // Add location filter
  if (location && location !== 'Current Location') {
    sqlQuery += ` AND (
      e.city ILIKE $${queryParams.length + 1} OR 
      e.address ILIKE $${queryParams.length + 1}
    )`;
    queryParams.push(`%${location}%`);
  }
  
  // Handle date filtering with both legacy and new methods
  if (startDate && endDate) {
    // Use date range if provided
    sqlQuery += ` AND e.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
    queryParams.push(startDate);
    queryParams.push(endDate);
  } else if (specificDate) {
    // Use specific date if provided
    sqlQuery += ` AND e.date = $${queryParams.length + 1}`;
    queryParams.push(specificDate);
  } else if (date) {
    // Legacy date filter
    const today = new Date();
    
    switch (date) {
      case 'Today':
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        sqlQuery += ` AND e.date = $${queryParams.length + 1}`;
        queryParams.push(todayStr);
        break;
        
      case 'Tomorrow':
      case 'tomorrow': {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        sqlQuery += ` AND e.date = $${queryParams.length + 1}`;
        queryParams.push(tomorrow.toISOString().split('T')[0]);
        break;
      }
        
      case 'This Weekend':
      case 'this-weekend': {
        // Calculate the next weekend (Sat-Sun)
        const day = today.getDay(); // 0 = Sunday, 6 = Saturday
        const daysUntilSaturday = day === 6 ? 0 : (6 - day);
        const daysUntilSunday = day === 0 ? 0 : (7 - day);
        
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);
        
        const sunday = new Date(today);
        sunday.setDate(today.getDate() + daysUntilSunday);
        
        sqlQuery += ` AND e.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(saturday.toISOString().split('T')[0]);
        queryParams.push(sunday.toISOString().split('T')[0]);
        break;
      }
        
      case 'This Week':
      case 'this-week': {
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        sqlQuery += ` AND e.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(startOfWeek.toISOString().split('T')[0]);
        queryParams.push(endOfWeek.toISOString().split('T')[0]);
        break;
      }
      
      case 'Next Week':
      case 'next-week': {
        const startOfNextWeek = new Date(today);
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        startOfNextWeek.setDate(today.getDate() - dayOfWeek + 7);
        
        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
        
        sqlQuery += ` AND e.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(startOfNextWeek.toISOString().split('T')[0]);
        queryParams.push(endOfNextWeek.toISOString().split('T')[0]);
        break;
      }
      
      case 'This Month':
      case 'this-month': {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        sqlQuery += ` AND e.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(firstDayOfMonth.toISOString().split('T')[0]);
        queryParams.push(lastDayOfMonth.toISOString().split('T')[0]);
        break;
      }
        
      case 'Next Month':
      case 'next-month': {
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        
        sqlQuery += ` AND e.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
        queryParams.push(firstDayOfNextMonth.toISOString().split('T')[0]);
        queryParams.push(lastDayOfNextMonth.toISOString().split('T')[0]);
        break;
      }
      
      case 'Custom Range':
        // If we have a custom range but no startDate and endDate, we don't apply a filter
        // This is handled by the startDate and endDate parameters, so we do nothing here
        break;
    }
  }
  
  // Add category filter
  if (category) {
    sqlQuery += ` AND c.slug = $${queryParams.length + 1}`;
    queryParams.push(category);
  }
  
  // Add subcategory filter
  if (subcategory) {
    sqlQuery += ` AND s.slug = $${queryParams.length + 1}`;
    queryParams.push(subcategory);
  }
  
  // Add order by
  sqlQuery += ` ORDER BY e.date ASC, e.time ASC`;
  
  // Execute query
  const { rows: events } = await db.query(sqlQuery, queryParams);
  
  let results = events;
  
  // If using current location, calculate distances and sort by proximity
  if (lat && lng) {
    // Calculate distance for each event that has coordinates
    results = events.map(event => {
      let distance = null;
      if (event.latitude && event.longitude) {
        distance = calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          parseFloat(event.latitude), 
          parseFloat(event.longitude)
        );
      }
      return { ...event, distance };
    });
    
    // Sort by distance if available, otherwise keep original order
    results.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }
  
  // Format events for response
  const formattedEvents = results.map(event => ({
    id: event.id,
    name: event.name,
    slug: event.slug,
    venue: event.venue,
    city: event.city,
    address: event.address,
    date: event.date,
    time: event.time,
    end_time: event.end_time,
    image_url: event.image_url,
    min_price: event.min_price,
    max_price: event.max_price,
    distance: event.distance ? Math.round(event.distance * 10) / 10 : null, // Round to 1 decimal
    category: {
      id: event.category_id,
      name: event.category_name,
      slug: event.category_slug
    },
    subcategory: event.subcategory_id ? {
      id: event.subcategory_id,
      name: event.subcategory_name,
      slug: event.subcategory_slug
    } : null
  }));
  
  res.json({
    success: true,
    count: formattedEvents.length,
    events: formattedEvents
  });
}));

/**
 * @route   GET /api/search/quick
 * @desc    Quick search for events (top right search)
 * @access  Public
 */
router.get('/quick', asyncHandler(async (req, res) => {
  const { q: query } = req.query;
  
  if (!query || query.trim().length < 2) {
    return res.json({
      success: true,
      count: 0,
      events: []
    });
  }
  
  // Improved search query to handle partial matches from beginning of word
  const sqlQuery = `
    SELECT e.id, e.name, e.venue, e.city, e.date, e.image_url, 
           c.name as category_name, c.slug as category_slug
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE (
      e.name ILIKE $1 OR 
      e.venue ILIKE $1 OR 
      e.city ILIKE $1 OR
      e.name ILIKE $2 OR 
      e.venue ILIKE $2 OR 
      e.city ILIKE $2
    )
    AND e.status = 'active'
    ORDER BY
      CASE 
        WHEN e.name ILIKE $2 THEN 0  -- Exact match from start gets highest priority
        WHEN e.venue ILIKE $2 THEN 1
        WHEN e.city ILIKE $2 THEN 2
        ELSE 3
      END,
      e.date ASC
    LIMIT 5
  `;
  
  // We use two types of matches: contains anywhere and starts with
  const { rows: events } = await db.query(sqlQuery, [`%${query}%`, `${query}%`]);
  
  // Format events for response
  const formattedEvents = events.map(event => ({
    id: event.id,
    name: event.name,
    venue: event.venue,
    city: event.city,
    date: event.date,
    image_url: event.image_url,
    category: event.category_name
  }));
  
  res.json({
    success: true,
    count: formattedEvents.length,
    events: formattedEvents
  });
}));

/**
 * @route   POST /api/search/track-view/:eventId
 * @desc    Track when a user views an event (for recently viewed functionality)
 * @access  Public
 */
router.post('/track-view/:eventId', asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  
  // Get basic event info to return to client
  const { rows } = await db.query(`
    SELECT e.id, e.name, e.image_url, e.venue, e.city, c.name as category_name
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.id = $1
  `, [eventId]);
  
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  
  res.json({
    success: true,
    message: 'Event view tracked',
    event: rows[0]
  });
}));

export default router;