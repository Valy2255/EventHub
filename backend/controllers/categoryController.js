import * as Category from '../models/Category.js';
import * as Subcategory from '../models/Subcategory.js';

// Categorii
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
      return res.status(404).json({ error: 'Categoria nu a fost găsită' });
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
      return res.status(400).json({ error: 'Numele și slug-ul sunt obligatorii' });
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
      return res.status(400).json({ error: 'Numele și slug-ul sunt obligatorii' });
    }
    
    const category = await Category.update(req.params.id, { name, slug, description });
    if (!category) {
      return res.status(404).json({ error: 'Categoria nu a fost găsită' });
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
      return res.status(404).json({ error: 'Categoria nu a fost găsită' });
    }
    
    res.json({ message: 'Categoria a fost ștearsă cu succes' });
  } catch (error) {
    next(error);
  }
};