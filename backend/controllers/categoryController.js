import { CategoryService } from '../services/CategoryService.js';

const categoryService = new CategoryService();

// Categories
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }
    
    const category = await categoryService.createCategory({ name, slug, description });
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }
    
    const category = await categoryService.updateCategory(req.params.id, { name, slug, description });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryService.deleteCategory(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get all categories with their subcategories
export const getAllCategoriesWithSubcategories = async (req, res, next) => {
  try {
    const result = await categoryService.getAllCategoriesWithSubcategories();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get events by category
export const getEventsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await categoryService.getEventsByCategory(slug);
    res.json(result);
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Get events by subcategory
export const getEventsBySubcategory = async (req, res, next) => {
  try {
    const { categorySlug, subcategorySlug } = req.params;
    const result = await categoryService.getEventsBySubcategory(categorySlug, subcategorySlug);
    res.json(result);
  } catch (error) {
    if (error.message === 'Category not found' || error.message === 'Subcategory not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Get a single category by slug (public endpoint)
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);
    res.json({ category });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Get featured events for a category by slug
export const getFeaturedEventsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await categoryService.getFeaturedEventsByCategory(slug);
    res.json(result);
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Get paginated events for a category by slug
export const getEventsByCategoryPaginated = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let { page = 1, limit = 20 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    
    const result = await categoryService.getEventsByCategoryPaginated(slug, page, limit);
    res.json(result);
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const getSubcategoriesForCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await categoryService.getSubcategoriesForCategory(slug);
    res.json(result);
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Get upcoming events across all categories
export const getUpcomingEvents = async (req, res, next) => {
  try {
    let { limit = 6 } = req.query;
    limit = parseInt(limit);
    
    const result = await categoryService.getUpcomingEvents(limit);
    res.json(result);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    next(error);
  }
};

