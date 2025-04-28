// backend/routes/statisticsRoutes.js
import express from 'express';
import * as statisticsController from '../controllers/statisticsController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Get event statistics
router.get('/events', asyncHandler(statisticsController.getEventStatistics));
router.get('/events/upcoming', asyncHandler(statisticsController.getUpcomingEventsCount));

export default router;