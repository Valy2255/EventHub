// backend/controllers/ticketController.js
import crypto from "crypto";
import * as Ticket from "../models/Ticket.js";
import * as User from "../models/User.js";
import * as TicketType from "../models/TicketType.js";
import * as Event from "../models/Event.js";
import * as Purchase from "../models/Purchase.js";
import * as Payment from "../models/Payment.js";

// Get all tickets for the authenticated user
export const getUserTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const tickets = await Ticket.findByUser(userId);

    // Group tickets by event for better organization
    const ticketsByEvent = {};

    tickets.forEach((ticket) => {
      const eventId = ticket.event_id;

      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventImage: ticket.image_url,
          tickets: [],
        };
      }

      ticketsByEvent[eventId].tickets.push(ticket);
    });

    res.status(200).json({
      success: true,
      data: Object.values(ticketsByEvent),
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
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

    tickets.forEach((ticket) => {
      const eventId = ticket.event_id;

      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventImage: ticket.image_url,
          tickets: [],
        };
      }

      ticketsByEvent[eventId].tickets.push(ticket);
    });

    res.status(200).json({
      success: true,
      data: Object.values(ticketsByEvent),
    });
  } catch (error) {
    console.error("Error fetching upcoming tickets:", error);
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

    tickets.forEach((ticket) => {
      const eventId = ticket.event_id;

      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventImage: ticket.image_url,
          tickets: [],
        };
      }

      ticketsByEvent[eventId].tickets.push(ticket);
    });

    res.status(200).json({
      success: true,
      data: Object.values(ticketsByEvent),
    });
  } catch (error) {
    console.error("Error fetching past tickets:", error);
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
        error: "Ticket not found",
      });
    }

    // Check if the ticket belongs to the user
    if (ticket.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to view this ticket",
      });
    }

    // Get the event details
    const event = await Event.findById(ticket.event_id);

    res.status(200).json({
      success: true,
      data: {
        ticket,
        event,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
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
    
    // Check if the event allows refunds based on cancellation policy
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // Default refund policy: 24 hours before the event
    let daysBeforeEvent = 1; 
    
    // If there's a cancellation policy, try to extract the number of days
    if (event.cancellation_policy) {
      // Look for patterns like "7 days" or "7-day" in the cancellation policy
      const daysMatch = event.cancellation_policy.match(/(\d+)[\s-]day/i);
      if (daysMatch && daysMatch[1]) {
        daysBeforeEvent = parseInt(daysMatch[1], 10);
      }
    }
    
    // Convert to hours for precise calculation
    const hoursTillEvent = (eventDate - now) / (1000 * 60 * 60);
    const requiredHours = daysBeforeEvent * 24;
    
    if (hoursTillEvent < requiredHours) {
      return res.status(400).json({
        success: false,
        error: `According to the event's cancellation policy, refunds are only available ${daysBeforeEvent} ${daysBeforeEvent === 1 ? 'day' : 'days'} or more before the event`
      });
    }
    
    // Mark the ticket as cancelled with status 'requested'
    const cancelledTicket = await Ticket.updateToCancelled(id, 'requested');
    
    // Update the ticket type availability - adding 1 back to available quantity
    try {
      await TicketType.increaseAvailability(ticket.ticket_type_id, 1);
    } catch (err) {
      console.warn('Error updating ticket availability:', err.message);
      // Continue with the refund process even if availability update fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Ticket has been cancelled and refund has been requested',
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
        error: "QR code is required",
      });
    }

    const ticket = await Ticket.validateQrCode(qrCode);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Invalid or expired ticket",
      });
    }

    // Check if the ticket has already been used
    if (ticket.checked_in) {
      return res.status(400).json({
        success: false,
        error: "This ticket has already been used",
        data: {
          ticket,
          checkedInAt: ticket.checked_in_at,
        },
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
        message: "Valid ticket for a future event",
        data: {
          ticket,
          status: "FUTURE_EVENT",
        },
      });
    }

    // Check if the ticket is for today or past
    if (eventDate.getTime() === now.getTime()) {
      // Valid ticket for today
      return res.status(200).json({
        success: true,
        message: "Valid ticket for today's event",
        data: {
          ticket,
          status: "VALID_TODAY",
        },
      });
    } else {
      // Ticket for past event
      return res.status(200).json({
        success: true,
        message: "Ticket is for a past event",
        data: {
          ticket,
          status: "PAST_EVENT",
        },
      });
    }
  } catch (error) {
    console.error("Error validating ticket:", error);
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
        error: "Ticket not found",
      });
    }

    // Check if the ticket is already checked in
    if (ticket.checked_in) {
      return res.status(400).json({
        success: false,
        error: "This ticket has already been checked in",
        data: {
          ticket,
          checkedInAt: ticket.checked_in_at,
        },
      });
    }

    // Update check-in status
    const updatedTicket = await Ticket.updateCheckinStatus(id, true);

    res.status(200).json({
      success: true,
      message: "Ticket checked in successfully",
      data: {
        ticket: updatedTicket,
      },
    });
  } catch (error) {
    console.error("Error checking in ticket:", error);
    next(error);
  }
};

