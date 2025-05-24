// ================================
// backend/services/SubcategoryService.js
// ================================
import { BaseService } from './BaseService.js';
import * as SubcategoryModel from '../models/Subcategory.js';

export class SubcategoryService extends BaseService {
  async getAllSubcategories(categoryId = null) {
    return SubcategoryModel.getAll(categoryId);
  }

  async getSubcategoryById(id) {
    return SubcategoryModel.findById(id);
  }

  async createSubcategory(subcategoryData) {
    const { category_id, name, slug, description } = subcategoryData;
    
    if (!category_id || !name || !slug) {
      throw new Error('Category ID, name, and slug are required');
    }

    return this.executeInTransaction(async (client) => {
      return SubcategoryModel.create({ category_id, name, slug, description }, client);
    });
  }

  async updateSubcategory(id, subcategoryData) {
    const { category_id, name, slug, description, active } = subcategoryData;
    
    if (!category_id || !name || !slug) {
      throw new Error('Category ID, name, and slug are required');
    }

    return this.executeInTransaction(async (client) => {
      const updateData = {
        category_id, 
        name, 
        slug, 
        description, 
        active: active !== undefined ? active : true
      };
      
      const result = await SubcategoryModel.update(id, updateData, client);
      
      if (!result) {
        throw new Error('Subcategory not found');
      }
      
      return result;
    });
  }

  async deleteSubcategory(id) {
    return this.executeInTransaction(async (client) => {
      const result = await SubcategoryModel.remove(id, client);
      
      if (!result) {
        throw new Error('Subcategory not found');
      }
      
      return result;
    });
  }
}
