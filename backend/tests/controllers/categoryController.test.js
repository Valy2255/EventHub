// tests/controllers/categoryController.test.js

import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the CategoryService
const mockCategoryService = {
  getAllCategories: jest.fn(),
  getCategoryById: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  getEventsByCategory: jest.fn(),
  getCategoryBySlug: jest.fn(),
  getUpcomingEvents: jest.fn()
};

jest.unstable_mockModule('../../services/CategoryService.js', () => ({
  CategoryService: jest.fn().mockImplementation(() => mockCategoryService)
}));

const { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getEventsByCategory,
  getCategoryBySlug,
  getUpcomingEvents
} = await import('../../controllers/categoryController.js');

describe('CategoryController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockCategoryService).forEach(mock => mock.mockReset());
  });

  describe('getAllCategories', () => {
    it('should get all categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: 'Music', slug: 'music', description: 'Music events' },
        { id: 2, name: 'Sports', slug: 'sports', description: 'Sports events' },
        { id: 3, name: 'Technology', slug: 'technology', description: 'Tech events' }
      ];
      mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);

      await getAllCategories(req, res, next);

      expect(mockCategoryService.getAllCategories).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ categories: mockCategories });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockCategoryService.getAllCategories.mockRejectedValue(error);

      await getAllCategories(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCategoryById', () => {
    it('should get category by ID successfully', async () => {
      const mockCategory = { id: 1, name: 'Music', slug: 'music', description: 'Music events' };
      req.params = { id: '1' };
      mockCategoryService.getCategoryById.mockResolvedValue(mockCategory);

      await getCategoryById(req, res, next);

      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ category: mockCategory });
    });

    it('should handle category not found', async () => {
      req.params = { id: '999' };
      mockCategoryService.getCategoryById.mockResolvedValue(null);

      await getCategoryById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('createCategory', () => {
    const categoryData = {
      name: 'Entertainment',
      slug: 'entertainment',
      description: 'Entertainment events and shows'
    };

    it('should create category successfully', async () => {
      const mockCategory = { id: 1, ...categoryData };
      req.body = categoryData;
      mockCategoryService.createCategory.mockResolvedValue(mockCategory);

      await createCategory(req, res, next);

      expect(mockCategoryService.createCategory).toHaveBeenCalledWith(categoryData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ category: mockCategory });
    });

    it('should handle missing required fields', async () => {
      req.body = { description: 'Missing name and slug' };

      await createCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name and slug are required' });
    });

    it('should handle service error', async () => {
      const error = new Error('Duplicate slug');
      req.body = categoryData;
      mockCategoryService.createCategory.mockRejectedValue(error);

      await createCategory(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCategory', () => {
    const updateData = {
      name: 'Updated Music',
      slug: 'updated-music',
      description: 'Updated music events'
    };

    it('should update category successfully', async () => {
      const mockCategory = { id: 1, ...updateData };
      req.params = { id: '1' };
      req.body = updateData;
      mockCategoryService.updateCategory.mockResolvedValue(mockCategory);

      await updateCategory(req, res, next);

      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith('1', updateData);
      expect(res.json).toHaveBeenCalledWith({ category: mockCategory });
    });

    it('should handle missing required fields', async () => {
      req.params = { id: '1' };
      req.body = { description: 'Missing name and slug' };

      await updateCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name and slug are required' });
    });

    it('should handle category not found', async () => {
      req.params = { id: '999' };
      req.body = updateData;
      mockCategoryService.updateCategory.mockResolvedValue(null);

      await updateCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const mockCategory = { id: 1, name: 'Music' };
      req.params = { id: '1' };
      mockCategoryService.deleteCategory.mockResolvedValue(mockCategory);

      await deleteCategory(req, res, next);

      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Category deleted successfully' });
    });

    it('should handle category not found', async () => {
      req.params = { id: '999' };
      mockCategoryService.deleteCategory.mockResolvedValue(null);

      await deleteCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('getEventsByCategory', () => {
    it('should get events by category successfully', async () => {
      const mockResult = {
        category: { id: 1, name: 'Music', slug: 'music' },
        events: [
          { id: 1, title: 'Rock Concert', date: '2024-12-31' },
          { id: 2, title: 'Jazz Festival', date: '2024-12-25' }
        ],
        total: 2
      };
      req.params = { slug: 'music' };
      mockCategoryService.getEventsByCategory.mockResolvedValue(mockResult);

      await getEventsByCategory(req, res, next);

      expect(mockCategoryService.getEventsByCategory).toHaveBeenCalledWith('music');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle category not found', async () => {
      const error = new Error('Category not found');
      req.params = { slug: 'nonexistent' };
      mockCategoryService.getEventsByCategory.mockRejectedValue(error);

      await getEventsByCategory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('getCategoryBySlug', () => {
    it('should get category by slug successfully', async () => {
      const mockCategory = { id: 1, name: 'Music', slug: 'music', description: 'Music events' };
      req.params = { slug: 'music' };
      mockCategoryService.getCategoryBySlug.mockResolvedValue(mockCategory);

      await getCategoryBySlug(req, res, next);

      expect(mockCategoryService.getCategoryBySlug).toHaveBeenCalledWith('music');
      expect(res.json).toHaveBeenCalledWith({ category: mockCategory });
    });

    it('should handle category not found', async () => {
      const error = new Error('Category not found');
      req.params = { slug: 'nonexistent' };
      mockCategoryService.getCategoryBySlug.mockRejectedValue(error);

      await getCategoryBySlug(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('getUpcomingEvents', () => {
    it('should get upcoming events successfully', async () => {
      const mockResult = {
        events: [
          { id: 1, title: 'Upcoming Event 1', date: '2024-12-31' },
          { id: 2, title: 'Upcoming Event 2', date: '2025-01-15' }
        ],
        total: 2
      };
      req.query = { limit: '6' };
      mockCategoryService.getUpcomingEvents.mockResolvedValue(mockResult);

      await getUpcomingEvents(req, res, next);

      expect(mockCategoryService.getUpcomingEvents).toHaveBeenCalledWith(6);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should use default limit when not provided', async () => {
      const mockResult = { events: [], total: 0 };
      mockCategoryService.getUpcomingEvents.mockResolvedValue(mockResult);

      await getUpcomingEvents(req, res, next);

      expect(mockCategoryService.getUpcomingEvents).toHaveBeenCalledWith(6);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockCategoryService.getUpcomingEvents.mockRejectedValue(error);

      await getUpcomingEvents(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});