import { EventService } from '../services/EventService.js';

const eventService = new EventService();

// Get single event by ID with ticket types and reviews
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await eventService.getEventById(id);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error fetching event details:', error);
    next(error);
  }
};

// Add a view count to an event
export const incrementViewCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    await eventService.incrementViewCount(id);
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
    const ticketTypes = await eventService.getEventTicketTypes(id);
    
    res.status(200).json({
      success: true,
      data: ticketTypes
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }
    console.error('Error fetching event ticket types:', error);
    next(error);
  }
};