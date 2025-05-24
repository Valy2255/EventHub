// backend/routes/ticketRoutes.js
import express from 'express';
import * as ticketController from '../controllers/ticketController.js';
import auth from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// User ticket routes (require authentication)
router.use(auth);

// Get all tickets for the authenticated user
router.get('/my-tickets', asyncHandler(ticketController.getUserTickets));

// Get upcoming tickets for the authenticated user
router.get('/upcoming', asyncHandler(ticketController.getUpcomingTickets));

// Get cancelled tickets for authenticated user
router.get('/cancelled', auth, asyncHandler(ticketController.getCancelledTickets));

// Get past tickets for the authenticated user
router.get('/past', asyncHandler(ticketController.getPastTickets));

// Get a specific ticket by ID
router.get('/:id', asyncHandler(ticketController.getTicketById));

// Request ticket cancellation/refund
router.post('/:id/refund', asyncHandler(ticketController.requestRefund));

router.post('/:id/exchange', asyncHandler(ticketController.exchangeTicket));

export default router;