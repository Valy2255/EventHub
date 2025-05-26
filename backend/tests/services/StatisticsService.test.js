import { jest } from "@jest/globals";

// Mock models
jest.unstable_mockModule("../../models/Statistics.js", () => ({
  getEventStatistics: jest.fn(),
  getUpcomingEventsCount: jest.fn(),
}));

describe("StatisticsService", () => {
  let StatisticsService;
  let StatisticsModel;
  let statisticsService;

  beforeAll(async () => {
    StatisticsModel = await import("../../models/Statistics.js");
    const { StatisticsService: StatisticsServiceClass } = await import(
      "../../services/StatisticsService.js"
    );
    StatisticsService = StatisticsServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    statisticsService = new StatisticsService();
  });

  describe("getEventStatistics", () => {
    it("should return event statistics", async () => {
      const mockStatistics = {
        totalEvents: 50,
        activeEvents: 30,
        completedEvents: 15,
        cancelledEvents: 5,
        totalTicketsSold: 1250,
        totalRevenue: 75000,
        averageTicketsPerEvent: 25,
        topCategories: [
          { category: "Music", count: 20 },
          { category: "Sports", count: 15 },
          { category: "Technology", count: 10 },
        ],
        monthlyStats: [
          { month: "2025-04", events: 12, revenue: 18000 },
          { month: "2025-05", events: 18, revenue: 27000 },
        ],
      };

      StatisticsModel.getEventStatistics.mockResolvedValue(mockStatistics);

      const result = await statisticsService.getEventStatistics();

      expect(StatisticsModel.getEventStatistics).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStatistics);
    });

    it("should handle empty statistics", async () => {
      const mockEmptyStatistics = {
        totalEvents: 0,
        activeEvents: 0,
        completedEvents: 0,
        cancelledEvents: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
        averageTicketsPerEvent: 0,
        topCategories: [],
        monthlyStats: [],
      };

      StatisticsModel.getEventStatistics.mockResolvedValue(mockEmptyStatistics);

      const result = await statisticsService.getEventStatistics();

      expect(StatisticsModel.getEventStatistics).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEmptyStatistics);
    });

    it("should handle model errors", async () => {
      const errorMessage = "Database connection failed";
      StatisticsModel.getEventStatistics.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(statisticsService.getEventStatistics()).rejects.toThrow(
        errorMessage
      );
      expect(StatisticsModel.getEventStatistics).toHaveBeenCalledTimes(1);
    });
  });

  describe("getUpcomingEventsCount", () => {
    it("should return upcoming events count", async () => {
      const mockCount = {
        count: 25,
        breakdown: {
          thisWeek: 5,
          thisMonth: 12,
          nextMonth: 8,
        },
        byCategory: [
          { category: "Music", count: 10 },
          { category: "Sports", count: 8 },
          { category: "Technology", count: 7 },
        ],
      };

      StatisticsModel.getUpcomingEventsCount.mockResolvedValue(mockCount);

      const result = await statisticsService.getUpcomingEventsCount();

      expect(StatisticsModel.getUpcomingEventsCount).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCount);
    });

    it("should handle zero upcoming events", async () => {
      const mockZeroCount = {
        count: 0,
        breakdown: {
          thisWeek: 0,
          thisMonth: 0,
          nextMonth: 0,
        },
        byCategory: [],
      };

      StatisticsModel.getUpcomingEventsCount.mockResolvedValue(mockZeroCount);

      const result = await statisticsService.getUpcomingEventsCount();

      expect(StatisticsModel.getUpcomingEventsCount).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockZeroCount);
    });

    it("should handle simple count response", async () => {
      const mockSimpleCount = 15;

      StatisticsModel.getUpcomingEventsCount.mockResolvedValue(mockSimpleCount);

      const result = await statisticsService.getUpcomingEventsCount();

      expect(StatisticsModel.getUpcomingEventsCount).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockSimpleCount);
    });

    it("should handle model errors", async () => {
      const errorMessage = "Failed to fetch upcoming events";
      StatisticsModel.getUpcomingEventsCount.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(statisticsService.getUpcomingEventsCount()).rejects.toThrow(
        errorMessage
      );
      expect(StatisticsModel.getUpcomingEventsCount).toHaveBeenCalledTimes(1);
    });
  });
});
