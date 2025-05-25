// tests/controllers/subcategoryController.test.js

import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'admin@example.com', name: 'Admin User', role: 'admin' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the SubcategoryService
const mockSubcategoryService = {
  getAllSubcategories: jest.fn(),
  getSubcategoryById: jest.fn(),
  createSubcategory: jest.fn(),
  updateSubcategory: jest.fn(),
  deleteSubcategory: jest.fn()
};

jest.unstable_mockModule('../../services/SubcategoryService.js', () => ({
  SubcategoryService: jest.fn().mockImplementation(() => mockSubcategoryService)
}));

const { 
  getAllSubcategories, 
  getSubcategoryById, 
  createSubcategory, 
  updateSubcategory, 
  deleteSubcategory 
} = await import('../../controllers/subcategoryController.js');

describe('SubcategoryController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockSubcategoryService).forEach(mock => mock.mockReset());
  });

  describe('getAllSubcategories', () => {
    it('should get all subcategories successfully', async () => {
      const mockSubcategories = [
        {
          id: 1,
          category_id: 1,
          name: 'Rock Music',
          slug: 'rock-music',
          description: 'Rock music events',
          active: true
        },
        {
          id: 2,
          category_id: 1,
          name: 'Jazz Music',
          slug: 'jazz-music',
          description: 'Jazz music events',
          active: true
        }
      ];
      mockSubcategoryService.getAllSubcategories.mockResolvedValue(mockSubcategories);

      await getAllSubcategories(req, res, next);

      expect(mockSubcategoryService.getAllSubcategories).toHaveBeenCalledWith(undefined);
      expect(res.json).toHaveBeenCalledWith({ subcategories: mockSubcategories });
    });

    it('should filter subcategories by category ID', async () => {
      const mockSubcategories = [
        {
          id: 1,
          category_id: 2,
          name: 'Football',
          slug: 'football',
          description: 'Football events',
          active: true
        }
      ];
      req.query = { categoryId: '2' };
      mockSubcategoryService.getAllSubcategories.mockResolvedValue(mockSubcategories);

      await getAllSubcategories(req, res, next);

      expect(mockSubcategoryService.getAllSubcategories).toHaveBeenCalledWith('2');
      expect(res.json).toHaveBeenCalledWith({ subcategories: mockSubcategories });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockSubcategoryService.getAllSubcategories.mockRejectedValue(error);

      await getAllSubcategories(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getSubcategoryById', () => {
    it('should get subcategory by ID successfully', async () => {
      const mockSubcategory = {
        id: 1,
        category_id: 1,
        name: 'Rock Music',
        slug: 'rock-music',
        description: 'Rock music events',
        active: true
      };
      req.params = { id: '1' };
      mockSubcategoryService.getSubcategoryById.mockResolvedValue(mockSubcategory);

      await getSubcategoryById(req, res, next);

      expect(mockSubcategoryService.getSubcategoryById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ subcategory: mockSubcategory });
    });

    it('should handle subcategory not found', async () => {
      req.params = { id: '999' };
      mockSubcategoryService.getSubcategoryById.mockResolvedValue(null);

      await getSubcategoryById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Subcategory not found' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      req.params = { id: '1' };
      mockSubcategoryService.getSubcategoryById.mockRejectedValue(error);

      await getSubcategoryById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createSubcategory', () => {
    const subcategoryData = {
      category_id: 1,
      name: 'Electronic Music',
      slug: 'electronic-music',
      description: 'Electronic music events'
    };

    it('should create subcategory successfully', async () => {
      const mockSubcategory = { id: 1, ...subcategoryData, active: true };
      req.body = subcategoryData;
      mockSubcategoryService.createSubcategory.mockResolvedValue(mockSubcategory);

      await createSubcategory(req, res, next);

      expect(mockSubcategoryService.createSubcategory).toHaveBeenCalledWith(subcategoryData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ subcategory: mockSubcategory });
    });

    it('should handle missing required fields', async () => {
      const error = new Error('Category ID, name, and slug are required');
      req.body = { name: 'Missing category_id and slug' };
      mockSubcategoryService.createSubcategory.mockRejectedValue(error);

      await createSubcategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    it('should handle service error', async () => {
      const error = new Error('Duplicate slug for category');
      req.body = subcategoryData;
      mockSubcategoryService.createSubcategory.mockRejectedValue(error);

      await createSubcategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateSubcategory', () => {
    const updateData = {
      category_id: 1,
      name: 'Updated Electronic Music',
      slug: 'updated-electronic-music',
      description: 'Updated electronic music events',
      active: false
    };

    it('should update subcategory successfully', async () => {
      const mockSubcategory = { id: 1, ...updateData };
      req.params = { id: '1' };
      req.body = updateData;
      mockSubcategoryService.updateSubcategory.mockResolvedValue(mockSubcategory);

      await updateSubcategory(req, res, next);

      expect(mockSubcategoryService.updateSubcategory).toHaveBeenCalledWith('1', updateData);
      expect(res.json).toHaveBeenCalledWith({ subcategory: mockSubcategory });
    });

    it('should handle missing required fields', async () => {
      const error = new Error('Category ID, name, and slug are required');
      req.params = { id: '1' };
      req.body = { description: 'Missing required fields' };
      mockSubcategoryService.updateSubcategory.mockRejectedValue(error);

      await updateSubcategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    it('should handle subcategory not found', async () => {
      const error = new Error('Subcategory not found');
      req.params = { id: '999' };
      req.body = updateData;
      mockSubcategoryService.updateSubcategory.mockRejectedValue(error);

      await updateSubcategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    it('should handle service error', async () => {
      const error = new Error('Database constraint violation');
      req.params = { id: '1' };
      req.body = updateData;
      mockSubcategoryService.updateSubcategory.mockRejectedValue(error);

      await updateSubcategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteSubcategory', () => {
    it('should delete subcategory successfully', async () => {
      req.params = { id: '1' };
      mockSubcategoryService.deleteSubcategory.mockResolvedValue();

      await deleteSubcategory(req, res, next);

      expect(mockSubcategoryService.deleteSubcategory).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Subcategory deleted successfully' });
    });

    it('should handle subcategory not found', async () => {
      const error = new Error('Subcategory not found');
      req.params = { id: '999' };
      mockSubcategoryService.deleteSubcategory.mockRejectedValue(error);

      await deleteSubcategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    it('should handle service error', async () => {
      const error = new Error('Cannot delete subcategory with existing events');
      req.params = { id: '1' };
      mockSubcategoryService.deleteSubcategory.mockRejectedValue(error);

      await deleteSubcategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle foreign key constraint error', async () => {
      const error = new Error('Cannot delete subcategory: foreign key constraint');
      req.params = { id: '1' };
      mockSubcategoryService.deleteSubcategory.mockRejectedValue(error);

      await deleteSubcategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});