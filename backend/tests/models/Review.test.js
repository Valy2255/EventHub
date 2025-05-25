// backend/tests/models/Review.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('Review Model', () => {
  let Review;
  let consoleErrorSpy;

  beforeAll(async () => {
    Review = await import('../../models/Review.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('findById', () => {
    it('should find review by ID', async () => {
      const mockReview = {
        id: 1,
        user_id: 1,
        event_id: 1,
        rating: 5,
        comment: 'Great event!',
        created_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockReview] });

      const result = await Review.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT \* FROM reviews\s+WHERE id = \$1/s),
        values: [1]
      });
      expect(result).toEqual(mockReview);
    });

    it('should return undefined for non-existent review', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Review.findById(999);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Review.findById(1)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding review by ID:', error);
    });
  });

  describe('findByEventId', () => {
    it('should find all reviews for an event', async () => {
      const mockReviews = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          rating: 5,
          comment: 'Great event!',
          user_name: 'John Doe',
          profile_image: 'profile1.jpg',
          created_at: '2024-03-15T10:00:00Z'
        },
        {
          id: 2,
          user_id: 2,
          event_id: 1,
          rating: 4,
          comment: 'Good event',
          user_name: 'Jane Smith',
          profile_image: 'profile2.jpg',
          created_at: '2024-03-14T10:00:00Z'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockReviews });

      const result = await Review.findByEventId(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT r\.\*, u\.name as user_name, u\.profile_image\s+FROM reviews r\s+JOIN users u ON r\.user_id = u\.id\s+WHERE r\.event_id = \$1\s+ORDER BY r\.created_at DESC/s),
        values: [1]
      });
      expect(result).toEqual(mockReviews);
    });

    it('should return empty array for event with no reviews', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Review.findByEventId(1);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Review.findByEventId(1)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding reviews:', error);
    });

    it('should order reviews by created_at DESC', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Review.findByEventId(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('ORDER BY r.created_at DESC'),
        values: [1]
      });
    });
  });

  describe('findUserReview', () => {
    it('should find review by user and event', async () => {
      const mockReview = {
        id: 1,
        user_id: 1,
        event_id: 1,
        rating: 4,
        comment: 'Nice event'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockReview] });

      const result = await Review.findUserReview(1, 1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT \* FROM reviews\s+WHERE user_id = \$1 AND event_id = \$2/s),
        values: [1, 1]
      });
      expect(result).toEqual(mockReview);
    });

    it('should return undefined when user has not reviewed event', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Review.findUserReview(1, 1);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Review.findUserReview(1, 1)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding user review:', error);
    });
  });

  describe('create', () => {
    const mockReviewData = {
      user_id: 1,
      event_id: 1,
      rating: 5,
      comment: 'Excellent event!'
    };

    it('should create a new review', async () => {
      const mockCreated = {
        id: 1,
        ...mockReviewData,
        created_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await Review.create(mockReviewData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/INSERT INTO reviews\(user_id, event_id, rating, comment\)\s+VALUES\(\$1, \$2, \$3, \$4\)\s+RETURNING \*/s),
        values: [1, 1, 5, 'Excellent event!']
      });
      expect(result).toEqual(mockCreated);
    });

    it('should create review with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockCreated = { id: 1, ...mockReviewData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await Review.create(mockReviewData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(/INSERT INTO reviews\(user_id, event_id, rating, comment\)\s+VALUES\(\$1, \$2, \$3, \$4\)\s+RETURNING \*/s),
        values: [1, 1, 5, 'Excellent event!']
      });
      expect(result).toEqual(mockCreated);
    });

    it('should handle database errors', async () => {
      const error = new Error('Insert failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Review.create(mockReviewData)).rejects.toThrow('Insert failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating review:', error);
    });
  });

  describe('update', () => {
    const mockUpdateData = {
      rating: 4,
      comment: 'Updated comment'
    };

    it('should update a review', async () => {
      const mockUpdated = {
        id: 1,
        user_id: 1,
        event_id: 1,
        rating: 4,
        comment: 'Updated comment'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Review.update(1, mockUpdateData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE reviews\s+SET rating = \$2, comment = \$3\s+WHERE id = \$1\s+RETURNING \*/s),
        values: [1, 4, 'Updated comment']
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should update review with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockClient.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Review.update(1, mockUpdateData, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE reviews\s+SET rating = \$2, comment = \$3\s+WHERE id = \$1\s+RETURNING \*/s),
        values: [1, 4, 'Updated comment']
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should return undefined when review not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Review.update(999, mockUpdateData);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Update failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Review.update(1, mockUpdateData)).rejects.toThrow('Update failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating review:', error);
    });
  });

  describe('remove', () => {
    it('should delete a review', async () => {
      const mockDeleted = { id: 1 };
      mockDbQuery.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Review.remove(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/DELETE FROM reviews\s+WHERE id = \$1\s+RETURNING id/s),
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should delete review with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockDeleted = { id: 1 };
      mockClient.query.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Review.remove(1, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(/DELETE FROM reviews\s+WHERE id = \$1\s+RETURNING id/s),
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should return undefined when review not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Review.remove(999);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Delete failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(Review.remove(1)).rejects.toThrow('Delete failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting review:', error);
    });
  });
});