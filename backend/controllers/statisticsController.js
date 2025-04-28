// backend/controllers/statisticsController.js
import * as Statistics from '../models/Statistics.js';

// Get event statistics (counts by category and total)
export const getEventStatistics = async (req, res, next) => {
  try {
    const statistics = await Statistics.getEventStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error getting event statistics:', error);
    next(error);
  }
};

// Get count of upcoming events
export const getUpcomingEventsCount = async (req, res, next) => {
  try {
    const upcomingCount = await Statistics.getUpcomingEventsCount();
    res.json({ upcomingCount });
  } catch (error) {
    console.error('Error getting upcoming events count:', error);
    next(error);
  }
};