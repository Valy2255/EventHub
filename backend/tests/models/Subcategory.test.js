// backend/tests/models/Subcategory.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('Subcategory Model', () => {
  let Subcategory;
  let consoleErrorSpy;

  beforeAll(async () => {
    Subcategory = await import('../../models/Subcategory.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getAll', () => {
    it('should get all subcategories when no categoryId provided', async () => {
      const mockSubcategories = [
        {
          id: 1,
          category_id: 1,
          name: 'Rock',
          slug: 'rock',
          description: 'Rock music events',
          category_name: 'Music'
        },
        {
          id: 2,
          category_id: 1,
          name: 'Jazz',
          slug: 'jazz',
          description: 'Jazz music events',
          category_name: 'Music'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockSubcategories });

      const result = await Subcategory.getAll();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT s.*, c.name as category_name FROM subcategories s JOIN categories c ON s.category_id = c.id ORDER BY c.name, s.name'
      });
      expect(result).toEqual(mockSubcategories);
    });

    it('should get subcategories for specific category', async () => {
      const mockSubcategories = [
        {
          id: 1,
          category_id: 1,
          name: 'Rock',
          slug: 'rock',
          description: 'Rock music events'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockSubcategories });

      const result = await Subcategory.getAll(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name',
        values: [1]
      });
      expect(result).toEqual(mockSubcategories);
    });

    it('should return empty array when no subcategories found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Subcategory.getAll(1);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find subcategory by ID', async () => {
      const mockSubcategory = {
        id: 1,
        category_id: 1,
        name: 'Rock',
        slug: 'rock',
        description: 'Rock music events'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockSubcategory] });

      const result = await Subcategory.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM subcategories WHERE id = $1',
        values: [1]
      });
      expect(result).toEqual(mockSubcategory);
    });

    it('should return undefined for non-existent subcategory', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Subcategory.findById(999);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    const mockSubcategoryData = {
      category_id: 1,
      name: 'Rock',
      slug: 'rock',
      description: 'Rock music events'
    };

    it('should create a new subcategory', async () => {
      const mockCreated = {
        id: 1,
        ...mockSubcategoryData,
        active: true,
        created_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await Subcategory.create(mockSubcategoryData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/INSERT INTO subcategories\(category_id, name, slug, description\)\s+VALUES\(\$1, \$2, \$3, \$4\)\s+RETURNING \*/s),
        values: [1, 'Rock', 'rock', 'Rock music events']
      });
      expect(result).toEqual(mockCreated);
    });

    it('should create subcategory with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockCreated = { id: 1, ...mockSubcategoryData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await Subcategory.create(mockSubcategoryData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(/INSERT INTO subcategories\(category_id, name, slug, description\)\s+VALUES\(\$1, \$2, \$3, \$4\)\s+RETURNING \*/s),
        values: [1, 'Rock', 'rock', 'Rock music events']
      });
      expect(result).toEqual(mockCreated);
    });

    it('should handle database errors', async () => {
      const error = new Error('Insert failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.create(mockSubcategoryData)).rejects.toThrow('Insert failed');
    });
  });

  describe('update', () => {
    const mockUpdateData = {
      category_id: 1,
      name: 'Updated Rock',
      slug: 'updated-rock',
      description: 'Updated rock music events',
      active: true
    };

    it('should update a subcategory', async () => {
      const mockUpdated = {
        id: 1,
        ...mockUpdateData,
        updated_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Subcategory.update(1, mockUpdateData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE subcategories\s+SET category_id = \$1, name = \$2, slug = \$3, description = \$4, active = \$5\s+WHERE id = \$6\s+RETURNING \*/s),
        values: [1, 'Updated Rock', 'updated-rock', 'Updated rock music events', true, 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should update subcategory with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockClient.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Subcategory.update(1, mockUpdateData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE subcategories\s+SET category_id = \$1, name = \$2, slug = \$3, description = \$4, active = \$5\s+WHERE id = \$6\s+RETURNING \*/s),
        values: [1, 'Updated Rock', 'updated-rock', 'Updated rock music events', true, 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should return undefined when subcategory not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Subcategory.update(999, mockUpdateData);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Update failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.update(1, mockUpdateData)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should delete a subcategory', async () => {
      const mockDeleted = {
        id: 1,
        category_id: 1,
        name: 'Rock',
        slug: 'rock'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Subcategory.remove(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'DELETE FROM subcategories WHERE id = $1 RETURNING *',
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should delete subcategory with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockDeleted = { id: 1, name: 'Rock' };
      mockClient.query.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Subcategory.remove(1, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: 'DELETE FROM subcategories WHERE id = $1 RETURNING *',
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should return undefined when subcategory not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Subcategory.remove(999);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Delete failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.remove(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('findBySlug', () => {
    it('should find subcategory by category ID and slug', async () => {
      const mockSubcategory = {
        id: 1,
        category_id: 1,
        name: 'Rock',
        slug: 'rock',
        description: 'Rock music events'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockSubcategory] });

      const result = await Subcategory.findBySlug(1, 'rock');

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM subcategories WHERE category_id = $1 AND slug = $2',
        values: [1, 'rock']
      });
      expect(result).toEqual(mockSubcategory);
    });

    it('should return undefined for non-existent slug', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Subcategory.findBySlug(1, 'non-existent');

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.findBySlug(1, 'rock')).rejects.toThrow('Database error');
    });
  });

  describe('getEvents', () => {
    it('should get events for a subcategory', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Rock Concert',
          subcategory_id: 1,
          status: 'active',
          is_rescheduled: false,
          date: '2024-04-15',
          original_date: null,
          original_time: null
        },
        {
          id: 2,
          name: 'Rock Festival',
          subcategory_id: 1,
          status: 'rescheduled',
          is_rescheduled: true,
          date: '2024-04-20',
          original_date: '2024-04-18',
          original_time: '19:00'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockEvents });

      const result = await Subcategory.getEvents(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT e\.\*,\s+CASE WHEN e\.status = 'rescheduled' THEN true ELSE false END AS is_rescheduled,\s+e\.original_date, e\.original_time\s+FROM events e\s+WHERE e\.subcategory_id = \$1\s+AND e\.status IN \('active', 'rescheduled'\)\s+ORDER BY e\.date ASC/s),
        values: [1]
      });
      expect(result).toEqual(mockEvents);
    });

    it('should return empty array for subcategory with no events', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Subcategory.getEvents(1);

      expect(result).toEqual([]);
    });

    it('should only return active and rescheduled events', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Subcategory.getEvents(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("status IN ('active', 'rescheduled')"),
        values: [1]
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.getEvents(1)).rejects.toThrow('Database error');
    });
  });

  describe('getAllWithEventCounts', () => {
    it('should get subcategories with event counts for a category', async () => {
      const mockSubcategoriesWithCounts = [
        {
          id: 1,
          category_id: 1,
          name: 'Rock',
          slug: 'rock',
          event_count: '5'
        },
        {
          id: 2,
          category_id: 1,
          name: 'Jazz',
          slug: 'jazz',
          event_count: '3'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockSubcategoriesWithCounts });

      const result = await Subcategory.getAllWithEventCounts(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT s\.\*, COUNT\(e\.id\) as event_count\s+FROM subcategories s\s+LEFT JOIN events e ON s\.id = e\.subcategory_id AND e\.status IN \('active', 'rescheduled'\)\s+WHERE s\.category_id = \$1\s+GROUP BY s\.id\s+ORDER BY s\.name ASC/s),
        values: [1]
      });
      expect(result).toEqual(mockSubcategoriesWithCounts);
    });

    it('should include subcategories with zero events', async () => {
      const mockSubcategoriesWithCounts = [
        {
          id: 1,
          name: 'Rock',
          event_count: '0'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockSubcategoriesWithCounts });

      const result = await Subcategory.getAllWithEventCounts(1);

      expect(result).toEqual(mockSubcategoriesWithCounts);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Subcategory.getAllWithEventCounts(1)).rejects.toThrow('Database error');
    });
  });
});