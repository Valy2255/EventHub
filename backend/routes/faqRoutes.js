// routes/faqRoutes.js
import express from 'express';
import * as faqController from '../controllers/faqController.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();

// Public routes - NO authentication required
router.get('/', faqController.getAllFAQs);
router.get('/:id', faqController.getFAQById);

// Admin routes - authentication and admin required
router.post('/', auth, admin, faqController.createFAQ);
router.put('/:id', auth, admin, faqController.updateFAQ);
router.delete('/:id', auth, admin, faqController.deleteFAQ);
router.post('/order', auth, admin, faqController.updateFAQOrder);

export default router;