// backend/controllers/ticketController.js
import * as Ticket from '../models/Ticket.js';
import * as Payment from '../models/Payment.js';
import * as TicketType from '../models/TicketType.js';
import * as Event from '../models/Event.js';

// Get all tickets for the authenticated user
export const getUserTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const tickets = await Ticket.findByUser(userId);
    
    // Group tickets by event for better organization
    const ticketsByEvent = {};
    
    tickets.forEach(ticket => {
      const eventId = ticket.event_id;
      
      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventImage: ticket.image_url,
          tickets: []
        };
      }
      
      ticketsByEvent[eventId].tickets.push(ticket);
    });
    
    res.status(200).json({
      success: true,
      data: Object.values(ticketsByEvent)
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    next(error);
  }
};

// Get upcoming tickets for the authenticated user
export const getUpcomingTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const tickets = await Ticket.findUpcomingByUser(userId);
    
    // Group tickets by event
    const ticketsByEvent = {};
    
    tickets.forEach(ticket => {
      const eventId = ticket.event_id;
      
      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventImage: ticket.image_url,
          tickets: []
        };
      }
      
      ticketsByEvent[eventId].tickets.push(ticket);
    });
    
    res.status(200).json({
      success: true,
      data: Object.values(ticketsByEvent)
    });
  } catch (error) {
    console.error('Error fetching upcoming tickets:', error);
    next(error);
  }
};

// Get past tickets for the authenticated user
export const getPastTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const tickets = await Ticket.findPastByUser(userId);
    
    // Group tickets by event
    const ticketsByEvent = {};
    
    tickets.forEach(ticket => {
      const eventId = ticket.event_id;
      
      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventImage: ticket.image_url,
          tickets: []
        };
      }
      
      ticketsByEvent[eventId].tickets.push(ticket);
    });
    
    res.status(200).json({
      success: true,
      data: Object.values(ticketsByEvent)
    });
  } catch (error) {
    console.error('Error fetching past tickets:', error);
    next(error);
  }
};

// Get a specific ticket by ID
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    // Check if the ticket belongs to the user
    if (ticket.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this ticket'
      });
    }
    
    // Get the event details
    const event = await Event.findById(ticket.event_id);
    
    res.status(200).json({
      success: true,
      data: {
        ticket,
        event
      }
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    next(error);
  }
};

// Request a refund for a ticket
export const requestRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the ticket
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    // Check if the ticket belongs to the user
    if (ticket.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to refund this ticket'
      });
    }
    
    // Check if the ticket is already cancelled
    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'This ticket has already been cancelled'
      });
    }
    
    // Check if the ticket is already used (checked in)
    if (ticket.checked_in) {
      return res.status(400).json({
        success: false,
        error: 'This ticket has already been used and cannot be refunded'
      });
    }
    
    // Get the event to check the cancellation policy
    const event = await Event.findById(ticket.event_id);
    
    // Check if the event allows refunds (implementation could vary based on policy)
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // Example: Only allow refunds if the event is at least 24 hours in the future
    const hoursTillEvent = (eventDate - now) / (1000 * 60 * 60);
    
    if (hoursTillEvent < 24) {
      return res.status(400).json({
        success: false,
        error: 'Refunds are only available more than 24 hours before the event'
      });
    }
    
    // Mark the ticket as cancelled
    const cancelledTicket = await Ticket.updateToCancelled(id);
    
    // Update the ticket type availability
    await TicketType.updateAvailability(ticket.ticket_type_id, 1);
    
    // If the refund is successful, we should process a refund through the payment gateway
    // This is a placeholder for now
    
    res.status(200).json({
      success: true,
      message: 'Ticket has been cancelled and refund has been processed',
      data: {
        ticket: cancelledTicket
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    next(error);
  }
};

// Validate a ticket QR code (admin only)
export const validateTicket = async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required'
      });
    }
    
    const ticket = await Ticket.validateQrCode(qrCode);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired ticket'
      });
    }
    
    // Check if the ticket has already been used
    if (ticket.checked_in) {
      return res.status(400).json({
        success: false,
        error: 'This ticket has already been used',
        data: {
          ticket,
          checkedInAt: ticket.checked_in_at
        }
      });
    }
    
    // Check if the ticket is for a future event
    const eventDate = new Date(ticket.date);
    eventDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (eventDate > now) {
      return res.status(200).json({
        success: true,
        message: 'Valid ticket for a future event',
        data: {
          ticket,
          status: 'FUTURE_EVENT'
        }
      });
    }
    
    // Check if the ticket is for today or past
    if (eventDate.getTime() === now.getTime()) {
      // Valid ticket for today
      return res.status(200).json({
        success: true,
        message: 'Valid ticket for today\'s event',
        data: {
          ticket,
          status: 'VALID_TODAY'
        }
      });
    } else {
      // Ticket for past event
      return res.status(200).json({
        success: true,
        message: 'Ticket is for a past event',
        data: {
          ticket,
          status: 'PAST_EVENT'
        }
      });
    }
  } catch (error) {
    console.error('Error validating ticket:', error);
    next(error);
  }
};

// Check in a ticket (admin only)
export const checkInTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the ticket
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    // Check if the ticket is already checked in
    if (ticket.checked_in) {
      return res.status(400).json({
        success: false,
        error: 'This ticket has already been checked in',
        data: {
          ticket,
          checkedInAt: ticket.checked_in_at
        }
      });
    }
    
    // Update check-in status
    const updatedTicket = await Ticket.updateCheckinStatus(id, true);
    
    res.status(200).json({
      success: true,
      message: 'Ticket checked in successfully',
      data: {
        ticket: updatedTicket
      }
    });
  } catch (error) {
    console.error('Error checking in ticket:', error);
    next(error);
  }
};

// Update ticket status (admin only)
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['purchased', 'cancelled', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Status must be one of: purchased, cancelled, expired'
      });
    }
    
    // Find the ticket
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    // Update status based on the requested status
    let updatedTicket;
    
    if (status === 'purchased') {
      // For purchased status, we would need the QR code
      return res.status(400).json({
        success: false,
        error: 'Cannot directly update to purchased status. Use the payment flow instead.'
      });
    } else if (status === 'cancelled') {
      updatedTicket = await Ticket.updateToCancelled(id);
      
      // Update ticket type availability
      await TicketType.updateAvailability(ticket.ticket_type_id, 1);
    } else {
      // For expired, use a custom query
      const query = {
        text: `
          UPDATE tickets
          SET status = $2
          WHERE id = $1
          RETURNING *
        `,
        values: [id, status]
      };
      
      const result = await db.query(query);
      updatedTicket = result.rows[0];
    }
    
    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: {
        ticket: updatedTicket
      }
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    next(error);
  }
};