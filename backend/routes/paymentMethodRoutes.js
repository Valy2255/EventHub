// backend/routes/paymentMethodRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import {
  getPaymentMethods,
  getPaymentMethod,
  addPaymentMethod,
  updatePaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod
} from '../controllers/paymentMethodController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all payment methods for the authenticated user
router.get('/', getPaymentMethods);

// Get a specific payment method
router.get('/:id', getPaymentMethod);

// Add a new payment method
router.post('/', addPaymentMethod);

// Update a payment method
router.put('/:id', updatePaymentMethod);

// Set a payment method as default
router.put('/:id/default', setDefaultPaymentMethod);

// Delete a payment method
router.delete('/:id', deletePaymentMethod);

export default router;