import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import * as categoryController from '../controllers/categoryController.js';

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
router.get('/subcategories', categoryController.getAllSubcategories);
router.get('/subcategories/:id', categoryController.getSubcategoryById);
router.post('/subcategories', categoryController.createSubcategory);
router.put('/subcategories/:id', categoryController.updateSubcategory);
router.delete('/subcategories/:id', categoryController.deleteSubcategory);

export default router;