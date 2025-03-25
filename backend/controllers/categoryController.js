import * as Category from '../models/Category.js';
import * as Subcategory from '../models/Subcategory.js';

// Categories
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.getAll();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
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
    
    const category = await Category.create({ name, slug, description });
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
    
    const category = await Category.update(req.params.id, { name, slug, description });
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
    const category = await Category.remove(req.params.id);
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
    const categories = await Category.getAll();
    
    // For each category, get subcategories
    const categoriesWithSubcategories = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await Subcategory.getAll(category.id);
        return {
          ...category,
          subcategories
        };
      })
    );
    
    res.json({ categories: categoriesWithSubcategories });
  } catch (error) {
    next(error);
  }
};

// Get events by category
export const getEventsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Find category by slug
    const category = await Category.findBySlug(slug);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Get all events from this category
    const events = await Category.getEvents(category.id);
    
    res.json({ 
      category,
      events
    });
  } catch (error) {
    next(error);
  }
};

// Get events by subcategory
export const getEventsBySubcategory = async (req, res, next) => {
  try {
    const { categorySlug, subcategorySlug } = req.params;
    
    // Find category by slug
    const category = await Category.findBySlug(categorySlug);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Find subcategory by slug and category_id
    const subcategory = await Subcategory.findBySlug(category.id, subcategorySlug);
    
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    // Get all events from this subcategory
    const events = await Subcategory.getEvents(subcategory.id);
    
    res.json({
      category,
      subcategory,
      events
    });
  } catch (error) {
    next(error);
  }
};