import { BaseService } from './BaseService.js';
import * as Payment from '../models/Payment.js';
import * as Ticket from '../models/Ticket.js';
import * as TicketType from '../models/TicketType.js';
import * as Event from '../models/Event.js';
import * as User from '../models/User.js';
import * as Purchase from '../models/Purchase.js';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { sendTicketEmail } from '../utils/emailService.js';

export class PaymentService extends BaseService {
  // Process payment and create tickets
  async processPayment(userId, paymentData) {
    return this.executeInTransaction(async (client) => {
      const { 
        amount, 
        currency = "USD", 
        tickets, 
        savedCardId, 
        saveCard, 
        cardDetails, 
        paymentMethod,
        useCredits = false 
      } = paymentData;

      // Validate the request
      this.validatePaymentRequest(amount, tickets);

      let usedPaymentMethodId = null;
      let finalPaymentMethod = paymentMethod;

      // Handle payment based on method
      if (useCredits === true) {
        await this.processCreditPayment(userId, amount);
        finalPaymentMethod = "credits";
      } else if (paymentMethod === "card") {
        usedPaymentMethodId = await this.processCardPayment(
          client, 
          userId, 
          savedCardId, 
          saveCard, 
          cardDetails
        );
        finalPaymentMethod = "card";
      }

      // Create payment record
      const payment = await Payment.create(client, {
        user_id: userId,
        amount,
        currency,
        payment_method: finalPaymentMethod,
        payment_method_id: usedPaymentMethodId,
        transaction_id: `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        status: "succeeded",
      });

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create tickets
      const createdTickets = await this.createTickets(client, tickets, userId, payment.id);

      // Create purchase record
      const purchase = await this.createPurchaseRecord(
        client, 
        userId, 
        orderNumber, 
        amount, 
        finalPaymentMethod, 
        usedPaymentMethodId, 
        tickets
      );

      // Link tickets to purchase
      await this.linkTicketsToPurchase(client, createdTickets, purchase.id);

      // Handle credit transaction linking if credits were used
      if (useCredits === true) {
        await this.linkCreditTransaction(client, userId, payment.id);
      }

      return {
        payment,
        purchase,
        createdTickets,
        orderNumber,
        paymentMethod: finalPaymentMethod,
        savedCardId: usedPaymentMethodId,
        currentCredits: useCredits ? await User.getCreditBalance(userId) : null
      };
    });
  }

  // Get payment history for user
  async getPaymentHistory(userId) {
    return await Payment.findByUserId(userId);
  }

  // Get payment details with linked tickets
  async getPaymentDetails(paymentId, userId) {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify that the payment belongs to the user
    if (payment.user_id !== userId) {
      throw new Error('Unauthorized access to this payment');
    }

    // Get linked tickets
    const tickets = await Payment.getPaymentTickets(paymentId);

    return { payment, tickets };
  }

  // Send ticket email
  async sendTicketEmail(userEmail, userName, tickets, orderNumber) {
    try {
      await sendTicketEmail(userEmail, userName, tickets, orderNumber);
    } catch (emailErr) {
      console.error("Error sending ticket email:", emailErr);
      // Don't throw error as email failure shouldn't fail the payment
    }
  }

  // Private helper methods
  validatePaymentRequest(amount, tickets) {
    if (!amount || amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      throw new Error("No tickets provided");
    }
  }

  async processCreditPayment(userId, amount) {
    console.log("Using credits for payment");
    const userCredits = await User.getCreditBalance(userId);

    if (userCredits < amount) {
      const error = new Error("Insufficient credits");
      error.creditsNeeded = amount;
      error.currentCredits = userCredits;
      throw error;
    }

    await User.addCredits(
      userId,
      -amount,
      "purchase",
      `Purchase of tickets`,
      null,
      "payment"
    );
  }

  async processCardPayment(client, userId, savedCardId, saveCard, cardDetails) {
    let usedPaymentMethodId = null;

    if (savedCardId) {
      // Process payment with saved card
      console.log("Using saved card for payment:", savedCardId);
      
      const savedCardQuery = {
        text: "SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2",
        values: [savedCardId, userId]
      };
      
      const savedCardResult = await client.query(savedCardQuery);
      
      if (savedCardResult.rows.length === 0) {
        throw new Error("Saved card not found");
      }
      
      const savedCard = savedCardResult.rows[0];
      console.log(`Using saved card: ${savedCard.card_type} ending in ${savedCard.last_four}`);
      
      usedPaymentMethodId = savedCardId;
    } else if (saveCard && cardDetails) {
      // Save the new card first
      usedPaymentMethodId = await this.saveNewCard(client, userId, cardDetails);
    }

    return usedPaymentMethodId;
  }

  async saveNewCard(client, userId, cardDetails) {
    console.log("Saving new card during checkout");
    
    const { cardNumber, cardHolderName, expiryDate, isDefault = false } = cardDetails;
    
    if (!cardNumber || !cardHolderName || !expiryDate) {
      throw new Error("Missing required card details");
    }
    
    // Format and extract data
    const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
    const cardType = this.getCardType(cardNumber);
    const [expiryMonth, expiryYear] = expiryDate.split('/');
    const token = `tok_${Date.now()}`;
    
    // If this is the default card, first unset any existing default
    if (isDefault) {
      await client.query(
        `UPDATE payment_methods SET is_default = false WHERE user_id = $1`,
        [userId]
      );
    }
    
    // Insert the new payment method
    const newCardQuery = {
      text: `INSERT INTO payment_methods 
             (user_id, card_type, last_four, card_holder_name, expiry_month, expiry_year, is_default, token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
      values: [userId, cardType, lastFour, cardHolderName, expiryMonth, expiryYear, isDefault, token]
    };
    
    const newCardResult = await client.query(newCardQuery);
    const newCardId = newCardResult.rows[0].id;
    
    console.log(`Created new card with ID: ${newCardId}`);
    
    return newCardId;
  }

  getCardType(cardNumber) {
    const sanitized = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(sanitized)) return 'Visa';
    if (/^5[1-5]/.test(sanitized)) return 'Mastercard';
    if (/^3[47]/.test(sanitized)) return 'American Express';
    if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
    if (/^(?:2131|1800|35)/.test(sanitized)) return 'JCB';
    
    return 'Unknown';
  }

  generateOrderNumber() {
    return `ORD-${Date.now().toString().substring(6)}-${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;
  }

  async createTickets(client, tickets, userId, paymentId) {
    const createdTickets = [];

    for (const ticketData of tickets) {
      const { ticketTypeId, quantity, price, eventId } = ticketData;
      const ticketTypeIdNum = parseInt(ticketTypeId, 10);

      if (isNaN(ticketTypeIdNum)) {
        throw new Error(`Invalid ticket type ID: ${ticketTypeId}`);
      }

      const ticketType = await TicketType.findById(ticketTypeIdNum);

      if (!ticketType) {
        throw new Error(`Ticket type with ID ${ticketTypeIdNum} not found`);
      }

      if (ticketType.available_quantity < quantity) {
        throw new Error(`Not enough tickets available for ${ticketType.name}`);
      }

      const event = await Event.findById(eventId);

      for (let i = 0; i < quantity; i++) {
        const ticket = await Ticket.createPurchased(client, {
          ticket_type_id: ticketTypeIdNum,
          user_id: userId,
          event_id: eventId,
          price,
          qr_code: null,
        });

        const secureTicketData = {
          id: ticket.id,
          hash: Ticket.generateTicketHash(ticket.id, eventId, userId),
          v: 1,
        };

        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(secureTicketData));

        const updatedTicket = await client.query(
          "UPDATE tickets SET qr_code = $1 WHERE id = $2 RETURNING *",
          [qrCodeDataUrl, ticket.id]
        );

        await Payment.linkTicketToPayment(client, paymentId, ticket.id);

        createdTickets.push({
          ...updatedTicket.rows[0],
          qr_code: qrCodeDataUrl,
          event_name: event.name,
          ticket_type_name: ticketType.name,
          date: event.date,
          time: event.time,
          venue: event.venue,
        });
      }

      try {
        await TicketType.updateAvailability(ticketTypeIdNum, -quantity);
      } catch (err) {
        console.warn("Error updating ticket availability:", err.message);
      }
    }

    return createdTickets;
  }

  async createPurchaseRecord(client, userId, orderNumber, amount, paymentMethod, usedPaymentMethodId, tickets) {
    const purchaseData = {
      user_id: userId,
      order_id: orderNumber,
      total: amount,
      subtotal: amount,
      discounts: 0,
      payment_method: paymentMethod,
      payment_method_id: usedPaymentMethodId,
      payment_status: 'completed'
    };

    const purchaseItems = tickets.map(ticket => ({
      ticket_type_id: parseInt(ticket.ticketTypeId, 10),
      quantity: ticket.quantity || 1,
      price: ticket.price
    }));

    return await Purchase.createPurchase(client, purchaseData, purchaseItems);
  }

  async linkTicketsToPurchase(client, createdTickets, purchaseId) {
    for (const ticket of createdTickets) {
      await client.query(
        'UPDATE tickets SET purchase_id = $1 WHERE id = $2',
        [purchaseId, ticket.id]
      );
    }
  }

  async linkCreditTransaction(client, userId, paymentId) {
    try {
      const recentTransactionQuery = {
        text: "SELECT id FROM credit_transactions WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1",
        values: [userId, "purchase"],
      };

      const recentTransaction = await client.query(recentTransactionQuery);

      if (recentTransaction.rows.length > 0) {
        const updateQuery = {
          text: "UPDATE credit_transactions SET reference_id = $1, reference_type = $2 WHERE id = $3",
          values: [paymentId, "payment", recentTransaction.rows[0].id],
        };

        await client.query(updateQuery);
      } else {
        console.warn("No matching credit transaction found to update reference");
      }
    } catch (err) {
      console.warn("Error updating credit transaction reference:", err.message);
    }
  }
}