import { jest } from "@jest/globals";

// Mock models using unstable_mockModule
jest.unstable_mockModule("../../models/Review.js", () => ({
  findByEventId: jest.fn(),
  findUserReview: jest.fn(),
  findById: jest.fn(), // Add this missing mock
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getReviewStats: jest.fn(),
}));

jest.unstable_mockModule("../../models/Ticket.js", () => ({
  findByUserAndEvent: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule("../../services/BaseService.js", () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  },
}));

// Mock models using unstable_mockModule
jest.unstable_mockModule("../../models/Review.js", () => ({
  findByEventId: jest.fn(),
  findUserReview: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getReviewStats: jest.fn(),
}));

jest.unstable_mockModule("../../models/Event.js", () => ({
  findById: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule("../../services/BaseService.js", () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  },
}));

describe("ReviewService", () => {
  let ReviewService;
  let ReviewModel;
  let EventModel;
  let reviewService;

  beforeAll(async () => {
    ReviewModel = await import("../../models/Review.js");
    EventModel = await import("../../models/Event.js");
    const { ReviewService: ReviewServiceClass } = await import(
      "../../services/ReviewService.js"
    );
    ReviewService = ReviewServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    reviewService = new ReviewService();
  });

  describe("getEventReviews", () => {
    it("should return event reviews with average rating", async () => {
      const mockReviews = [
        {
          id: 1,
          rating: 5,
          comment: "Great!",
          user_name: "John",
          created_at: "2024-01-01",
        },
        {
          id: 2,
          rating: 4,
          comment: "Good",
          user_name: "Jane",
          created_at: "2024-01-02",
        },
      ];

      ReviewModel.findByEventId.mockResolvedValue(mockReviews);

      const result = await reviewService.getEventReviews(1);

      expect(ReviewModel.findByEventId).toHaveBeenCalledWith(1);
      expect(result.reviews).toEqual(mockReviews);
      expect(result.count).toBe(2);
      expect(result.averageRating).toBe("4.5");
    });

    it("should return empty reviews with zero average for no reviews", async () => {
      ReviewModel.findByEventId.mockResolvedValue([]);

      const result = await reviewService.getEventReviews(1);

      expect(result.reviews).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.averageRating).toBe(0);
    });

    it("should handle single review correctly", async () => {
      const mockReviews = [
        { id: 1, rating: 5, comment: "Amazing!", user_name: "John" },
      ];

      ReviewModel.findByEventId.mockResolvedValue(mockReviews);

      const result = await reviewService.getEventReviews(1);

      expect(result.averageRating).toBe("5.0");
      expect(result.count).toBe(1);
    });

    it("should calculate correct average for multiple ratings", async () => {
      const mockReviews = [
        { id: 1, rating: 3, comment: "Okay" },
        { id: 2, rating: 5, comment: "Great!" },
        { id: 3, rating: 4, comment: "Good" },
        { id: 4, rating: 2, comment: "Poor" },
      ];

      ReviewModel.findByEventId.mockResolvedValue(mockReviews);

      const result = await reviewService.getEventReviews(1);

      expect(result.averageRating).toBe("3.5");
      expect(result.count).toBe(4);
    });

    it("should handle database errors gracefully", async () => {
      ReviewModel.findByEventId.mockRejectedValue(new Error("Database error"));

      await expect(reviewService.getEventReviews(1)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("createReview", () => {
    it("should create review successfully", async () => {
      const reviewData = { rating: 5, comment: "Excellent!" };
      const userInfo = { name: "John Doe", profile_image: "avatar.jpg" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };
      const createdReview = {
        id: 1,
        rating: 5,
        comment: "Excellent!",
        user_id: 1,
        event_id: 1,
        created_at: "2024-01-01",
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(
        1,
        1,
        reviewData,
        userInfo
      );

      expect(ReviewModel.findUserReview).toHaveBeenCalledWith(1, 1);
      expect(EventModel.findById).toHaveBeenCalledWith(1);
      expect(ReviewModel.create).toHaveBeenCalledWith(
        {
          user_id: 1,
          event_id: 1,
          rating: 5,
          comment: "Excellent!",
        },
        undefined
      );
      expect(result.user_name).toBe("John Doe");
      expect(result.rating).toBe(5);
    });

    it("should throw error if event has not taken place yet", async () => {
      const reviewData = { rating: 5, comment: "Great!" };
      const userInfo = { name: "John Doe" };
      const futureEvent = { id: 1, date: new Date("2030-01-01") };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(futureEvent);

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow(
        "You can only review events that have already taken place"
      );
    });

    it("should throw error if user already reviewed the event", async () => {
      const reviewData = { rating: 5, comment: "Great!" };
      const userInfo = { name: "John Doe" };
      const existingReview = { id: 1, user_id: 1, event_id: 1, rating: 4 };

      ReviewModel.findUserReview.mockResolvedValue(existingReview);

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow("You have already reviewed this event");
    });

    it("should throw error for invalid rating", async () => {
      const reviewData = { rating: 6, comment: "Great!" };
      const userInfo = { name: "John Doe" };

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should throw error for missing rating", async () => {
      const reviewData = { comment: "Great!" };
      const userInfo = { name: "John Doe" };

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should throw error for zero rating", async () => {
      const reviewData = { rating: 0, comment: "Great!" };
      const userInfo = { name: "John Doe" };

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should create review without comment", async () => {
      const reviewData = { rating: 4 };
      const userInfo = { name: "Jane Doe" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };
      const createdReview = {
        id: 1,
        rating: 4,
        comment: undefined,
        user_id: 1,
        event_id: 1,
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(
        1,
        1,
        reviewData,
        userInfo
      );

      expect(result.rating).toBe(4);
      expect(result.comment).toBeUndefined();
    });

    it("should handle transaction client", async () => {
      const reviewData = { rating: 5, comment: "Excellent!" };
      const userInfo = { name: "John Doe" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };
      const createdReview = {
        id: 1,
        rating: 5,
        comment: "Excellent!",
        user_id: 1,
        event_id: 1,
      };
      const mockClient = { query: jest.fn() };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      reviewService.executeInTransaction = jest.fn(async (callback) =>
        callback(mockClient)
      );

      const result = await reviewService.createReview(
        1,
        1,
        reviewData,
        userInfo
      );

      expect(ReviewModel.create).toHaveBeenCalledWith(
        {
          user_id: 1,
          event_id: 1,
          rating: 5,
          comment: "Excellent!",
        },
        mockClient
      );
    });

    it("should handle edge case rating values", async () => {
      const userInfo = { name: "John Doe" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };

      // Test minimum valid rating
      const minRatingData = { rating: 1, comment: "Minimum" };
      const createdReview = {
        id: 1,
        rating: 1,
        comment: "Minimum",
        user_id: 1,
        event_id: 1,
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(
        1,
        1,
        minRatingData,
        userInfo
      );
      expect(result.rating).toBe(1);

      // Test maximum valid rating
      jest.clearAllMocks();
      const maxRatingData = { rating: 5, comment: "Maximum" };
      const maxCreatedReview = {
        id: 2,
        rating: 5,
        comment: "Maximum",
        user_id: 1,
        event_id: 1,
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(maxCreatedReview);

      const maxResult = await reviewService.createReview(
        1,
        1,
        maxRatingData,
        userInfo
      );
      expect(maxResult.rating).toBe(5);
    });

    it("should handle missing userInfo gracefully", async () => {
      const reviewData = { rating: 5, comment: "Great!" };
      const userInfo = {};
      const mockEvent = { id: 1, date: new Date("2023-01-01") };
      const createdReview = {
        id: 1,
        rating: 5,
        comment: "Great!",
        user_id: 1,
        event_id: 1,
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(
        1,
        1,
        reviewData,
        userInfo
      );
      expect(result.user_name).toBeUndefined();
      expect(result.profile_image).toBeUndefined();
    });

    it("should handle event date comparison correctly", async () => {
      const reviewData = { rating: 5, comment: "Great!" };
      const userInfo = { name: "John Doe" };

      // Mock current date to be specific
      const currentDate = new Date("2024-01-15");
      jest.spyOn(global, "Date").mockImplementation(() => currentDate);

      const eventJustPassed = { id: 1, date: new Date("2024-01-14") };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(eventJustPassed);
      ReviewModel.create.mockResolvedValue({
        id: 1,
        rating: 5,
        user_id: 1,
        event_id: 1,
      });

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).resolves.toBeDefined();

      // Restore Date
      global.Date.mockRestore();
    });
  });

  describe("updateReview", () => {
    it("should update review successfully", async () => {
      const reviewId = 1;
      const userId = 1;
      const updateData = { rating: 4, comment: "Updated comment" };
      const existingReview = {
        id: reviewId,
        user_id: userId,
        rating: 5,
        comment: "Old comment",
      };
      const updatedReview = {
        id: reviewId,
        user_id: userId,
        rating: 4,
        comment: "Updated comment",
      };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.update.mockResolvedValue(updatedReview);

      const result = await reviewService.updateReview(
        reviewId,
        userId,
        updateData
      );

      expect(ReviewModel.findById).toHaveBeenCalledWith(reviewId);
      expect(ReviewModel.update).toHaveBeenCalledWith(
        reviewId,
        {
          rating: 4,
          comment: "Updated comment",
        },
        undefined
      );
      expect(result).toEqual(updatedReview);
    });

    it("should throw error if review not found for update", async () => {
      ReviewModel.findById.mockResolvedValue(null);

      await expect(
        reviewService.updateReview(999, 1, { rating: 4 })
      ).rejects.toThrow("Review not found");
    });

    it("should throw error for invalid rating in update", async () => {
      const updateData = { rating: 0 };

      await expect(
        reviewService.updateReview(1, 1, updateData)
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("should throw error if user does not own the review", async () => {
      const existingReview = { id: 1, user_id: 2, rating: 5 };
      ReviewModel.findById.mockResolvedValue(existingReview);

      await expect(
        reviewService.updateReview(1, 1, { rating: 4 })
      ).rejects.toThrow("You can only update your own reviews");
    });

    it("should update only rating without comment", async () => {
      const reviewId = 1;
      const userId = 1;
      const updateData = { rating: 3 };
      const existingReview = { id: reviewId, user_id: userId, rating: 5 };
      const updatedReview = { id: reviewId, user_id: userId, rating: 3 };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.update.mockResolvedValue(updatedReview);

      const result = await reviewService.updateReview(
        reviewId,
        userId,
        updateData
      );

      expect(ReviewModel.update).toHaveBeenCalledWith(
        reviewId,
        {
          rating: 3,
          comment: undefined,
        },
        undefined
      );
    });

    it("should handle transaction client in update", async () => {
      const reviewId = 1;
      const userId = 1;
      const updateData = { rating: 4, comment: "Updated" };
      const existingReview = { id: reviewId, user_id: userId, rating: 5 };
      const updatedReview = {
        id: reviewId,
        user_id: userId,
        rating: 4,
        comment: "Updated",
      };
      const mockClient = { query: jest.fn() };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.update.mockResolvedValue(updatedReview);

      reviewService.executeInTransaction = jest.fn(async (callback) =>
        callback(mockClient)
      );

      const result = await reviewService.updateReview(
        reviewId,
        userId,
        updateData
      );

      expect(ReviewModel.update).toHaveBeenCalledWith(
        reviewId,
        updateData,
        mockClient
      );
    });

    it("should validate rating bounds for update", async () => {
      // Test rating too high
      await expect(
        reviewService.updateReview(1, 1, { rating: 6 })
      ).rejects.toThrow("Rating must be between 1 and 5");

      // Test rating too low
      await expect(
        reviewService.updateReview(1, 1, { rating: -1 })
      ).rejects.toThrow("Rating must be between 1 and 5");
    });
  });

  describe("deleteReview", () => {
    it("should delete review successfully", async () => {
      const reviewId = 1;
      const userId = 1;
      const existingReview = { id: reviewId, user_id: userId };
      const deleteResult = { id: reviewId, deleted: true };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.remove.mockResolvedValue(deleteResult);

      const result = await reviewService.deleteReview(reviewId, userId);

      expect(ReviewModel.findById).toHaveBeenCalledWith(reviewId);
      expect(ReviewModel.remove).toHaveBeenCalledWith(reviewId, undefined);
      expect(result).toEqual(deleteResult);
    });

    it("should throw error if review not found for deletion", async () => {
      ReviewModel.findById.mockResolvedValue(null);

      await expect(reviewService.deleteReview(999, 1)).rejects.toThrow(
        "Review not found"
      );
    });

    it("should throw error if user does not own the review and is not admin", async () => {
      const existingReview = { id: 1, user_id: 2 };
      ReviewModel.findById.mockResolvedValue(existingReview);

      await expect(reviewService.deleteReview(1, 1)).rejects.toThrow(
        "You can only delete your own reviews"
      );
    });

    it("should allow admin to delete any review", async () => {
      const reviewId = 1;
      const userId = 1;
      const userRole = "admin";
      const existingReview = { id: reviewId, user_id: 2 };
      const deleteResult = { id: reviewId, deleted: true };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.remove.mockResolvedValue(deleteResult);

      const result = await reviewService.deleteReview(
        reviewId,
        userId,
        userRole
      );

      expect(result).toEqual(deleteResult);
    });

    it("should handle transaction client in delete", async () => {
      const reviewId = 1;
      const userId = 1;
      const existingReview = { id: reviewId, user_id: userId };
      const deleteResult = { id: reviewId, deleted: true };
      const mockClient = { query: jest.fn() };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.remove.mockResolvedValue(deleteResult);

      reviewService.executeInTransaction = jest.fn(async (callback) =>
        callback(mockClient)
      );

      const result = await reviewService.deleteReview(reviewId, userId);

      expect(ReviewModel.remove).toHaveBeenCalledWith(reviewId, mockClient);
    });

    it("should allow user to delete their own review regardless of role", async () => {
      const reviewId = 1;
      const userId = 1;
      const existingReview = { id: reviewId, user_id: userId };
      const deleteResult = { id: reviewId, deleted: true };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.remove.mockResolvedValue(deleteResult);

      const result = await reviewService.deleteReview(reviewId, userId, "user");

      expect(result).toEqual(deleteResult);
    });

    it("should handle various admin role formats", async () => {
      const reviewId = 1;
      const userId = 1;
      const existingReview = { id: reviewId, user_id: 2 };
      const deleteResult = { id: reviewId, deleted: true };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.remove.mockResolvedValue(deleteResult);

      // Test with 'admin' role
      await expect(
        reviewService.deleteReview(reviewId, userId, "admin")
      ).resolves.toEqual(deleteResult);

      // Test with non-admin role should fail
      jest.clearAllMocks();
      ReviewModel.findById.mockResolvedValue(existingReview);

      await expect(
        reviewService.deleteReview(reviewId, userId, "user")
      ).rejects.toThrow("You can only delete your own reviews");
    });
  });

  describe("getReviewById", () => {
    it("should return review by ID", async () => {
      const reviewId = 1;
      const mockReview = {
        id: reviewId,
        user_id: 1,
        event_id: 1,
        rating: 5,
        comment: "Great!",
      };

      ReviewModel.findById.mockResolvedValue(mockReview);

      const result = await reviewService.getReviewById(reviewId);

      expect(ReviewModel.findById).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual(mockReview);
    });

    it("should return null if review not found", async () => {
      ReviewModel.findById.mockResolvedValue(null);

      const result = await reviewService.getReviewById(999);

      expect(result).toBeNull();
    });

    it("should handle database errors in getReviewById", async () => {
      ReviewModel.findById.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(reviewService.getReviewById(1)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle string review IDs", async () => {
      const reviewId = "123";
      const mockReview = { id: 123, user_id: 1, rating: 5 };

      ReviewModel.findById.mockResolvedValue(mockReview);

      const result = await reviewService.getReviewById(reviewId);

      expect(ReviewModel.findById).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual(mockReview);
    });
  });

  describe("getUserReview", () => {
    it("should return user review for event", async () => {
      const userId = 1;
      const eventId = 1;
      const mockReview = {
        id: 1,
        user_id: userId,
        event_id: eventId,
        rating: 5,
        comment: "Great!",
      };

      ReviewModel.findUserReview.mockResolvedValue(mockReview);

      const result = await reviewService.getUserReview(userId, eventId);

      expect(ReviewModel.findUserReview).toHaveBeenCalledWith(userId, eventId);
      expect(result).toEqual(mockReview);
    });

    it("should return null if user has not reviewed the event", async () => {
      ReviewModel.findUserReview.mockResolvedValue(null);

      const result = await reviewService.getUserReview(1, 1);

      expect(result).toBeNull();
    });

    it("should handle database errors in getUserReview", async () => {
      ReviewModel.findUserReview.mockRejectedValue(new Error("Database error"));

      await expect(reviewService.getUserReview(1, 1)).rejects.toThrow(
        "Database error"
      );
    });

    it("should handle invalid user ID gracefully", async () => {
      ReviewModel.findUserReview.mockResolvedValue(null);

      const result = await reviewService.getUserReview(null, 1);

      expect(ReviewModel.findUserReview).toHaveBeenCalledWith(null, 1);
      expect(result).toBeNull();
    });

    it("should handle invalid event ID gracefully", async () => {
      ReviewModel.findUserReview.mockResolvedValue(null);

      const result = await reviewService.getUserReview(1, null);

      expect(ReviewModel.findUserReview).toHaveBeenCalledWith(1, null);
      expect(result).toBeNull();
    });

    it("should handle string IDs", async () => {
      const userId = "123";
      const eventId = "456";
      const mockReview = { id: 1, user_id: 123, event_id: 456, rating: 4 };

      ReviewModel.findUserReview.mockResolvedValue(mockReview);

      const result = await reviewService.getUserReview(userId, eventId);

      expect(ReviewModel.findUserReview).toHaveBeenCalledWith(userId, eventId);
      expect(result).toEqual(mockReview);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty comment string in create", async () => {
      const reviewData = { rating: 4, comment: "" };
      const userInfo = { name: "Jane Doe" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };
      const createdReview = {
        id: 1,
        rating: 4,
        comment: "",
        user_id: 1,
        event_id: 1,
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(
        1,
        1,
        reviewData,
        userInfo
      );
      expect(result.comment).toBe("");
    });

    it("should handle very long comments", async () => {
      const longComment = "A".repeat(1000);
      const reviewData = { rating: 4, comment: longComment };
      const userInfo = { name: "Jane Doe" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };
      const createdReview = {
        id: 1,
        rating: 4,
        comment: longComment,
        user_id: 1,
        event_id: 1,
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(
        1,
        1,
        reviewData,
        userInfo
      );
      expect(result.comment).toBe(longComment);
    });

    it("should handle missing event gracefully", async () => {
      const reviewData = { rating: 5, comment: "Great!" };
      const userInfo = { name: "John Doe" };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(null);

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow();
    });

    it("should handle transaction errors in create", async () => {
      const reviewData = { rating: 5, comment: "Great!" };
      const userInfo = { name: "John Doe" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);

      reviewService.executeInTransaction = jest
        .fn()
        .mockRejectedValue(new Error("Transaction failed"));

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow("Transaction failed");
    });

    it("should handle transaction errors in update", async () => {
      const existingReview = { id: 1, user_id: 1, rating: 5 };
      ReviewModel.findById.mockResolvedValue(existingReview);

      reviewService.executeInTransaction = jest
        .fn()
        .mockRejectedValue(new Error("Transaction failed"));

      await expect(
        reviewService.updateReview(1, 1, { rating: 4 })
      ).rejects.toThrow("Transaction failed");
    });

    it("should handle transaction errors in delete", async () => {
      const existingReview = { id: 1, user_id: 1 };
      ReviewModel.findById.mockResolvedValue(existingReview);

      reviewService.executeInTransaction = jest
        .fn()
        .mockRejectedValue(new Error("Transaction failed"));

      await expect(reviewService.deleteReview(1, 1)).rejects.toThrow(
        "Transaction failed"
      );
    });

    it("should handle model errors in create", async () => {
      const reviewData = { rating: 5, comment: "Great!" };
      const userInfo = { name: "John Doe" };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockRejectedValue(
        new Error("Database constraint violation")
      );

      await expect(
        reviewService.createReview(1, 1, reviewData, userInfo)
      ).rejects.toThrow("Database constraint violation");
    });

    it("should preserve user info when merging review data", async () => {
      const reviewData = { rating: 5, comment: "Excellent!" };
      const userInfo = {
        name: "John Doe",
        profile_image: "https://example.com/avatar.jpg",
        extra_field: "should not appear",
      };
      const mockEvent = { id: 1, date: new Date("2023-01-01") };
      const createdReview = {
        id: 1,
        rating: 5,
        comment: "Excellent!",
        user_id: 1,
        event_id: 1,
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      EventModel.findById.mockResolvedValue(mockEvent);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(
        1,
        1,
        reviewData,
        userInfo
      );

      expect(result).toEqual({
        ...createdReview,
        user_name: "John Doe",
        profile_image: "https://example.com/avatar.jpg",
      });
      expect(result.extra_field).toBeUndefined();
    });
  });
});
