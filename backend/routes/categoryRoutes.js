// backend/routes/categoryRoutes.js
import express from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

// Obține toate categoriile cu subcategoriile lor
router.get('/', categoryController.getAllCategoriesWithSubcategories);

// Routes for upcoming events
router.get('/events/upcoming', categoryController.getUpcomingEvents);
router.get('/events/upcoming/filtered', categoryController.getUpcomingEventsFiltered);

// Public endpoints using slugs
// backend/routes/categoryRoutes.js
router.get('/:slug', categoryController.getCategoryBySlug);
router.get('/:slug/events/featured', categoryController.getFeaturedEventsByCategory);
router.get('/:slug/events', categoryController.getEventsByCategoryPaginated);

// New route to fetch subcategories by category slug
router.get('/:slug/subcategories', categoryController.getSubcategoriesForCategory);

// Endpoint for subcategory events
router.get('/:categorySlug/:subcategorySlug', categoryController.getEventsBySubcategory);

export default router;