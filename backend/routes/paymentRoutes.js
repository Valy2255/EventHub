// backend/routes/paymentRoutes.js
import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Apply auth middleware to all payment routes
router.use(auth);

// Process a payment
router.post('/', asyncHandler(paymentController.processPayment));

// Get payment history for authenticated user
router.get('/history', asyncHandler(paymentController.getPaymentHistory));

// Get details of a specific payment
router.get('/:id', asyncHandler(paymentController.getPaymentDetails));

export default router;