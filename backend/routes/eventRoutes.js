// backend/routes/eventRoutes.js
import express from 'express';
import * as eventController from '../controllers/eventController.js';
import * as reviewController from '../controllers/reviewController.js';
import auth from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Public routes
router.get('/:id', asyncHandler(eventController.getEventById));
router.post('/:id/view', asyncHandler(eventController.incrementViewCount));

// Review routes
router.get('/:id/reviews', asyncHandler(reviewController.getEventReviews));
router.post('/:id/reviews', auth, asyncHandler(reviewController.createReview));
router.put('/reviews/:reviewId', auth, asyncHandler(reviewController.updateReview));
router.delete('/reviews/:reviewId', auth, asyncHandler(reviewController.deleteReview));
router.get('/:id/ticket-types', asyncHandler(eventController.getEventTicketTypes));

export default router;