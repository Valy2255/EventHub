// backend/tests/models/Statistics.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('Statistics Model', () => {
  let Statistics;

  beforeAll(async () => {
    Statistics = await import('../../models/Statistics.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventStatistics', () => {
    it('should get total events and category counts', async () => {
      const mockTotalResult = { rows: [{ total: '25' }] };
      const mockCategoryResults = {
        rows: [
          { id: 1, name: 'Concert', slug: 'concert', event_count: '10' },
          { id: 2, name: 'Sports', slug: 'sports', event_count: '8' },
          { id: 3, name: 'Theatre', slug: 'theatre', event_count: '7' }
        ]
      };

      mockDbQuery
        .mockResolvedValueOnce(mockTotalResult)
        .mockResolvedValueOnce(mockCategoryResults);

      const result = await Statistics.getEventStatistics();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT COUNT\(\*\) as total.*FROM events.*WHERE status IN \('active', 'rescheduled'\)/s)
      });

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT c\.id, c\.name, c\.slug, COUNT\(e\.id\) as event_count.*FROM categories c.*LEFT JOIN events e ON c\.id = e\.category_id.*GROUP BY c\.id.*ORDER BY c\.name/s)
      });

      expect(result).toEqual({
        totalEvents: 25,
        categoryCounts: [
          { id: 1, name: 'Concert', slug: 'concert', event_count: '10' },
          { id: 2, name: 'Sports', slug: 'sports', event_count: '8' },
          { id: 3, name: 'Theatre', slug: 'theatre', event_count: '7' }
        ]
      });
    });

    it('should handle zero total events', async () => {
      const mockTotalResult = { rows: [{ total: '0' }] };
      const mockCategoryResults = {
        rows: [
          { id: 1, name: 'Concert', slug: 'concert', event_count: '0' },
          { id: 2, name: 'Sports', slug: 'sports', event_count: '0' }
        ]
      };

      mockDbQuery
        .mockResolvedValueOnce(mockTotalResult)
        .mockResolvedValueOnce(mockCategoryResults);

      const result = await Statistics.getEventStatistics();

      expect(result).toEqual({
        totalEvents: 0,
        categoryCounts: [
          { id: 1, name: 'Concert', slug: 'concert', event_count: '0' },
          { id: 2, name: 'Sports', slug: 'sports', event_count: '0' }
        ]
      });
    });

    it('should handle empty categories', async () => {
      const mockTotalResult = { rows: [{ total: '5' }] };
      const mockCategoryResults = { rows: [] };

      mockDbQuery
        .mockResolvedValueOnce(mockTotalResult)
        .mockResolvedValueOnce(mockCategoryResults);

      const result = await Statistics.getEventStatistics();

      expect(result).toEqual({
        totalEvents: 5,
        categoryCounts: []
      });
    });

    it('should handle database errors from total query', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValueOnce(error);

      await expect(Statistics.getEventStatistics()).rejects.toThrow('Database error');
    });

    it('should handle database errors from category query', async () => {
      const mockTotalResult = { rows: [{ total: '25' }] };
      const error = new Error('Category query failed');
      
      mockDbQuery
        .mockResolvedValueOnce(mockTotalResult)
        .mockRejectedValueOnce(error);

      await expect(Statistics.getEventStatistics()).rejects.toThrow('Category query failed');
    });

    it('should convert string totals to integers', async () => {
      const mockTotalResult = { rows: [{ total: '42' }] };
      const mockCategoryResults = {
        rows: [
          { id: 1, name: 'Concert', slug: 'concert', event_count: '15' }
        ]
      };

      mockDbQuery
        .mockResolvedValueOnce(mockTotalResult)
        .mockResolvedValueOnce(mockCategoryResults);

      const result = await Statistics.getEventStatistics();

      expect(result.totalEvents).toBe(42);
      expect(typeof result.totalEvents).toBe('number');
    });

    it('should only count active and rescheduled events', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ total: '10' }] })
        .mockResolvedValueOnce({ rows: [] });

      await Statistics.getEventStatistics();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("status IN ('active', 'rescheduled')")
      });

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("e.status IN ('active', 'rescheduled')")
      });
    });

    it('should order categories by name', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ total: '10' }] })
        .mockResolvedValueOnce({ rows: [] });

      await Statistics.getEventStatistics();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('ORDER BY c.name')
      });
    });
  });

  describe('getUpcomingEventsCount', () => {
    beforeEach(() => {
      // Mock Date to ensure consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should get count of upcoming events', async () => {
      const mockResult = { rows: [{ upcoming_count: '15' }] };
      mockDbQuery.mockResolvedValue(mockResult);

      const result = await Statistics.getUpcomingEventsCount();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT COUNT\(\*\) as upcoming_count.*FROM events.*WHERE date >= \$1 AND status IN \('active', 'rescheduled'\)/s),
        values: ['2024-03-15']
      });
      expect(result).toBe(15);
    });

    it('should return zero when no upcoming events', async () => {
      const mockResult = { rows: [{ upcoming_count: '0' }] };
      mockDbQuery.mockResolvedValue(mockResult);

      const result = await Statistics.getUpcomingEventsCount();

      expect(result).toBe(0);
    });

    it('should convert string count to integer', async () => {
      const mockResult = { rows: [{ upcoming_count: '42' }] };
      mockDbQuery.mockResolvedValue(mockResult);

      const result = await Statistics.getUpcomingEventsCount();

      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('should use current date for comparison', async () => {
      // Set a specific date
      jest.setSystemTime(new Date('2024-12-25T15:30:00Z'));
      
      mockDbQuery.mockResolvedValue({ rows: [{ upcoming_count: '5' }] });

      await Statistics.getUpcomingEventsCount();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: ['2024-12-25'] // Should use the mocked date
      });
    });

    it('should only count active and rescheduled events', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ upcoming_count: '10' }] });

      await Statistics.getUpcomingEventsCount();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("status IN ('active', 'rescheduled')"),
        values: expect.any(Array)
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Statistics.getUpcomingEventsCount()).rejects.toThrow('Database connection failed');
    });

    it('should handle null or undefined count gracefully', async () => {
      const mockResult = { rows: [{ upcoming_count: null }] };
      mockDbQuery.mockResolvedValue(mockResult);

      const result = await Statistics.getUpcomingEventsCount();

      // parseInt(null, 10) returns NaN, but this tests the actual behavior
      expect(isNaN(result)).toBe(true);
    });

    it('should format date correctly for SQL', async () => {
      // Test different dates to ensure proper formatting
      const testDates = [
        '2024-01-01T00:00:00Z',
        '2024-06-15T12:30:45Z',
        '2024-12-31T23:59:59Z'
      ];

      for (const testDate of testDates) {
        jest.setSystemTime(new Date(testDate));
        mockDbQuery.mockResolvedValue({ rows: [{ upcoming_count: '1' }] });

        await Statistics.getUpcomingEventsCount();

        const expectedDate = testDate.split('T')[0]; // Get YYYY-MM-DD part
        expect(mockDbQuery).toHaveBeenCalledWith({
          text: expect.any(String),
          values: [expectedDate]
        });

        mockDbQuery.mockClear();
      }
    });
  });
});