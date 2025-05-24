// backend/controllers/reviewController.js (UPDATED)
// ================================
import { ReviewService } from '../services/ReviewService.js';

const reviewService = new ReviewService();

// Get all reviews for an event
export const getEventReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await reviewService.getEventReviews(id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    next(error);
  }
};

// Create a new review for an event
export const createReview = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    
    const userInfo = {
      name: req.user.name,
      profile_image: req.user.profile_image
    };
    
    const fullReview = await reviewService.createReview(
      eventId, 
      userId, 
      { rating, comment }, 
      userInfo
    );
    
    res.status(201).json(fullReview);
  } catch (error) {
    if (error.message === 'Rating must be between 1 and 5') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'You have already reviewed this event') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'You can only review events you have attended') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error creating review:', error);
    next(error);
  }
};

// Update a review
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    
    const updatedReview = await reviewService.updateReview(
      reviewId, 
      userId, 
      { rating, comment }
    );
    
    res.status(200).json(updatedReview);
  } catch (error) {
    if (error.message === 'Rating must be between 1 and 5') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Review not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'You can only update your own reviews') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error updating review:', error);
    next(error);
  }
};

// Delete a review
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    await reviewService.deleteReview(reviewId, userId, userRole);
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    if (error.message === 'Review not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'You can only delete your own reviews') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error deleting review:', error);
    next(error);
  }
};