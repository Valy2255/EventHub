import { BaseService } from './BaseService.js';
import * as Ticket from '../models/Ticket.js';
import * as TicketType from '../models/TicketType.js';
import * as Event from '../models/Event.js';
import * as User from '../models/User.js';
import * as Purchase from '../models/Purchase.js';
import * as Payment from '../models/Payment.js';
import crypto from 'crypto';

export class TicketService extends BaseService {
  // Get all tickets for a user, grouped by event
  async getUserTickets(userId) {
    const tickets = await Ticket.findByUser(userId);
    return this.groupTicketsByEvent(tickets);
  }

  // Get upcoming tickets for a user
  async getUpcomingTickets(userId) {
    const tickets = await Ticket.findUpcomingByUser(userId);
    return this.groupTicketsByEvent(tickets);
  }

  // Get past tickets for a user
  async getPastTickets(userId) {
    const tickets = await Ticket.findPastByUser(userId);
    return this.groupTicketsByEvent(tickets);
  }

  // Get cancelled tickets for a user
  async getCancelledTickets(userId) {
    return await Ticket.findCancelledByUser(userId);
  }

  // Get a specific ticket with event details
  async getTicketById(ticketId, userId, userRole) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Check permissions
    if (ticket.user_id !== userId && userRole !== 'admin') {
      throw new Error('You do not have permission to view this ticket');
    }

    const event = await Event.findById(ticket.event_id);
    
