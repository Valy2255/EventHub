// tests/controllers/reviewController.test.js

import { jest } from "@jest/globals";

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    role: "user",
    profile_image: "avatar.jpg",
  },
  ...overrides,
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the ReviewService
const mockReviewService = {
  getEventReviews: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
};

jest.unstable_mockModule("../../services/ReviewService.js", () => ({
  ReviewService: jest.fn().mockImplementation(() => mockReviewService),
}));

const { getEventReviews, createReview, updateReview, deleteReview } =
  await import("../../controllers/reviewController.js");

describe("ReviewController", () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();

    Object.values(mockReviewService).forEach((mock) => mock.mockReset());
  });

  describe("getEventReviews", () => {
    it("should get event reviews successfully", async () => {
      const mockResult = {
        reviews: [
          {
            id: 1,
            rating: 5,
            comment: "Amazing event!",
            user_name: "John Doe",
            profile_image: "john.jpg",
            created_at: "2024-01-01T10:00:00Z",
          },
          {
            id: 2,
            rating: 4,
            comment: "Great experience",
            user_name: "Jane Smith",
            profile_image: null,
            created_at: "2024-01-02T15:30:00Z",
          },
        ],
        averageRating: 4.5,
        totalReviews: 2,
      };
      req.params = { id: "1" };
      mockReviewService.getEventReviews.mockResolvedValue(mockResult);

      await getEventReviews(req, res, next);

      expect(mockReviewService.getEventReviews).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should handle service error", async () => {
      const error = new Error("Database connection failed");
      req.params = { id: "1" };
      mockReviewService.getEventReviews.mockRejectedValue(error);

      await getEventReviews(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("createReview", () => {
    const reviewData = {
      rating: 5,
      comment: "Excellent event! Highly recommend.",
    };

    it("should create review successfully", async () => {
      const mockReview = {
        id: 1,
        event_id: 1,
        user_id: 1,
        rating: 5,
        comment: "Excellent event! Highly recommend.",
        user_name: "Test User",
        profile_image: "avatar.jpg",
        created_at: "2024-01-01T10:00:00Z",
      };
      req.params = { id: "1" };
      req.body = reviewData;
      mockReviewService.createReview.mockResolvedValue(mockReview);

      await createReview(req, res, next);

      expect(mockReviewService.createReview).toHaveBeenCalledWith(
        "1",
        1,
        reviewData,
        { name: "Test User", profile_image: "avatar.jpg" }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockReview);
    });

    it("should handle invalid rating", async () => {
      const error = new Error("Rating must be between 1 and 5");
      req.params = { id: "1" };
      req.body = { rating: 6, comment: "Great event" };
      mockReviewService.createReview.mockRejectedValue(error);

      await createReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Rating must be between 1 and 5",
      });
    });

    it("should handle duplicate review", async () => {
      const error = new Error("You have already reviewed this event");
      req.params = { id: "1" };
      req.body = reviewData;
      mockReviewService.createReview.mockRejectedValue(error);

      await createReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "You have already reviewed this event",
      });
    });

    it("should handle unauthorized review attempt", async () => {
      const error = new Error("You can only review events you have attended");
      req.params = { id: "1" };
      req.body = reviewData;
      mockReviewService.createReview.mockRejectedValue(error);

      await createReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only review events you have attended",
      });
    });
  });

  describe("updateReview", () => {
    const updateData = {
      rating: 4,
      comment: "Updated review - still a good event!",
    };

    it("should update review successfully", async () => {
      const mockUpdatedReview = {
        id: 1,
        event_id: 1,
        user_id: 1,
        rating: 4,
        comment: "Updated review - still a good event!",
        user_name: "Test User",
        profile_image: "avatar.jpg",
        updated_at: "2024-01-02T10:00:00Z",
      };
      req.params = { reviewId: "1" };
      req.body = updateData;
      mockReviewService.updateReview.mockResolvedValue(mockUpdatedReview);

      await updateReview(req, res, next);

      expect(mockReviewService.updateReview).toHaveBeenCalledWith(
        "1",
        1,
        updateData
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedReview);
    });

    it("should handle invalid rating in update", async () => {
      const error = new Error("Rating must be between 1 and 5");
      req.params = { reviewId: "1" };
      req.body = { rating: 0, comment: "Updated comment" };
      mockReviewService.updateReview.mockRejectedValue(error);

      await updateReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Rating must be between 1 and 5",
      });
    });

    it("should handle review not found", async () => {
      const error = new Error("Review not found");
      req.params = { reviewId: "999" };
      req.body = updateData;
      mockReviewService.updateReview.mockRejectedValue(error);

      await updateReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Review not found" });
    });

    it("should handle unauthorized update attempt", async () => {
      const error = new Error("You can only update your own reviews");
      req.params = { reviewId: "1" };
      req.body = updateData;
      mockReviewService.updateReview.mockRejectedValue(error);

      await updateReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only update your own reviews",
      });
    });
  });

  describe("deleteReview", () => {
    it("should delete review successfully as owner", async () => {
      req.params = { reviewId: "1" };
      req.user = { id: 1, role: "user" };
      mockReviewService.deleteReview.mockResolvedValue();

      await deleteReview(req, res, next);

      expect(mockReviewService.deleteReview).toHaveBeenCalledWith(
        "1",
        1,
        "user"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Review deleted successfully",
      });
    });

    it("should delete review successfully as admin", async () => {
      req.params = { reviewId: "1" };
      req.user = { id: 2, role: "admin" };
      mockReviewService.deleteReview.mockResolvedValue();

      await deleteReview(req, res, next);

      expect(mockReviewService.deleteReview).toHaveBeenCalledWith(
        "1",
        2,
        "admin"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Review deleted successfully",
      });
    });

    it("should handle review not found", async () => {
      const error = new Error("Review not found");
      req.params = { reviewId: "999" };
      mockReviewService.deleteReview.mockRejectedValue(error);

      await deleteReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Review not found" });
    });

    it("should handle unauthorized delete attempt", async () => {
      const error = new Error("You can only delete your own reviews");
      req.params = { reviewId: "1" };
      req.user = { id: 2, role: "user" }; // Different user, not admin
      mockReviewService.deleteReview.mockRejectedValue(error);

      await deleteReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only delete your own reviews",
      });
    });
  });
});