// Update ticket status (admin only)
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["purchased", "cancelled", "expired"].includes(status)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid status. Status must be one of: purchased, cancelled, expired",
      });
    }

    // Find the ticket
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    // Update status based on the requested status
    let updatedTicket;

    if (status === "purchased") {
      // For purchased status, we would need the QR code
      return res.status(400).json({
        success: false,
        error:
          "Cannot directly update to purchased status. Use the payment flow instead.",
      });
    } else if (status === "cancelled") {
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
        values: [id, status],
      };

      const result = await db.query(query);
      updatedTicket = result.rows[0];
    }

    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: {
        ticket: updatedTicket,
      },
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    next(error);
  }
};

// Get cancelled tickets for the authenticated user
export const getCancelledTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cancelledTickets = await Ticket.findCancelledByUser(userId);

    res.status(200).json({
      success: true,
      data: cancelledTickets,
    });
  } catch (error) {
    console.error("Error fetching cancelled tickets:", error);
    next(error);
  }
};

// Exchange a ticket for a different ticket type
export const exchangeTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      new_ticket_type_id,
      paymentMethod = 'credit',
      paymentData       // For card payments
    } = req.body;
    
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
        error: 'You do not have permission to exchange this ticket'
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
        error: 'This ticket has already been used and cannot be exchanged'
      });
    }
    
    // Get the event details for the exchange policy
    const event = await Event.findById(ticket.event_id);
    
    // Check if the event allows exchanges based on time to event
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // Default exchange policy: 48 hours before the event
    let hoursBeforeEvent = 48; 
    
    // If there's an exchange policy, try to extract the number of hours
    if (event.exchange_policy) {
      const hoursMatch = event.exchange_policy.match(/(\d+)[\s-]hour/i);
      if (hoursMatch && hoursMatch[1]) {
        hoursBeforeEvent = parseInt(hoursMatch[1], 10);
      }
    }
    
    // Calculate hours till event
    const hoursTillEvent = (eventDate - now) / (1000 * 60 * 60);
    
    if (hoursTillEvent < hoursBeforeEvent) {
      return res.status(400).json({
        success: false,
        error: `According to the event's exchange policy, exchanges are only available ${hoursBeforeEvent} hours or more before the event`
      });
    }
    
    // Get the new ticket type
    const newTicketType = await TicketType.findById(new_ticket_type_id);
    
    if (!newTicketType) {
      return res.status(404).json({
        success: false,
        error: 'Selected ticket type not found'
      });
    }
    
    // Check if the new ticket type belongs to the same event
    if (newTicketType.event_id !== ticket.event_id) {
      return res.status(400).json({
        success: false,
        error: 'You can only exchange tickets within the same event'
      });
    }
    
    // Check if the new ticket type has available tickets
    if (newTicketType.available_quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Selected ticket type is no longer available'
      });
    }
    
    // Calculate price difference
    const currentPrice = parseFloat(ticket.price);
    const newPrice = parseFloat(newTicketType.price);
    const priceDifference = newPrice - currentPrice;
    
    // Handle payment based on price difference and payment method
    let paymentId = null;
    
    if (priceDifference > 0) {
      // Upgrading to more expensive ticket
      if (paymentMethod === 'credit') {
        // Check if user has enough credits for an upgrade
        const userCredits = await User.getCreditBalance(userId);
        
        if (userCredits < priceDifference) {
          return res.status(400).json({
            success: false,
            error: `Insufficient credits for upgrade. You need ${priceDifference.toFixed(2)} credits, but have ${userCredits.toFixed(2)}.`,
            creditsNeeded: priceDifference,
            currentCredits: userCredits,
            canUseCardPayment: true
          });
        }
        
        // Deduct credits for the upgrade
        await User.addCredits(
          userId,
          -priceDifference,
          'exchange_payment',
          `Upgrade from ${ticket.ticket_type_name} to ${newTicketType.name}`,
          ticket.id,
          'ticket_exchange'
        );
      } else if (paymentMethod === 'card') {
        // Use card payment for the upgrade
        if (!paymentData) {
          return res.status(400).json({
            success: false,
            error: 'Payment data is required for card payments'
          });
        }
        
        // Process card payment - This is a simplified version
        // In a real implementation, you would integrate with a payment processor
        try {
          // Create a payment record
          const payment = await Payment.create(global.pool, {
            user_id: userId,
            amount: priceDifference,
            currency: 'USD',
            payment_method: 'card',
            transaction_id: `tx_exchange_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
            status: 'succeeded'
          });
          
          paymentId = payment.id;
          
          // In a real implementation, you would call your payment processor here
        } catch (paymentError) {
          console.error('Payment processing error:', paymentError);
          return res.status(400).json({
            success: false,
            error: 'Payment processing failed. Please try again.'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment method. Please use "credit" or "card".'
        });
      }
    } else if (priceDifference < 0) {
      // Downgrading to a cheaper ticket - refund credits
      const creditAmount = Math.abs(priceDifference);
      
      await User.addCredits(
        userId,
        creditAmount,
        'exchange_refund',
        `Exchange from ${ticket.ticket_type_name} to ${newTicketType.name}`,
        ticket.id,
        'ticket_exchange'
      );
    }
    
    // Increase availability for old ticket type
    await TicketType.increaseAvailability(ticket.ticket_type_id, 1);
    
    // Decrease availability for new ticket type
    await TicketType.decreaseAvailability(new_ticket_type_id, 1);
    
    // Update the ticket with new ticket type
    const updatedTicket = await Ticket.exchangeTicketType(id, new_ticket_type_id, newPrice);
    
    // Get the updated user credit balance
    const updatedCredits = await User.getCreditBalance(userId);
    
    // Only create a purchase record if there was a price difference
    if (priceDifference !== 0) {
      const client = await global.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create purchase record for the exchange
        const purchaseData = {
          user_id: userId,
          order_id: `EXCHANGE-${Date.now()}`,
          total: Math.abs(priceDifference),
          subtotal: Math.abs(priceDifference),
          discounts: 0,
          payment_method: paymentMethod,  // Use the selected payment method
          payment_status: 'completed'
        };

        // Create purchase items
        const purchaseItems = [{
          ticket_type_id: new_ticket_type_id,
          quantity: 1,
          price: newPrice
        }];

        const purchase = await Purchase.createPurchase(client, purchaseData, purchaseItems);
        
        // Link ticket to purchase
        await client.query(
          'UPDATE tickets SET purchase_id = $1 WHERE id = $2',
          [purchase.id, id]
        );
        
        // If payment was done by card, link the payment to the purchase
        if (paymentId) {
          await client.query(
            'UPDATE credit_transactions SET reference_id = $1, reference_type = $2 WHERE id = $3',
            [purchase.id, 'purchase', paymentId]
          );
        }
        
        await client.query('COMMIT');
        
        // Add purchase_id to the response
        res.status(200).json({
          success: true,
          message: 'Ticket has been exchanged successfully',
          data: {
            ticket: updatedTicket,
            priceDifference,
            paymentMethod,
            creditsChange: priceDifference < 0 ? Math.abs(priceDifference) : -priceDifference,
            currentCredits: updatedCredits,
            purchase_id: purchase.id
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // No price difference, so no purchase record needed
      res.status(200).json({
        success: true,
        message: 'Ticket has been exchanged successfully',
        data: {
          ticket: updatedTicket,
          priceDifference,
          creditsChange: 0,
          currentCredits: updatedCredits
        }
      });
    }
  } catch (error) {
    console.error('Error exchanging ticket:', error);
    next(error);
  }
};