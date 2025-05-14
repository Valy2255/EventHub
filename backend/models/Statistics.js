// backend/models/Statistics.js - Updated version
import * as db from '../config/db.js';

// Get event statistics (counts by category and total)
export const getEventStatistics = async () => {
  // Get total events count
  const totalQuery = {
    text: `
      SELECT COUNT(*) as total
      FROM events
      WHERE status IN ('active', 'rescheduled')
    `
  };
  
  // Get counts by category
  const categoryCountsQuery = {
    text: `
      SELECT c.id, c.name, c.slug, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.status IN ('active', 'rescheduled')
      GROUP BY c.id
      ORDER BY c.name
    `
  };
  
  const totalResult = await db.query(totalQuery);
  const categoryResults = await db.query(categoryCountsQuery);
  
  const totalEvents = parseInt(totalResult.rows[0].total, 10);
  const categoryCounts = categoryResults.rows;
  
  return {
    totalEvents,
    categoryCounts
  };
};

// Get count of upcoming events
export const getUpcomingEventsCount = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const query = {
    text: `
      SELECT COUNT(*) as upcoming_count
      FROM events
      WHERE date >= $1 AND status IN ('active', 'rescheduled')
    `,
    values: [today]
  };
  
  const result = await db.query(query);
  return parseInt(result.rows[0].upcoming_count, 10);
};

// You might also want to add this new function to get statistics about rescheduled events
export const getRescheduledEventsStatistics = async () => {
  const query = {
    text: `
      SELECT 
        COUNT(*) as total_rescheduled,
        COUNT(CASE WHEN date >= CURRENT_DATE THEN 1 END) as upcoming_rescheduled
      FROM events
      WHERE status = 'rescheduled'
    `
  };
  
  const result = await db.query(query);
  return {
    totalRescheduled: parseInt(result.rows[0].total_rescheduled, 10),
    upcomingRescheduled: parseInt(result.rows[0].upcoming_rescheduled, 10)
  };
};