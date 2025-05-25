// backend/tests/models/Category.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('Category Model', () => {
  let Category;

  beforeAll(async () => {
    Category = await import('../../models/Category.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all categories ordered by name', async () => {
      const mockCategories = [
        { id: 1, name: 'Concert', slug: 'concert' },
        { id: 2, name: 'Sports', slug: 'sports' }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockCategories });

      const result = await Category.getAll();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM categories ORDER BY name'
      });
      expect(result).toEqual(mockCategories);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Category.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find category by ID', async () => {
      const mockCategory = { id: 1, name: 'Concert', slug: 'concert' };
      mockDbQuery.mockResolvedValue({ rows: [mockCategory] });

      const result = await Category.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM categories WHERE id = $1',
        values: [1]
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return undefined for non-existent category', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Category.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    const mockCategoryData = {
      name: 'Theatre',
      slug: 'theatre',
      description: 'Theatre events'
    };

    it('should create a new category', async () => {
      const mockCreated = { id: 1, ...mockCategoryData };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await Category.create(mockCategoryData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: `INSERT INTO categories(name, slug, description) 
           VALUES($1, $2, $3) 
           RETURNING *`,
        values: ['Theatre', 'theatre', 'Theatre events']
      });
      expect(result).toEqual(mockCreated);
    });

    it('should create category with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockCreated = { id: 1, ...mockCategoryData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await Category.create(mockCategoryData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: `INSERT INTO categories(name, slug, description) 
           VALUES($1, $2, $3) 
           RETURNING *`,
        values: ['Theatre', 'theatre', 'Theatre events']
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    const mockUpdateData = {
      name: 'Updated Theatre',
      slug: 'updated-theatre',
      description: 'Updated description'
    };

    it('should update a category', async () => {
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Category.update(1, mockUpdateData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: `UPDATE categories 
           SET name = $1, slug = $2, description = $3 
           WHERE id = $4 
           RETURNING *`,
        values: ['Updated Theatre', 'updated-theatre', 'Updated description', 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should update category with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockClient.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Category.update(1, mockUpdateData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: `UPDATE categories 
           SET name = $1, slug = $2, description = $3 
           WHERE id = $4 
           RETURNING *`,
        values: ['Updated Theatre', 'updated-theatre', 'Updated description', 1]
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const mockDeleted = { id: 1, name: 'Concert' };
      mockDbQuery.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Category.remove(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'DELETE FROM categories WHERE id = $1 RETURNING *',
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should delete category with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockDeleted = { id: 1, name: 'Concert' };
      mockClient.query.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Category.remove(1, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: 'DELETE FROM categories WHERE id = $1 RETURNING *',
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('findBySlug', () => {
    it('should find category by slug', async () => {
      const mockCategory = { id: 1, name: 'Concert', slug: 'concert' };
      mockDbQuery.mockResolvedValue({ rows: [mockCategory] });

      const result = await Category.findBySlug('concert');

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM categories WHERE slug = $1',
        values: ['concert']
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return undefined for non-existent slug', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Category.findBySlug('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getEvents', () => {
    it('should get events for a category', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Test Event',
          category_name: 'Concert',
          subcategory_name: 'Rock',
          rating: 4.5,
          review_count: 10,
          is_rescheduled: false
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockEvents });

      const result = await Category.getEvents(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT.*FROM events e.*WHERE c\.id = \$1/s),
        values: [1]
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getFeaturedEvents', () => {
    it('should get featured events for a category', async () => {
      const mockFeaturedEvents = [
        {
          id: 1,
          name: 'Featured Event',
          rating: 4.8,
          review_count: 15,
          category_name: 'Concert',
          subcategory_name: 'Rock'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockFeaturedEvents });

      const result = await Category.getFeaturedEvents(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT.*FROM events e.*WHERE c\.id = \$1.*AND er\.avg_rating >= 4\.0/s),
        values: [1]
      });
      expect(result).toEqual(mockFeaturedEvents);
    });
  });

  describe('getEventsPaginated', () => {
    it('should get paginated events for a category', async () => {
      const mockEvents = [{ id: 1, name: 'Event 1' }];
      const mockCount = [{ total: '5' }];

      mockDbQuery
        .mockResolvedValueOnce({ rows: mockEvents })
        .mockResolvedValueOnce({ rows: mockCount });

      const result = await Category.getEventsPaginated(1, 10, 0);

      expect(mockDbQuery).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        events: mockEvents,
        totalCount: 5,
        totalPages: 1
      });
    });
  });

  describe('getAllWithEventCounts', () => {
    it('should get all categories with event counts', async () => {
      const mockCategoriesWithCounts = [
        { id: 1, name: 'Concert', event_count: 5 },
        { id: 2, name: 'Sports', event_count: 3 }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockCategoriesWithCounts });

      const result = await Category.getAllWithEventCounts();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT.*c\.\*.*COALESCE\(event_counts\.event_count, 0\)/s)
      });
      expect(result).toEqual(mockCategoriesWithCounts);
    });
  });

  describe('getTotalEventsCount', () => {
    it('should get total events count', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ total_events: '25' }] });

      const result = await Category.getTotalEventsCount();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT COUNT\(\*\) as total_events\s+FROM events\s+WHERE status IN \('active', 'rescheduled'\)/s)
      });
      expect(result).toBe(25);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should get upcoming events with default limit', async () => {
      const mockUpcomingEvents = [
        {
          id: 1,
          name: 'Upcoming Event',
          date: '2024-12-25',
          category_name: 'Concert',
          category_slug: 'concert'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockUpcomingEvents });

      const result = await Category.getUpcomingEvents();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT.*FROM events e.*WHERE e\.date >= CURRENT_DATE.*LIMIT \$1/s),
        values: [6]
      });
      expect(result).toEqual(mockUpcomingEvents);
    });

    it('should get upcoming events with custom limit', async () => {
      const mockUpcomingEvents = [];
      mockDbQuery.mockResolvedValue({ rows: mockUpcomingEvents });

      const result = await Category.getUpcomingEvents(10);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/LIMIT \$1/s),
        values: [10]
      });
      expect(result).toEqual(mockUpcomingEvents);
    });
  });
});