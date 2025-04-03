// backend/controllers/reviewController.js
import * as Review from '../models/Review.js';
import * as Ticket from '../models/Ticket.js';

// Get all reviews for an event
export const getEventReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const reviews = await Review.findByEventId(id);
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }
    
    res.status(200).json({
      reviews,
      count: reviews.length,
      averageRating
    });
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
    
    // Check if rating is valid (1-5)
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if the user has already reviewed this event
    const existingReview = await Review.findUserReview(userId, eventId);
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this event' });
    }
    
    // Check if the user has attended this event (has a purchased ticket)
    // const userTickets = await Ticket.findByUserAndEvent(userId, eventId);
    // if (!userTickets || userTickets.length === 0) {
    //   return res.status(403).json({ error: 'You can only review events you have attended' });
    // }
    
    // Create the review
    const review = await Review.create({
      user_id: userId,
      event_id: eventId,
      rating,
      comment
    });
    
    // Get user info for response
    const fullReview = {
      ...review,
      user_name: req.user.name,
      profile_image: req.user.profile_image
    };
    
    res.status(201).json(fullReview);
  } catch (error) {
    console.error('Error creating review:', error);
    next(error);
  }
};

// Update a review
// backend/controllers/reviewController.js

export const updateReview = async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;
      const { rating, comment } = req.body;
      
      // Check if rating is valid (1-5)
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      
      // Get the review to check ownership
      const existingReview = await Review.findById(reviewId);
      
      if (!existingReview) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      // Check if the user owns this review
      if (existingReview.user_id !== userId) {
        return res.status(403).json({ error: 'You can only update your own reviews' });
      }
      
      // Update the review
      const updatedReview = await Review.update(reviewId, {
        rating,
        comment
      });
      
      res.status(200).json(updatedReview);
    } catch (error) {
      console.error('Error updating review:', error);
      next(error);
    }
  };

// Delete a review
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    // Get the review to check ownership
    const existingReview = await Review.findById(reviewId);
    
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if the user owns this review or is an admin
    if (existingReview.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    
    // Delete the review
    await Review.remove(reviewId);
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    next(error);
  }
};