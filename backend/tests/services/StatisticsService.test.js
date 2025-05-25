import { jest } from '@jest/globals';

// Mock models using unstable_mockModule
jest.unstable_mockModule('../../models/Review.js', () => ({
  findByEventId: jest.fn(),
  findUserReview: jest.fn(),
  findById: jest.fn(), // Add this missing mock
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getReviewStats: jest.fn(),
}));

jest.unstable_mockModule('../../models/Ticket.js', () => ({
  findByUserAndEvent: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule('../../services/BaseService.js', () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  }
}));

describe('ReviewService', () => {
  let ReviewService;
  let ReviewModel;
  let TicketModel;
  let reviewService;

  beforeAll(async () => {
    ReviewModel = await import('../../models/Review.js');
    TicketModel = await import('../../models/Ticket.js');
    const { ReviewService: ReviewServiceClass } = await import('../../services/ReviewService.js');
    ReviewService = ReviewServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    reviewService = new ReviewService();
  });

  describe('getEventReviews', () => {
    it('should return event reviews with average rating', async () => {
      const mockReviews = [
        { id: 1, rating: 5, comment: 'Great!', user_name: 'John', created_at: '2024-01-01' },
        { id: 2, rating: 4, comment: 'Good', user_name: 'Jane', created_at: '2024-01-02' }
      ];

      ReviewModel.findByEventId.mockResolvedValue(mockReviews);

      const result = await reviewService.getEventReviews(1);

      expect(ReviewModel.findByEventId).toHaveBeenCalledWith(1);
      expect(result.reviews).toEqual(mockReviews);
      expect(result.count).toBe(2);
      expect(result.averageRating).toBe('4.5');
    });

    it('should return empty reviews with zero average for no reviews', async () => {
      ReviewModel.findByEventId.mockResolvedValue([]);

      const result = await reviewService.getEventReviews(1);

      expect(result.reviews).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.averageRating).toBe(0);
    });

    it('should handle single review correctly', async () => {
      const mockReviews = [
        { id: 1, rating: 5, comment: 'Amazing!', user_name: 'John' }
      ];

      ReviewModel.findByEventId.mockResolvedValue(mockReviews);

      const result = await reviewService.getEventReviews(1);

      expect(result.averageRating).toBe('5.0');
      expect(result.count).toBe(1);
    });
  });

  describe('createReview', () => {
    it('should create review successfully', async () => {
      const reviewData = { rating: 5, comment: 'Excellent!' };
      const userInfo = { name: 'John Doe', profile_image: 'avatar.jpg' };
      const mockTickets = [{ id: 1, event_id: 1, user_id: 1 }];
      const createdReview = { 
        id: 1, 
        rating: 5,
        comment: 'Excellent!',
        user_id: 1, 
        event_id: 1,
        created_at: '2024-01-01'
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      TicketModel.findByUserAndEvent.mockResolvedValue(mockTickets);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(1, 1, reviewData, userInfo);

      expect(ReviewModel.findUserReview).toHaveBeenCalledWith(1, 1);
      expect(TicketModel.findByUserAndEvent).toHaveBeenCalledWith(1, 1);
      expect(ReviewModel.create).toHaveBeenCalledWith({
        user_id: 1, // Fixed: use snake_case as in actual service
        event_id: 1, // Fixed: use snake_case as in actual service
        rating: 5,
        comment: 'Excellent!'
      }, undefined);
      expect(result.user_name).toBe('John Doe');
      expect(result.rating).toBe(5);
    });

    it('should throw error if user has no tickets', async () => {
      const reviewData = { rating: 5, comment: 'Great!' };
      const userInfo = { name: 'John Doe' };

      ReviewModel.findUserReview.mockResolvedValue(null);
      TicketModel.findByUserAndEvent.mockResolvedValue([]);

      await expect(reviewService.createReview(1, 1, reviewData, userInfo))
        .rejects.toThrow('You can only review events you have attended');
    });

    it('should throw error if user already reviewed the event', async () => {
      const reviewData = { rating: 5, comment: 'Great!' };
      const userInfo = { name: 'John Doe' };
      const existingReview = { id: 1, user_id: 1, event_id: 1, rating: 4 };

      ReviewModel.findUserReview.mockResolvedValue(existingReview);

      await expect(reviewService.createReview(1, 1, reviewData, userInfo))
        .rejects.toThrow('You have already reviewed this event');
    });

    it('should throw error for invalid rating', async () => {
      const reviewData = { rating: 6, comment: 'Great!' }; // Invalid rating > 5
      const userInfo = { name: 'John Doe' };

      await expect(reviewService.createReview(1, 1, reviewData, userInfo))
        .rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should throw error for missing rating', async () => {
      const reviewData = { comment: 'Great!' }; // Missing rating
      const userInfo = { name: 'John Doe' };

      // Fixed: actual service throws "Rating must be between 1 and 5" for missing rating
      await expect(reviewService.createReview(1, 1, reviewData, userInfo))
        .rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should create review without comment', async () => {
      const reviewData = { rating: 4 }; // No comment
      const userInfo = { name: 'Jane Doe' };
      const mockTickets = [{ id: 1, event_id: 1, user_id: 1 }];
      const createdReview = { 
        id: 1, 
        rating: 4, 
        comment: null,
        user_id: 1, 
        event_id: 1 
      };

      ReviewModel.findUserReview.mockResolvedValue(null);
      TicketModel.findByUserAndEvent.mockResolvedValue(mockTickets);
      ReviewModel.create.mockResolvedValue(createdReview);

      const result = await reviewService.createReview(1, 1, reviewData, userInfo);

      expect(result.rating).toBe(4);
      expect(result.comment).toBeNull();
    });

    it('should handle transaction client', async () => {
      const reviewData = { rating: 5, comment: 'Excellent!' };
      const userInfo = { name: 'John Doe' };
      const mockTickets = [{ id: 1, event_id: 1 }];
      const createdReview = { id: 1, rating: 5, comment: 'Excellent!', user_id: 1, event_id: 1 };
      const mockClient = { query: jest.fn() };

      ReviewModel.findUserReview.mockResolvedValue(null);
      TicketModel.findByUserAndEvent.mockResolvedValue(mockTickets);
      ReviewModel.create.mockResolvedValue(createdReview);

      reviewService.executeInTransaction = jest.fn(async (callback) => callback(mockClient));

      const result = await reviewService.createReview(1, 1, reviewData, userInfo);

      // Fixed: use snake_case field names as in actual service
      expect(ReviewModel.create).toHaveBeenCalledWith({
        user_id: 1,
        event_id: 1,
        rating: 5,
        comment: 'Excellent!'
      }, mockClient);
    });
  });

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      const reviewId = 1;
      const userId = 1;
      const updateData = { rating: 4, comment: 'Updated comment' };
      const existingReview = { id: reviewId, user_id: userId, rating: 5, comment: 'Old comment' };
      const updatedReview = { 
        id: reviewId, 
        user_id: userId, 
        rating: 4, 
        comment: 'Updated comment' 
      };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.update.mockResolvedValue(updatedReview);

      const result = await reviewService.updateReview(reviewId, userId, updateData);

      expect(ReviewModel.findById).toHaveBeenCalledWith(reviewId);
      expect(ReviewModel.update).toHaveBeenCalledWith(reviewId, {
        rating: 4,
        comment: 'Updated comment'
      }, undefined);
      expect(result).toEqual(updatedReview);
    });

    it('should throw error if review not found for update', async () => {
      ReviewModel.findById.mockResolvedValue(null);

      await expect(reviewService.updateReview(999, 1, { rating: 4 }))
        .rejects.toThrow('Review not found');
    });

    it('should throw error for invalid rating in update', async () => {
      const updateData = { rating: 0 }; // Invalid rating

      await expect(reviewService.updateReview(1, 1, updateData))
        .rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should throw error if user does not own the review', async () => {
      const existingReview = { id: 1, user_id: 2, rating: 5 }; // Different user
      ReviewModel.findById.mockResolvedValue(existingReview);

      await expect(reviewService.updateReview(1, 1, { rating: 4 }))
        .rejects.toThrow('You can only update your own reviews');
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
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

    it('should throw error if review not found for deletion', async () => {
      ReviewModel.findById.mockResolvedValue(null);

      await expect(reviewService.deleteReview(999, 1))
        .rejects.toThrow('Review not found');
    });

    it('should throw error if user does not own the review and is not admin', async () => {
      const existingReview = { id: 1, user_id: 2 }; // Different user
      ReviewModel.findById.mockResolvedValue(existingReview);

      await expect(reviewService.deleteReview(1, 1)) // No admin role
        .rejects.toThrow('You can only delete your own reviews');
    });

    it('should allow admin to delete any review', async () => {
      const reviewId = 1;
      const userId = 1;
      const userRole = 'admin';
      const existingReview = { id: reviewId, user_id: 2 }; // Different user
      const deleteResult = { id: reviewId, deleted: true };

      ReviewModel.findById.mockResolvedValue(existingReview);
      ReviewModel.remove.mockResolvedValue(deleteResult);

      const result = await reviewService.deleteReview(reviewId, userId, userRole);

      expect(result).toEqual(deleteResult);
    });
  });

  describe('getReviewById', () => {
    it('should return review by ID', async () => {
      const reviewId = 1;
      const mockReview = { 
        id: reviewId, 
        user_id: 1, 
        event_id: 1, 
        rating: 5, 
        comment: 'Great!' 
      };

      ReviewModel.findById.mockResolvedValue(mockReview);

      const result = await reviewService.getReviewById(reviewId);

      expect(ReviewModel.findById).toHaveBeenCalledWith(reviewId);
      expect(result).toEqual(mockReview);
    });
  });

  describe('getUserReview', () => {
    it('should return user review for event', async () => {
      const userId = 1;
      const eventId = 1;
      const mockReview = { 
        id: 1, 
        user_id: userId, 
        event_id: eventId, 
        rating: 5, 
        comment: 'Great!' 
      };

      ReviewModel.findUserReview.mockResolvedValue(mockReview);

      const result = await reviewService.getUserReview(userId, eventId);

      expect(ReviewModel.findUserReview).toHaveBeenCalledWith(userId, eventId);
      expect(result).toEqual(mockReview);
    });

    it('should return null if user has not reviewed the event', async () => {
      ReviewModel.findUserReview.mockResolvedValue(null);

      const result = await reviewService.getUserReview(1, 1);

      expect(result).toBeNull();
    });
  });
});