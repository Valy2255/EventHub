// backend/services/EventService.js
import { BaseService } from './BaseService.js';
import * as EventModel from '../models/Event.js';
import * as TicketTypeModel from '../models/TicketType.js';
import * as ReviewModel from '../models/Review.js';

export class EventService extends BaseService {
  async getEventById(id) {
    // Fetch event details
    const event = await EventModel.findById(id);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Fetch ticket types for this event
    const ticketTypes = await TicketTypeModel.findByEventId(id);
    
    // Fetch reviews for this event
    const reviews = await ReviewModel.findByEventId(id);
    
    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }
    
    // Fetch related events (same category, future dates)
    const relatedEvents = await EventModel.findRelated(event.category_id, id, 4);
    
    // Construct response
    return {
      event,
      ticketTypes,
      reviews: {
        items: reviews,
        count: reviews.length,
        averageRating
      },
      relatedEvents
    };
  }

  async incrementViewCount(id) {
    return EventModel.incrementViews(id);
  }

  async getEventTicketTypes(id) {
    // Check if the event exists
    const event = await EventModel.findById(id);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Fetch ticket types for this event
    const ticketTypes = await TicketTypeModel.findByEventId(id);
    
    return ticketTypes;
  }

  async createEvent(eventData) {
    return this.executeInTransaction(async (client) => {
      return EventModel.create(eventData, client);
    });
  }

  async updateEvent(id, eventData) {
    return this.executeInTransaction(async (client) => {
      const result = await EventModel.update(id, eventData, client);
      
      if (!result) {
        throw new Error('Event not found');
      }
      
      return result;
    });
  }

  async deleteEvent(id) {
    return this.executeInTransaction(async (client) => {
      const result = await EventModel.deleteEvent(id, client);
      
      if (!result) {
        throw new Error('Event not found');
      }
      
      return result;
    });
  }

  async findAllEvents(filters = {}, pagination = {}) {
    return EventModel.findAll(filters, pagination);
  }

  async findRelatedEvents(categoryId, currentEventId, limit = 4) {
    return EventModel.findRelated(categoryId, currentEventId, limit);
  }

  // Helper method for checking event permissions
  async checkEventPermission(eventId, userId) {
    return EventModel.checkEventPermission(eventId, userId);
  }
}