// backend/routes/categoryRoutes.js
import express from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

// Obține toate categoriile cu subcategoriile lor
router.get('/', categoryController.getAllCategoriesWithSubcategories);

// Public endpoints using slugs
// backend/routes/categoryRoutes.js
router.get('/:slug', categoryController.getCategoryBySlug);
router.get('/:slug/events/featured', categoryController.getFeaturedEventsByCategory);
router.get('/:slug/events', categoryController.getEventsByCategoryPaginated);

// New route to fetch subcategories by category slug
router.get('/:slug/subcategories', categoryController.getSubcategoriesForCategory);

// Endpoint for subcategory events
router.get('/:categorySlug/:subcategorySlug', categoryController.getEventsBySubcategory);

// Add this to your categoryController.js file

// Get paginated events for a category by slug with additional filter options
export const getEventsByCategoryPaginated = async (req, res, next) => {
    try {
      const { slug } = req.params;
      let { page = 1, limit = 20, location, startDate, endDate, lat, lng } = req.query;
      
      // Convert string parameters to the correct types
      page = parseInt(page);
      limit = parseInt(limit);
      
      // Find category by slug
      const category = await Category.findBySlug(slug);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      // Base SQL query
      let sqlQuery = `
        SELECT e.*, c.name as category_name, c.slug as category_slug,
               s.name as subcategory_name, s.slug as subcategory_slug
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN subcategories s ON e.subcategory_id = s.id
        WHERE e.category_id = $1 AND e.status = 'active'
      `;
      
      // Parameters array (starts with category ID)
      const queryParams = [category.id];
      let paramCounter = 2; // Start from the second parameter
      
      // Apply location filter if provided
      if (location && location !== 'Current Location') {
        sqlQuery += ` AND (e.city ILIKE $${paramCounter} OR e.address ILIKE $${paramCounter})`;
        queryParams.push(`%${location}%`);
        paramCounter++;
      }
      
      // Apply date range filter if provided
      if (startDate && endDate) {
        sqlQuery += ` AND e.date BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
        queryParams.push(startDate, endDate);
        paramCounter += 2;
      }
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      // Add order, limit and offset
      sqlQuery += ` ORDER BY e.date ASC, e.time ASC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      queryParams.push(limit, offset);
      
      // Execute the main query
      const eventsResult = await db.query(sqlQuery, queryParams);
      
      // Get total count for pagination
      const countQuery = {
        text: `
          SELECT COUNT(*) AS total FROM events e
          WHERE e.category_id = $1 AND e.status = 'active'
        `,
        values: [category.id]
      };
      const countResult = await db.query(countQuery);
      const totalCount = parseInt(countResult.rows[0].total, 10);
      const totalPages = Math.ceil(totalCount / limit);
      
      // Calculate distances if coordinates are provided
      let events = eventsResult.rows;
      if (lat && lng && location === 'Current Location') {
        events = events.map(event => {
          if (event.latitude && event.longitude) {
            // Calculate distance using Haversine formula
            const distance = calculateDistance(
              parseFloat(lat),
              parseFloat(lng),
              parseFloat(event.latitude),
              parseFloat(event.longitude)
            );
            return { ...event, distance };
          }
          return event;
        });
        
        // Sort by distance if available
        events.sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }
      
      // Return formatted response with all necessary pagination info
      res.json({
        category,
        events,
        totalCount,
        total: totalCount, // Add another field for compatibility
        totalPages,
        currentPage: page
      });
    } catch (error) {
      console.error('Error in getEventsByCategoryPaginated:', error);
      next(error);
    }
  };
  
  // Helper function to calculate distance between coordinates
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    // Convert string coordinates to numbers if needed
    const latitude1 = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
    const longitude1 = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
    const latitude2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const longitude2 = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;
    
    // Validation check
    if (isNaN(latitude1) || isNaN(longitude1) || isNaN(latitude2) || isNaN(longitude2)) {
      console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
      return null;
    }
    
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert latitude and longitude from degrees to radians
    const dLat = (latitude2 - latitude1) * Math.PI / 180;
    const dLon = (longitude2 - longitude1) * Math.PI / 180;
    
    // Apply Haversine formula
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(latitude1 * Math.PI / 180) * Math.cos(latitude2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }
  
export default router;