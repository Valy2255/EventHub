// backend/controllers/statisticsController.js
import { StatisticsService } from '../services/StatisticsService.js';

const statisticsService = new StatisticsService();

// Get event statistics (counts by category and total)
export const getEventStatistics = async (req, res, next) => {
  try {
    const statistics = await statisticsService.getEventStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error getting event statistics:', error);
    next(error);
  }
};

// Get count of upcoming events
export const getUpcomingEventsCount = async (req, res, next) => {
  try {
    const upcomingCount = await statisticsService.getUpcomingEventsCount();
    res.json({ upcomingCount });
  } catch (error) {
    console.error('Error getting upcoming events count:', error);
    next(error);
  }
};