import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import * as categoryController from '../controllers/categoryController.js';
import * as adminController from '../controllers/adminController.js';
import * as subcategoryController from '../controllers/subcategoryController.js';
import * as eventController from '../controllers/eventController.js';
const router = express.Router();

// Middleware-ul de autentificare și verificare a rolului admin
router.use(auth);
router.use(admin);

// Rute pentru categorii
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Rute pentru subcategorii
router.get('/subcategories', subcategoryController.getAllSubcategories);
router.get('/subcategories/:id', subcategoryController.getSubcategoryById);
router.post('/subcategories', subcategoryController.createSubcategory);
router.put('/subcategories/:id', subcategoryController.updateSubcategory);
router.delete('/subcategories/:id', subcategoryController.deleteSubcategory);

// Rute pentru evenimente (admin)
router.get('/events', adminController.getAllEvents);
router.get('/events/:id', adminController.getEventById);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

// Rute pentru utilizatori
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/dashboard/stats', adminController.getDashboardStats);

// Refund management routes
router.get('/refunds', adminController.getAllRefunds);
router.put('/refunds/:id', adminController.approveRefund);

export default router;