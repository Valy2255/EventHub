// backend/controllers/subcategoryController.js
import { SubcategoryService } from '../services/SubcategoryService.js';

const subcategoryService = new SubcategoryService();

export const getAllSubcategories = async (req, res, next) => {
  try {
    const subcategories = await subcategoryService.getAllSubcategories(req.query.categoryId);
    res.json({ subcategories });
  } catch (error) {
    next(error);
  }
};

export const getSubcategoryById = async (req, res, next) => {
  try {
    const subcategory = await subcategoryService.getSubcategoryById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    res.json({ subcategory });
  } catch (error) {
    next(error);
  }
};

export const createSubcategory = async (req, res, next) => {
  try {
    const { category_id, name, slug, description } = req.body;
    
    const subcategory = await subcategoryService.createSubcategory({ 
      category_id, name, slug, description 
    });
    res.status(201).json({ subcategory });
  } catch (error) {
    if (error.message === 'Category ID, name, and slug are required') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const updateSubcategory = async (req, res, next) => {
  try {
    const { category_id, name, slug, description, active } = req.body;
    
    const subcategory = await subcategoryService.updateSubcategory(req.params.id, {
      category_id, name, slug, description, active
    });
    
    res.json({ subcategory });
  } catch (error) {
    if (error.message === 'Category ID, name, and slug are required') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Subcategory not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const deleteSubcategory = async (req, res, next) => {
  try {
    await subcategoryService.deleteSubcategory(req.params.id);
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    if (error.message === 'Subcategory not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};