// backend/models/Statistics.js
import * as db from '../config/db.js';

// Get event statistics (counts by category and total)
export const getEventStatistics = async () => {
  // Get total events count
  const totalQuery = {
    text: `
      SELECT COUNT(*) as total
      FROM events
      WHERE status = 'active'
    `
  };
  
  // Get counts by category
  const categoryCountsQuery = {
    text: `
      SELECT c.id, c.name, c.slug, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.status = 'active'
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
      WHERE date >= $1 AND status = 'active'
    `,
    values: [today]
  };
  
  const result = await db.query(query);
  return parseInt(result.rows[0].upcoming_count, 10);
};