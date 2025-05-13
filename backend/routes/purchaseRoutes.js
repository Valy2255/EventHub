// backend/routes/purchaseRoutes.js
import express from 'express';
import * as purchaseController from '../controllers/purchaseController.js';
import auth from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Apply auth middleware to all purchase routes
router.use(auth);

// Get purchase history for authenticated user
router.get('/history', asyncHandler(purchaseController.getPurchaseHistory));

// Get details of a specific purchase
router.get('/:id', asyncHandler(purchaseController.getPurchaseById));

// Create a new purchase
router.post('/', asyncHandler(purchaseController.createPurchase));

export default router;