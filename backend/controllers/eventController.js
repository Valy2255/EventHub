// backend/controllers/eventController.js
import * as db from '../config/db.js';
import * as Event from '../models/Event.js';
import * as TicketType from '../models/TicketType.js';
import * as Review from '../models/Review.js';

// Get single event by ID with ticket types and reviews
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch event details
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Fetch ticket types for this event
    const ticketTypes = await TicketType.findByEventId(id);
    
    // Fetch reviews for this event
    const reviews = await Review.findByEventId(id);
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }
    
    // Fetch related events (same category, future dates)
    const relatedEvents = await Event.findRelated(event.category_id, id, 4);
    
    // Construct response
    const response = {
      event,
      ticketTypes,
      reviews: {
        items: reviews,
        count: reviews.length,
        averageRating
      },
      relatedEvents
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error);
  }
};

// Add a view count to an event
export const incrementViewCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Update view count
    await Event.incrementViews(id);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    next(error);
  }
};

// Get all ticket types for an event
export const getEventTicketTypes = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if the event exists
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        error: 'Event not found' 
      });
    }
    
    // Fetch ticket types for this event
    const ticketTypes = await TicketType.findByEventId(id);
    
    res.status(200).json({
      success: true,
      data: ticketTypes
    });
  } catch (error) {
    console.error('Error fetching event ticket types:', error);
    next(error);
  }
};