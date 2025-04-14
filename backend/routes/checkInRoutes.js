// backend/routes/checkInRoutes.js
import express from 'express';
import * as checkInController from '../controllers/checkInController.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// All check-in routes require admin authentication
router.use(auth);
router.use(admin);

// Validate a ticket by QR code
router.post('/validate', asyncHandler(checkInController.findTicketByQr));

// Check in a ticket
router.post('/:ticketId/confirm', asyncHandler(checkInController.checkInTicket));

// Get check-in stats for an event
router.get('/stats/:eventId', asyncHandler(checkInController.getEventCheckInStats));

export default router;