    return { ticket, event };
  }

  // Request a refund for a ticket
  async requestRefund(ticketId, userId) {
    return this.executeInTransaction(async (client) => {
      const ticket = await Ticket.findById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Permission check
      if (ticket.user_id !== userId) {
        throw new Error('You do not have permission to refund this ticket');
      }

      // Status validations
      this.validateTicketForRefund(ticket);

      // Get event and validate refund policy
      const event = await Event.findById(ticket.event_id);
      this.validateRefundPolicy(event);

      // Process refund
      const cancelledTicket = await Ticket.updateToCancelled(ticketId, 'requested');
      
      // Update ticket type availability
      try {
        await TicketType.increaseAvailability(ticket.ticket_type_id, 1);
      } catch (err) {
        console.warn('Error updating ticket availability:', err.message);
      }

      return cancelledTicket;
    });
  }

  // Exchange a ticket for a different ticket type
  async exchangeTicket(ticketId, userId, exchangeData) {
    return this.executeInTransaction(async (client) => {
      const { new_ticket_type_id, paymentMethod = 'credit', paymentData } = exchangeData;
      
      const ticket = await Ticket.findById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Permission and status validations
      this.validateTicketForExchange(ticket, userId);

      // Get event and validate exchange policy
      const event = await Event.findById(ticket.event_id);
      this.validateExchangePolicy(event);

      // Get and validate new ticket type
      const newTicketType = await this.validateNewTicketType(new_ticket_type_id, ticket.event_id);

      // Calculate price difference and handle payment
      const priceDifference = parseFloat(newTicketType.price) - parseFloat(ticket.price);
      const paymentId = await this.handleExchangePayment(
        userId, 
        priceDifference, 
        paymentMethod, 
        paymentData, 
        ticket, 
        newTicketType
      );

      // Update ticket type availabilities
      await TicketType.increaseAvailability(ticket.ticket_type_id, 1);
      await TicketType.decreaseAvailability(new_ticket_type_id, 1);

      // Update the ticket
      const updatedTicket = await Ticket.exchangeTicketType(
        ticketId, 
        new_ticket_type_id, 
        newTicketType.price
      );

      // Get updated user credits
      const updatedCredits = await User.getCreditBalance(userId);

      // Create purchase record if there was a price difference
      let purchaseId = null;
      if (priceDifference !== 0) {
        purchaseId = await this.createExchangePurchaseRecord(
          client,
          userId, 
          new_ticket_type_id, 
          newTicketType.price, 
          Math.abs(priceDifference), 
          paymentMethod, 
          ticketId, 
          paymentId
        );
      }

      return {
        ticket: updatedTicket,
        priceDifference,
        paymentMethod,
        creditsChange: priceDifference < 0 ? Math.abs(priceDifference) : -priceDifference,
        currentCredits: updatedCredits,
        purchase_id: purchaseId
      };
    });
  }

  // Check in a ticket
  async checkInTicket(ticketId, userId, checkedInBy = null) {
    return this.executeInTransaction(async (client) => {
      const ticket = await Ticket.findById(ticketId);
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Validate ticket for check-in
      this.validateTicketForCheckIn(ticket);

      // Update check-in status
      const updatedTicket = await Ticket.updateCheckinStatus(ticketId, true, checkedInBy);
      
      return updatedTicket;
    });
  }

  // Get ticket type by ID
  async getTicketTypeById(ticketTypeId) {
    const ticketType = await TicketType.findById(ticketTypeId);
    if (!ticketType) {
      throw new Error('Ticket type not found');
    }
    return ticketType;
  }

  // Get ticket types for an event
  async getTicketTypesByEvent(eventId) {
    return await TicketType.findByEventId(eventId);
  }

  // Private helper methods
  groupTicketsByEvent(tickets) {
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

    return Object.values(ticketsByEvent);
  }

  validateTicketForRefund(ticket) {
    if (ticket.status === 'cancelled') {
      throw new Error('This ticket has already been cancelled');
    }
    
    if (ticket.checked_in) {
      throw new Error('This ticket has already been used and cannot be refunded');
    }
  }

  validateTicketForExchange(ticket, userId) {
    if (ticket.user_id !== userId) {
      throw new Error('You do not have permission to exchange this ticket');
    }
    
    if (ticket.status === 'cancelled') {
      throw new Error('This ticket has already been cancelled');
    }
    
    if (ticket.checked_in) {
      throw new Error('This ticket has already been used and cannot be exchanged');
    }
  }

  validateTicketForCheckIn(ticket) {
    if (ticket.status === 'cancelled') {
      throw new Error('This ticket has been cancelled and cannot be checked in');
    }
    
    if (ticket.checked_in) {
      throw new Error('This ticket has already been checked in');
    }
  }

  validateRefundPolicy(event) {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // Default refund policy: 24 hours before the event
    let daysBeforeEvent = 1;
    
    if (event.cancellation_policy) {
      const daysMatch = event.cancellation_policy.match(/(\d+)[\s-]day/i);
      if (daysMatch && daysMatch[1]) {
        daysBeforeEvent = parseInt(daysMatch[1], 10);
      }
    }
    
    const hoursTillEvent = (eventDate - now) / (1000 * 60 * 60);
    const requiredHours = daysBeforeEvent * 24;
    
    if (hoursTillEvent < requiredHours) {
      throw new Error(
        `According to the event's cancellation policy, refunds are only available ${daysBeforeEvent} ${daysBeforeEvent === 1 ? 'day' : 'days'} or more before the event`
      );
    }
  }

  validateExchangePolicy(event) {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // Default exchange policy: 48 hours before the event
    let hoursBeforeEvent = 48;
    
    if (event.exchange_policy) {
      const hoursMatch = event.exchange_policy.match(/(\d+)[\s-]hour/i);
      if (hoursMatch && hoursMatch[1]) {
        hoursBeforeEvent = parseInt(hoursMatch[1], 10);
      }
    }
    
    const hoursTillEvent = (eventDate - now) / (1000 * 60 * 60);
    
    if (hoursTillEvent < hoursBeforeEvent) {
      throw new Error(
        `According to the event's exchange policy, exchanges are only available ${hoursBeforeEvent} hours or more before the event`
      );
    }
  }

  async validateNewTicketType(newTicketTypeId, eventId) {
    const newTicketType = await TicketType.findById(newTicketTypeId);
    
    if (!newTicketType) {
      throw new Error('Selected ticket type not found');
    }
    
    if (newTicketType.event_id !== eventId) {
      throw new Error('You can only exchange tickets within the same event');
    }
    
    if (newTicketType.available_quantity <= 0) {
      throw new Error('Selected ticket type is no longer available');
    }
    
    return newTicketType;
  }

  async handleExchangePayment(userId, priceDifference, paymentMethod, paymentData, ticket, newTicketType) {
    let paymentId = null;
    
    if (priceDifference > 0) {
      // Upgrading to more expensive ticket
      if (paymentMethod === 'credit') {
        await this.handleCreditPayment(userId, priceDifference, ticket, newTicketType);
      } else if (paymentMethod === 'card') {
        paymentId = await this.handleCardPayment(userId, priceDifference, paymentData);
      } else {
        throw new Error('Invalid payment method. Please use "credit" or "card".');
      }
    } else if (priceDifference < 0) {
      // Downgrading to a cheaper ticket - refund credits
      await this.handleCreditRefund(userId, Math.abs(priceDifference), ticket, newTicketType);
    }
    
    return paymentId;
  }

  async handleCreditPayment(userId, amount, ticket, newTicketType) {
    const userCredits = await User.getCreditBalance(userId);
    
    if (userCredits < amount) {
      const error = new Error(
        `Insufficient credits for upgrade. You need ${amount.toFixed(2)} credits, but have ${userCredits.toFixed(2)}.`
      );
      error.creditsNeeded = amount;
      error.currentCredits = userCredits;
      error.canUseCardPayment = true;
      throw error;
    }
    
    await User.addCredits(
      userId,
      -amount,
      'exchange_payment',
      `Upgrade from ${ticket.ticket_type_name} to ${newTicketType.name}`,
      ticket.id,
      'ticket_exchange'
    );
  }

  async handleCardPayment(userId, amount, paymentData) {
    if (!paymentData) {
      throw new Error('Payment data is required for card payments');
    }
    
    try {
      const payment = await Payment.create(global.pool, {
        user_id: userId,
        amount: amount,
        currency: 'USD',
        payment_method: 'card',
        transaction_id: `tx_exchange_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        status: 'succeeded'
      });
      
      return payment.id;
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      throw new Error('Payment processing failed. Please try again.');
    }
  }

  async handleCreditRefund(userId, amount, ticket, newTicketType) {
    await User.addCredits(
      userId,
      amount,
      'exchange_refund',
      `Exchange from ${ticket.ticket_type_name} to ${newTicketType.name}`,
      ticket.id,
      'ticket_exchange'
    );
  }

  async createExchangePurchaseRecord(client, userId, ticketTypeId, price, amount, paymentMethod, ticketId, paymentId) {
    const purchaseData = {
      user_id: userId,
      order_id: `EXCHANGE-${Date.now()}`,
      total: amount,
      subtotal: amount,
      discounts: 0,
      payment_method: paymentMethod,
      payment_status: 'completed'
    };

    const purchaseItems = [{
      ticket_type_id: ticketTypeId,
      quantity: 1,
      price: price
    }];

    const purchase = await Purchase.createPurchase(client, purchaseData, purchaseItems);
    
    // Link ticket to purchase
    await client.query(
      'UPDATE tickets SET purchase_id = $1 WHERE id = $2',
      [purchase.id, ticketId]
    );
    
    // If payment was done by card, link the payment to the purchase
    if (paymentId) {
      await client.query(
        'UPDATE credit_transactions SET reference_id = $1, reference_type = $2 WHERE id = $3',
        [purchase.id, 'purchase', paymentId]
      );
    }
    
    return purchase.id;
  }
}