import { jest } from '@jest/globals';

// Mock models using unstable_mockModule
jest.unstable_mockModule('../../models/Subcategory.js', () => ({
  getAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule('../../services/BaseService.js', () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  }
}));

describe('SubcategoryService', () => {
  let SubcategoryService;
  let SubcategoryModel;
  let subcategoryService;

  beforeAll(async () => {
    SubcategoryModel = await import('../../models/Subcategory.js');
    const { SubcategoryService: SubcategoryServiceClass } = await import('../../services/SubcategoryService.js');
    SubcategoryService = SubcategoryServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    subcategoryService = new SubcategoryService();
  });

  describe('getAllSubcategories', () => {
    it('should return all subcategories', async () => {
      const mockSubcategories = [
        { id: 1, name: 'Rock', slug: 'rock', category_id: 1 },
        { id: 2, name: 'Jazz', slug: 'jazz', category_id: 1 }
      ];

      SubcategoryModel.getAll.mockResolvedValue(mockSubcategories);

      const result = await subcategoryService.getAllSubcategories();

      expect(SubcategoryModel.getAll).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockSubcategories);
    });

    it('should return subcategories for specific category', async () => {
      const categoryId = 1;
      const mockSubcategories = [
        { id: 1, name: 'Rock', slug: 'rock', category_id: 1 }
      ];

      SubcategoryModel.getAll.mockResolvedValue(mockSubcategories);

      const result = await subcategoryService.getAllSubcategories(categoryId);

      expect(SubcategoryModel.getAll).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(mockSubcategories);
    });

    it('should return empty array when no subcategories exist', async () => {
      SubcategoryModel.getAll.mockResolvedValue([]);

      const result = await subcategoryService.getAllSubcategories();

      expect(result).toEqual([]);
    });
  });

  describe('getSubcategoryById', () => {
    it('should return subcategory by ID', async () => {
      const subcategoryId = 1;
      const mockSubcategory = { 
        id: subcategoryId, 
        name: 'Rock', 
        slug: 'rock', 
        category_id: 1,
        description: 'Rock music events'
      };

      SubcategoryModel.findById.mockResolvedValue(mockSubcategory);

      const result = await subcategoryService.getSubcategoryById(subcategoryId);

      expect(SubcategoryModel.findById).toHaveBeenCalledWith(subcategoryId);
      expect(result).toEqual(mockSubcategory);
    });

    it('should return null if subcategory not found', async () => {
      SubcategoryModel.findById.mockResolvedValue(null);

      const result = await subcategoryService.getSubcategoryById(999);

      expect(SubcategoryModel.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('createSubcategory', () => {
    it('should create subcategory successfully', async () => {
      const subcategoryData = {
        category_id: 1,
        name: 'Jazz',
        slug: 'jazz',
        description: 'Jazz music events'
      };

      const createdSubcategory = { id: 1, ...subcategoryData };
      SubcategoryModel.create.mockResolvedValue(createdSubcategory);

      const result = await subcategoryService.createSubcategory(subcategoryData);

      expect(SubcategoryModel.create).toHaveBeenCalledWith({
        category_id: 1,
        name: 'Jazz',
        slug: 'jazz',
        description: 'Jazz music events'
      }, undefined);
      expect(result).toEqual(createdSubcategory);
    });

    it('should throw error for missing required fields', async () => {
      const subcategoryData = { name: 'Jazz' }; // missing category_id and slug

      await expect(subcategoryService.createSubcategory(subcategoryData))
        .rejects.toThrow('Category ID, name, and slug are required');
    });

    it('should throw error for missing category_id', async () => {
      const subcategoryData = { name: 'Jazz', slug: 'jazz' }; // missing category_id

      await expect(subcategoryService.createSubcategory(subcategoryData))
        .rejects.toThrow('Category ID, name, and slug are required');
    });

    it('should throw error for missing name', async () => {
      const subcategoryData = { category_id: 1, slug: 'jazz' }; // missing name

      await expect(subcategoryService.createSubcategory(subcategoryData))
        .rejects.toThrow('Category ID, name, and slug are required');
    });

    it('should throw error for missing slug', async () => {
      const subcategoryData = { category_id: 1, name: 'Jazz' }; // missing slug

      await expect(subcategoryService.createSubcategory(subcategoryData))
        .rejects.toThrow('Category ID, name, and slug are required');
    });

    it('should create subcategory without description', async () => {
      const subcategoryData = {
        category_id: 1,
        name: 'Blues',
        slug: 'blues'
        // No description
      };

      const createdSubcategory = { id: 1, ...subcategoryData, description: undefined };
      SubcategoryModel.create.mockResolvedValue(createdSubcategory);

      const result = await subcategoryService.createSubcategory(subcategoryData);

      expect(SubcategoryModel.create).toHaveBeenCalledWith({
        category_id: 1,
        name: 'Blues',
        slug: 'blues',
        description: undefined
      }, undefined);
      expect(result).toEqual(createdSubcategory);
    });

    it('should handle transaction client', async () => {
      const subcategoryData = {
        category_id: 1,
        name: 'Country',
        slug: 'country',
        description: 'Country music events'
      };

      const createdSubcategory = { id: 1, ...subcategoryData };
      const mockClient = { query: jest.fn() };

      SubcategoryModel.create.mockResolvedValue(createdSubcategory);
      subcategoryService.executeInTransaction = jest.fn(async (callback) => callback(mockClient));

      const result = await subcategoryService.createSubcategory(subcategoryData);

      expect(SubcategoryModel.create).toHaveBeenCalledWith({
        category_id: 1,
        name: 'Country',
        slug: 'country',
        description: 'Country music events'
      }, mockClient);
    });

    it('should handle database errors during creation', async () => {
      const subcategoryData = {
        category_id: 1,
        name: 'Jazz',
        slug: 'jazz'
      };

      SubcategoryModel.create.mockRejectedValue(new Error('Database error'));

      await expect(subcategoryService.createSubcategory(subcategoryData))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateSubcategory', () => {
    it('should update subcategory successfully', async () => {
      const subcategoryId = 1;
      const updateData = {
        category_id: 1,
        name: 'Updated Jazz',
        slug: 'updated-jazz',
        description: 'Updated jazz music events',
        active: true
      };

      const updatedSubcategory = { id: subcategoryId, ...updateData };
      SubcategoryModel.update.mockResolvedValue(updatedSubcategory);

      const result = await subcategoryService.updateSubcategory(subcategoryId, updateData);

      expect(SubcategoryModel.update).toHaveBeenCalledWith(subcategoryId, {
        category_id: 1,
        name: 'Updated Jazz',
        slug: 'updated-jazz',
        description: 'Updated jazz music events',
        active: true
      }, undefined);
      expect(result).toEqual(updatedSubcategory);
    });

    it('should set active to true by default when not provided', async () => {
      const subcategoryId = 1;
      const updateData = {
        category_id: 1,
        name: 'Jazz',
        slug: 'jazz'
        // No active field
      };

      const updatedSubcategory = { id: subcategoryId, ...updateData, active: true };
      SubcategoryModel.update.mockResolvedValue(updatedSubcategory);

      const result = await subcategoryService.updateSubcategory(subcategoryId, updateData);

      expect(SubcategoryModel.update).toHaveBeenCalledWith(subcategoryId, {
        category_id: 1,
        name: 'Jazz',
        slug: 'jazz',
        description: undefined,
        active: true
      }, undefined);
    });

    it('should throw error if subcategory not found for update', async () => {
      const updateData = {
        category_id: 1,
        name: 'Jazz',
        slug: 'jazz'
      };

      SubcategoryModel.update.mockResolvedValue(null);

      await expect(subcategoryService.updateSubcategory(999, updateData))
        .rejects.toThrow('Subcategory not found');
    });

    it('should throw error for missing required fields in update', async () => {
      const updateData = { name: 'Jazz' }; // missing category_id and slug

      await expect(subcategoryService.updateSubcategory(1, updateData))
        .rejects.toThrow('Category ID, name, and slug are required');
    });

    it('should allow setting active to false', async () => {
      const subcategoryId = 1;
      const updateData = {
        category_id: 1,
        name: 'Inactive Genre',
        slug: 'inactive-genre',
        active: false
      };

      const updatedSubcategory = { id: subcategoryId, ...updateData };
      SubcategoryModel.update.mockResolvedValue(updatedSubcategory);

      const result = await subcategoryService.updateSubcategory(subcategoryId, updateData);

      expect(SubcategoryModel.update).toHaveBeenCalledWith(subcategoryId, {
        category_id: 1,
        name: 'Inactive Genre',
        slug: 'inactive-genre',
        description: undefined,
        active: false
      }, undefined);
    });

    it('should handle transaction client in update', async () => {
      const subcategoryId = 1;
      const updateData = {
        category_id: 1,
        name: 'Updated Jazz',
        slug: 'updated-jazz'
      };

      const updatedSubcategory = { id: subcategoryId, ...updateData };
      const mockClient = { query: jest.fn() };

      SubcategoryModel.update.mockResolvedValue(updatedSubcategory);
      subcategoryService.executeInTransaction = jest.fn(async (callback) => callback(mockClient));

      const result = await subcategoryService.updateSubcategory(subcategoryId, updateData);

      expect(SubcategoryModel.update).toHaveBeenCalledWith(subcategoryId, {
        category_id: 1,
        name: 'Updated Jazz',
        slug: 'updated-jazz',
        description: undefined,
        active: true
      }, mockClient);
    });

    it('should handle database errors during update', async () => {
      const updateData = {
        category_id: 1,
        name: 'Jazz',
        slug: 'jazz'
      };

      SubcategoryModel.update.mockRejectedValue(new Error('Update failed'));

      await expect(subcategoryService.updateSubcategory(1, updateData))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteSubcategory', () => {
    it('should delete subcategory successfully', async () => {
      const subcategoryId = 1;
      const deleteResult = { id: subcategoryId, deleted: true };

      SubcategoryModel.remove.mockResolvedValue(deleteResult);

      const result = await subcategoryService.deleteSubcategory(subcategoryId);

      expect(SubcategoryModel.remove).toHaveBeenCalledWith(subcategoryId, undefined);
      expect(result).toEqual(deleteResult);
    });

    it('should throw error if subcategory not found for deletion', async () => {
      SubcategoryModel.remove.mockResolvedValue(null);

      await expect(subcategoryService.deleteSubcategory(999))
        .rejects.toThrow('Subcategory not found');
    });

    it('should handle transaction client in delete', async () => {
      const subcategoryId = 1;
      const deleteResult = { id: subcategoryId, deleted: true };
      const mockClient = { query: jest.fn() };

      SubcategoryModel.remove.mockResolvedValue(deleteResult);
      subcategoryService.executeInTransaction = jest.fn(async (callback) => callback(mockClient));

      const result = await subcategoryService.deleteSubcategory(subcategoryId);

      expect(SubcategoryModel.remove).toHaveBeenCalledWith(subcategoryId, mockClient);
      expect(result).toEqual(deleteResult);
    });

    it('should handle database errors during deletion', async () => {
      SubcategoryModel.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(subcategoryService.deleteSubcategory(1))
        .rejects.toThrow('Delete failed');
    });
  });
});