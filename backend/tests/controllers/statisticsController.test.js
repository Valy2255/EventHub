// tests/controllers/statisticsController.test.js

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

// Mock the StatisticsService
const mockStatisticsService = {
  getEventStatistics: jest.fn(),
  getUpcomingEventsCount: jest.fn()
};

jest.unstable_mockModule('../../services/StatisticsService.js', () => ({
  StatisticsService: jest.fn().mockImplementation(() => mockStatisticsService)
}));

const { getEventStatistics, getUpcomingEventsCount } = await import('../../controllers/statisticsController.js');

describe('StatisticsController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockStatisticsService).forEach(mock => mock.mockReset());
  });

  describe('getEventStatistics', () => {
    it('should get event statistics successfully', async () => {
      const mockStatistics = {
        totalEvents: 150,
        totalUpcomingEvents: 45,
        totalPastEvents: 105,
        categoryCounts: [
          { category_name: 'Music', event_count: 60 },
          { category_name: 'Sports', event_count: 40 },
          { category_name: 'Technology', event_count: 30 },
          { category_name: 'Arts', event_count: 20 }
        ],
        monthlyDistribution: [
          { month: 'January', count: 12 },
          { month: 'February', count: 15 },
          { month: 'March', count: 18 },
          { month: 'April', count: 20 }
        ],
        popularVenues: [
          { venue_name: 'Grand Arena', event_count: 25 },
          { venue_name: 'City Hall', event_count: 20 },
          { venue_name: 'Convention Center', event_count: 15 }
        ]
      };
      mockStatisticsService.getEventStatistics.mockResolvedValue(mockStatistics);

      await getEventStatistics(req, res, next);

      expect(mockStatisticsService.getEventStatistics).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockStatistics);
    });

    it('should handle empty statistics', async () => {
      const mockStatistics = {
        totalEvents: 0,
        totalUpcomingEvents: 0,
        totalPastEvents: 0,
        categoryCounts: [],
        monthlyDistribution: [],
        popularVenues: []
      };
      mockStatisticsService.getEventStatistics.mockResolvedValue(mockStatistics);

      await getEventStatistics(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockStatistics);
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStatisticsService.getEventStatistics.mockRejectedValue(error);

      await getEventStatistics(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting event statistics:', error);
      expect(next).toHaveBeenCalledWith(error);
      
      consoleSpy.mockRestore();
    });

    it('should handle statistics with partial data', async () => {
      const mockStatistics = {
        totalEvents: 25,
        totalUpcomingEvents: 10,
        totalPastEvents: 15,
        categoryCounts: [
          { category_name: 'Music', event_count: 15 },
          { category_name: 'Sports', event_count: 10 }
        ],
        monthlyDistribution: [
          { month: 'December', count: 25 }
        ],
        popularVenues: [
          { venue_name: 'Local Theater', event_count: 25 }
        ]
      };
      mockStatisticsService.getEventStatistics.mockResolvedValue(mockStatistics);

      await getEventStatistics(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockStatistics);
    });
  });

  describe('getUpcomingEventsCount', () => {
    it('should get upcoming events count successfully', async () => {
      const mockCount = 42;
      mockStatisticsService.getUpcomingEventsCount.mockResolvedValue(mockCount);

      await getUpcomingEventsCount(req, res, next);

      expect(mockStatisticsService.getUpcomingEventsCount).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ upcomingCount: mockCount });
    });

    it('should handle zero upcoming events', async () => {
      const mockCount = 0;
      mockStatisticsService.getUpcomingEventsCount.mockResolvedValue(mockCount);

      await getUpcomingEventsCount(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ upcomingCount: 0 });
    });

    it('should handle large number of upcoming events', async () => {
      const mockCount = 999;
      mockStatisticsService.getUpcomingEventsCount.mockResolvedValue(mockCount);

      await getUpcomingEventsCount(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ upcomingCount: 999 });
    });

    it('should handle service error', async () => {
      const error = new Error('Database query failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStatisticsService.getUpcomingEventsCount.mockRejectedValue(error);

      await getUpcomingEventsCount(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith('Error getting upcoming events count:', error);
      expect(next).toHaveBeenCalledWith(error);
      
      consoleSpy.mockRestore();
    });

    it('should handle null count gracefully', async () => {
      mockStatisticsService.getUpcomingEventsCount.mockResolvedValue(null);

      await getUpcomingEventsCount(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ upcomingCount: null });
    });

    it('should handle undefined count gracefully', async () => {
      mockStatisticsService.getUpcomingEventsCount.mockResolvedValue(undefined);

      await getUpcomingEventsCount(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ upcomingCount: undefined });
    });
  });
});