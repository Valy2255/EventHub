// backend/routes/creditRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import * as CreditController from '../controllers/creditController.js';

const router = express.Router();

// Get current user's credit balance
router.get('/', auth, CreditController.getCreditBalance);

// Get credit transaction history
router.get('/history', auth, CreditController.getCreditHistory);


export default router;