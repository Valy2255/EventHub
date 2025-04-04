// src/components/event/EventReviews.jsx
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaLock,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

const EventReviews = ({ reviews, eventId, onReviewAdded }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editReviewId, setEditReviewId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { user } = useAuth();

  // Check if user has already submitted a review
  const userReview = user
    ? reviews.items.find((review) => review.user_id === user.id)
    : null;

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Render star rating input
  const renderStarInput = () => {
    return (
      <div className="flex items-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={`input-star-${star}`}
            className="cursor-pointer text-2xl"
            onClick={() => setUserRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            {hoverRating >= star || (!hoverRating && userRating >= star) ? (
              <FaStar key={`star-filled-${star}`} className="text-yellow-500" />
            ) : (
              <FaRegStar
                key={`star-empty-${star}`}
                className="text-yellow-500"
              />
            )}
          </span>
        ))}
        <span className="ml-2 text-gray-600">
          {userRating > 0 ? `${userRating} stars` : "Select rating"}
        </span>
      </div>
    );
  };

  // Render stars for a review
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar key={`star-full-${i}`} className="text-yellow-500" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt key={`star-half-${i}`} className="text-yellow-500" />
        );
      } else {
        stars.push(
          <FaRegStar key={`star-empty-${i}`} className="text-yellow-500" />
        );
      }
    }

    return <div className="flex">{stars}</div>;
  };

  // Submit a review
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to leave a review");
      return;
    }

    if (userRating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let response;

      if (isEditing) {
        // Update existing review
        response = await api.put(`/events/reviews/${editReviewId}`, {
          rating: userRating,
          comment: reviewText,
        });

        setSuccess("Your review has been updated!");

        // Update the review in the list
        if (onReviewAdded && userReview) {
          // Create an updated review object with all the original properties
          const updatedReview = {
            ...userReview,
            rating: userRating,
            comment: reviewText,
          };

          // Build a new items array by replacing the old review with the updated one
          const updatedItems = reviews.items.map((review) =>
            review.id === editReviewId ? updatedReview : review
          );

          // Calculate new average rating
          const totalRating = updatedItems.reduce(
            (sum, r) => sum + r.rating,
            0
          );
          const newAverage = (totalRating / updatedItems.length).toFixed(1);

          // Call the callback with the new reviews structure
          onReviewAdded({
            items: updatedItems,
            count: updatedItems.length,
            averageRating: newAverage,
          });
        }

        // Reset edit mode
        setIsEditing(false);
        setEditReviewId(null);
      } else {
        // Create new review
        response = await api.post(`/events/${eventId}/reviews`, {
          rating: userRating,
          comment: reviewText,
        });

        setSuccess("Your review has been submitted!");

        if (onReviewAdded) {
          // For a new review, we'll make sure it's properly formatted
          const newReview = response.data;

          // Add the new review to the existing items
          const updatedItems = [newReview, ...reviews.items];

          // Calculate the new average
          const totalRating = updatedItems.reduce(
            (sum, r) => sum + r.rating,
            0
          );
          const newAverage = (totalRating / updatedItems.length).toFixed(1);

          onReviewAdded({
            items: updatedItems,
            count: updatedItems.length,
            averageRating: newAverage,
          });
        }
      }

      // Reset form
      setUserRating(0);
      setReviewText("");
    } catch (err) {
      console.error("Error with review:", err);
      setError(
        err.response?.data?.error ||
          "Failed to submit review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setIsEditing(true);
    setEditReviewId(review.id);
    setUserRating(review.rating);
    setReviewText(review.comment);
    setError(null);
    setSuccess(null);
  };

  // Delete a review
  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete your review?")) {
      return;
    }

    try {
      await api.delete(`/events/reviews/${reviewId}`);

      // Filter out the deleted review
      if (onReviewAdded) {
        const updatedReviews = reviews.items.filter(
          (review) => review.id !== reviewId
        );
        const updatedCount = reviews.count - 1;
        const updatedRating =
          updatedCount > 0
            ? (reviews.averageRating * reviews.count - userReview.rating) /
              updatedCount
            : 0;

        onReviewAdded({
          items: updatedReviews,
          count: updatedCount,
          averageRating: updatedRating.toFixed(1),
        });
      }

      setSuccess("Your review has been deleted");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to delete review. Please try again."
      );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reviews ({reviews.count})</h2>

      {/* Notice for non-logged in users */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
          <FaLock className="text-blue-600 mr-3" />
          <div>
            <p className="text-blue-800">
              You need to be logged in to leave a review.
            </p>
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline mt-1 inline-block"
            >
              Log in to share your experience
            </Link>
          </div>
        </div>
      )}

      {/* Review form */}
      {user && (isEditing || !userReview) && (
        <div className="bg-purple-50 p-6 rounded-lg mb-8 border border-purple-100">
          <h3 className="text-lg font-bold mb-4">
            {isEditing ? "Edit Your Review" : "Leave a Review"}
          </h3>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmitReview}>
            {renderStarInput()}

            <textarea
              className="w-full border border-gray-300 rounded p-3 mb-3"
              placeholder="Share your thoughts about this event..."
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <div className="flex space-x-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditReviewId(null);
                    setUserRating(0);
                    setReviewText("");
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || userRating === 0}
                className={`bg-purple-600 text-white px-4 py-2 rounded ${
                  isSubmitting || userRating === 0
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-purple-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="inline mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : isEditing ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's review */}
      {userReview && !isEditing && (
        <div className="bg-purple-50 p-6 rounded-lg mb-8 border border-purple-100">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold mb-2">Your Review</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditReview(userReview)}
                className="text-blue-600 hover:text-blue-800"
                title="Edit review"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDeleteReview(userReview.id)}
                className="text-red-600 hover:text-red-800"
                title="Delete review"
              >
                <FaTrash />
              </button>
            </div>
          </div>

          {renderStarRating(userReview.rating, `user-review-${userReview.id}`)}
          <p className="mt-2">{userReview.comment}</p>
          <p className="text-sm text-gray-500 mt-1">
            Posted on {formatDate(userReview.created_at)}
          </p>
        </div>
      )}

      {/* Review list */}
      {reviews.items.length === 0 ? (
        <div className="text-center py-10 bg-purple-50 rounded-lg">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaRegStar className="text-purple-600" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-600 mb-4">
            Be the first to share your experience!
          </p>
          {user ? (
            <p className="text-sm text-gray-500">
              Use the form above to leave a review.
            </p>
          ) : (
            <Link
              to="/login"
              className="text-purple-600 font-medium hover:underline"
            >
              Log in to leave a review
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.items
            .filter((review) => !user || review.user_id !== user.id) // Filter out user's own review (shown above)
            .map((review) => (
              <div
                key={`review-item-${review.id}`}
                className="border-b border-gray-200 pb-6"
              >
                <div className="flex items-start">
                  <div className="mr-3">
                    {review.profile_image ? (
                      <img
                        src={review.profile_image}
                        alt={review.user_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <FaUserCircle size={40} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold">{review.user_name}</h4>
                    <div className="flex items-center mt-1">
                      {renderStarRating(review.rating, `review-${review.id}`)}
                      <span className="text-sm text-gray-500 ml-2">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default EventReviews;