// backend/routes/categoryRoutes.js
import express from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

// Obține toate categoriile cu subcategoriile lor
router.get('/', categoryController.getAllCategoriesWithSubcategories);

// Obține evenimente după categorie
router.get('/:slug', categoryController.getEventsByCategory);

// Obține evenimente după subcategorie
router.get('/:categorySlug/:subcategorySlug', categoryController.getEventsBySubcategory);

export default router;