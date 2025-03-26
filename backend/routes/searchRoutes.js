// src/routes/searchRoutes.js
import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as db from '../config/db.js';

const router = express.Router();

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

/**
 * @route   GET /api/search/events
 * @desc    Search events with filters (location, date, query)
 * @access  Public
 */
router.get('/events', asyncHandler(async (req, res) => {
  const { location, date, q: query, lat, lng, category, subcategory } = req.query;
  
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
  
  // Add date filter
  if (date) {
    let dateFilter;
    const today = new Date();
    
    switch (date) {
      case 'Today':
      case 'today':
        dateFilter = today.toISOString().split('T')[0];
        sqlQuery += ` AND e.date = $${queryParams.length + 1}`;
        queryParams.push(dateFilter);
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
  
  // Simplified search query focused on just event name, venue, city
  const sqlQuery = `
    SELECT e.id, e.name, e.venue, e.city, e.date, e.image_url, 
           c.name as category_name, c.slug as category_slug
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE (e.name ILIKE $1 OR e.venue ILIKE $1 OR e.city ILIKE $1)
    AND e.status = 'active'
    ORDER BY e.date ASC
    LIMIT 5
  `;
  
  const { rows: events } = await db.query(sqlQuery, [`%${query}%`]);
  
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
    SELECT e.id, e.name, e.image_url, c.name as category_name
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