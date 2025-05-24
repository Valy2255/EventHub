import { TicketService } from '../services/TicketService.js';

const ticketService = new TicketService();

/**
 * GET /api/tickets
 * Get all tickets for the authenticated user
 */
export const getUserTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ticketsByEvent = await ticketService.getUserTickets(userId);

    res.status(200).json({
      success: true,
      data: ticketsByEvent,
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    next(error);
  }
};

/**
 * GET /api/tickets/upcoming
 * Get upcoming tickets for the authenticated user
 */
export const getUpcomingTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ticketsByEvent = await ticketService.getUpcomingTickets(userId);

    res.status(200).json({
      success: true,
      data: ticketsByEvent,
    });
  } catch (error) {
    console.error("Error fetching upcoming tickets:", error);
    next(error);
  }
};

/**
 * GET /api/tickets/past
 * Get past tickets for the authenticated user
 */
export const getPastTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ticketsByEvent = await ticketService.getPastTickets(userId);

    res.status(200).json({
      success: true,
      data: ticketsByEvent,
    });
  } catch (error) {
    console.error("Error fetching past tickets:", error);
    next(error);
  }
};

/**
 * GET /api/tickets/:id
 * Get a specific ticket by ID
 */
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { ticket, event } = await ticketService.getTicketById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: {
        ticket,
        event,
      },
    });
  } catch (error) {
    if (error.message === 'Ticket not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    if (error.message === 'You do not have permission to view this ticket') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error fetching ticket:", error);
    next(error);
  }
};

/**
 * POST /api/tickets/:id/refund
 * Request a refund for a ticket
 */
export const requestRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const cancelledTicket = await ticketService.requestRefund(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Ticket has been cancelled and refund has been requested',
      data: {
        ticket: cancelledTicket
      }
    });
  } catch (error) {
    if (error.message === 'Ticket not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'You do not have permission to refund this ticket') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('This ticket has already been') || 
        error.message.includes('According to the event\'s cancellation policy')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error('Error processing refund:', error);
    next(error);
  }
};

/**
 * GET /api/tickets/cancelled
 * Get cancelled tickets for the authenticated user
 */
export const getCancelledTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cancelledTickets = await ticketService.getCancelledTickets(userId);

    res.status(200).json({
      success: true,
      data: cancelledTickets,
    });
  } catch (error) {
    console.error("Error fetching cancelled tickets:", error);
    next(error);
  }
};

/**
 * POST /api/tickets/:id/exchange
 * Exchange a ticket for a different ticket type
 */
export const exchangeTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const exchangeData = req.body;
    
    const result = await ticketService.exchangeTicket(id, userId, exchangeData);
    
    res.status(200).json({
      success: true,
      message: 'Ticket has been exchanged successfully',
      data: result
    });
  } catch (error) {
    if (error.message === 'Ticket not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'Selected ticket type not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'You do not have permission to exchange this ticket') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('This ticket has already been') || 
        error.message.includes('According to the event\'s exchange policy') ||
        error.message.includes('You can only exchange tickets') ||
        error.message.includes('Selected ticket type is no longer available') ||
        error.message.includes('Insufficient credits') ||
        error.message.includes('Payment data is required') ||
        error.message.includes('Invalid payment method') ||
        error.message.includes('Payment processing failed')) {
      
      const response = {
        success: false,
        error: error.message
      };
      
      // Add additional data for credit-related errors
      if (error.creditsNeeded) {
        response.creditsNeeded = error.creditsNeeded;
        response.currentCredits = error.currentCredits;
        response.canUseCardPayment = error.canUseCardPayment;
      }
      
      return res.status(400).json(response);
    }

    console.error('Error exchanging ticket:', error);
    next(error);
  }
};