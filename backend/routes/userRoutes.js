// backend/routes/userRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import {
  updateUserProfile,
  getUserProfile,
} from '../controllers/userController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get user profile
router.get('/profile', getUserProfile);

// Update user profile
router.put('/profile', updateUserProfile);


export default router;