import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import * as categoryController from '../controllers/categoryController.js';
import * as adminController from '../controllers/adminController.js';
import * as subcategoryController from '../controllers/subcategoryController.js';
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

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;