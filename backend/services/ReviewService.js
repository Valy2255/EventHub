// backend/services/ReviewService.js (NEW FILE)
// ================================
import { BaseService } from "./BaseService.js";
import * as ReviewModel from "../models/Review.js";
import * as EventModel from "../models/Event.js";

export class ReviewService extends BaseService {
  async getEventReviews(eventId) {
    const reviews = await ReviewModel.findByEventId(eventId);

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      averageRating = (totalRating / reviews.length).toFixed(1);
    }

    return {
      reviews,
      count: reviews.length,
      averageRating,
    };
  }

  async createReview(eventId, userId, reviewData, userInfo) {
    const { rating, comment } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if the user has already reviewed this event
    const existingReview = await ReviewModel.findUserReview(userId, eventId);
    if (existingReview) {
      throw new Error("You have already reviewed this event");
    }

    // Check if the user has attended this event (has a purchased ticket)
    const event = await EventModel.findById(eventId);
    if (event.date > new Date()) {
      throw new Error(
        "You can only review events that have already taken place"
      );
    }

    return this.executeInTransaction(async (client) => {
      // Create the review
      const review = await ReviewModel.create(
        {
          user_id: userId,
          event_id: eventId,
          rating,
          comment,
        },
        client
      );

      // Return review with user info
      return {
        ...review,
        user_name: userInfo.name,
        profile_image: userInfo.profile_image,
      };
    });
  }

  async updateReview(reviewId, userId, reviewData) {
    const { rating, comment } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Get the review to check ownership
    const existingReview = await ReviewModel.findById(reviewId);

    if (!existingReview) {
      throw new Error("Review not found");
    }

    // Check if the user owns this review
    if (existingReview.user_id !== userId) {
      throw new Error("You can only update your own reviews");
    }

    return this.executeInTransaction(async (client) => {
      return ReviewModel.update(reviewId, { rating, comment }, client);
    });
  }

  async deleteReview(reviewId, userId, userRole) {
    // Get the review to check ownership
    const existingReview = await ReviewModel.findById(reviewId);

    if (!existingReview) {
      throw new Error("Review not found");
    }

    // Check if the user owns this review or is an admin
    if (existingReview.user_id !== userId && userRole !== "admin") {
      throw new Error("You can only delete your own reviews");
    }

    return this.executeInTransaction(async (client) => {
      return ReviewModel.remove(reviewId, client);
    });
  }

  async getReviewById(reviewId) {
    return ReviewModel.findById(reviewId);
  }

  async getUserReview(userId, eventId) {
    return ReviewModel.findUserReview(userId, eventId);
  }
}
