// backend/controllers/paymentController.js
import * as Payment from "../models/Payment.js";
import * as Ticket from "../models/Ticket.js";
import * as TicketType from "../models/TicketType.js";
import * as Event from "../models/Event.js";
import * as User from "../models/User.js"; 
import * as Purchase from "../models/Purchase.js";
import QRCode from "qrcode";
import crypto from "crypto";
import { sendTicketEmail } from "../utils/emailService.js";

// Process payment and create tickets

// Utility function to determine card type
const getCardType = (cardNumber) => {
  // Remove all non-numeric characters
  const sanitized = cardNumber.replace(/\D/g, '');
  
  // Check card type based on first digits
  if (/^4/.test(sanitized)) return 'Visa';
  if (/^5[1-5]/.test(sanitized)) return 'Mastercard';
  if (/^3[47]/.test(sanitized)) return 'American Express';
  if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
  if (/^(?:2131|1800|35)/.test(sanitized)) return 'JCB';
  
  return 'Unknown';
};

export const processPayment = async (req, res, next) => {
  try {
    // Extract request data
    const { amount, currency = "USD", tickets, savedCardId, saveCard, cardDetails } = req.body;
    let paymentMethod = req.body.paymentMethod;
    const useCredits = req.body.useCredits === true; // Force boolean evaluation

    const userId = req.user.id;

    // Log the payment request for debugging
    console.log("Payment request:", {
      amount,
      paymentMethod,
      useCredits,
      savedCardId,
      saveCard,
      ticketsCount: tickets?.length || 0,
    });

    // Validate the request
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ error: "No tickets provided" });
    }

    // Start a transaction for database operations
    const client = await global.pool.connect();

    try {
      await client.query("BEGIN");

      // Set up variables for potential saved card ID
      let usedPaymentMethodId = null;

      // Handle payment based on method
      if (useCredits === true) {
        // Credit payment logic (existing)
        console.log("Using credits for payment");
        const userCredits = await User.getCreditBalance(userId);

        if (userCredits < amount) {
          return res.status(400).json({
            error: "Insufficient credits",
            creditsNeeded: amount,
            currentCredits: userCredits,
          });
        }

        await User.addCredits(
          userId,
          -amount,
          "purchase",
          `Purchase of ${tickets.reduce((sum, t) => sum + t.quantity, 0)} tickets`,
          null,
          "payment"
        );

        paymentMethod = "credits";
      } else if (paymentMethod === "card") {
        if (savedCardId) {
          // Process payment with saved card
          console.log("Using saved card for payment:", savedCardId);
          
          // Get the saved card details
          const savedCardQuery = {
            text: "SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2",
            values: [savedCardId, userId]
          };
          
          const savedCardResult = await client.query(savedCardQuery);
          
          if (savedCardResult.rows.length === 0) {
            return res.status(404).json({ error: "Saved card not found" });
          }
          
          const savedCard = savedCardResult.rows[0];
          console.log(`Using saved card: ${savedCard.card_type} ending in ${savedCard.last_four}`);
          
          // In a production app, you would use the token to charge the card
          // using your payment processor (Stripe, etc.)
          
          usedPaymentMethodId = savedCardId;
        } else if (saveCard && cardDetails) {
          // Save the new card first
          console.log("Saving new card during checkout");
          
          // Extract card details
          const { cardNumber, cardHolderName, expiryDate, isDefault = false } = cardDetails;
          
          if (!cardNumber || !cardHolderName || !expiryDate) {
            return res.status(400).json({ error: "Missing required card details" });
          }
          
          // Format and extract data
          const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
          
          // Determine card type based on number
          const cardType = getCardType(cardNumber);
          
          // Parse expiry date
          const [expiryMonth, expiryYear] = expiryDate.split('/');
          
          // In a real app, you would tokenize the card here
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
          
          // Use this card for the payment
          usedPaymentMethodId = newCardId;
        }
        
        // Use card payment method
        paymentMethod = "card";
      }

      // Create payment record with payment method ID if applicable
      const payment = await Payment.create(client, {
        user_id: userId,
        amount,
        currency,
        payment_method: paymentMethod,
        payment_method_id: usedPaymentMethodId, // Store reference to the payment method if used
        transaction_id: `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        status: "succeeded",
      });

      // The rest of your existing payment processing code...
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().substring(6)}-${crypto
        .randomBytes(2)
        .toString("hex")
        .toUpperCase()}`;

      // Create tickets for each ticket type
      const createdTickets = [];

      for (const ticketData of tickets) {
        // Your existing ticket creation code...
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
          throw new Error(
            `Not enough tickets available for ${ticketType.name}`
          );
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

          const qrCodeDataUrl = await QRCode.toDataURL(
            JSON.stringify(secureTicketData)
          );

          const updatedTicket = await client.query(
            "UPDATE tickets SET qr_code = $1 WHERE id = $2 RETURNING *",
            [qrCodeDataUrl, ticket.id]
          );

          await Payment.linkTicketToPayment(client, payment.id, ticket.id);

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

      // Create purchase record with payment method reference
      const purchaseData = {
        user_id: userId,
        order_id: orderNumber,
        total: amount,
        subtotal: amount,
        discounts: 0,
        payment_method: paymentMethod,
        payment_method_id: usedPaymentMethodId, // Add reference to payment method
        payment_status: 'completed'
      };

      const purchaseItems = tickets.map(ticket => ({
        ticket_type_id: parseInt(ticket.ticketTypeId, 10),
        quantity: ticket.quantity || 1,
        price: ticket.price
      }));

      const purchase = await Purchase.createPurchase(client, purchaseData, purchaseItems);

      for (const ticket of createdTickets) {
        await client.query(
          'UPDATE tickets SET purchase_id = $1 WHERE id = $2',
          [purchase.id, ticket.id]
        );
      }

      // Handle credits if used
      if (useCredits === true) {
        try {
          const recentTransactionQuery = {
            text: "SELECT id FROM credit_transactions WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1",
            values: [userId, "purchase"],
          };

          const recentTransaction = await client.query(recentTransactionQuery);

          if (recentTransaction.rows.length > 0) {
            const updateQuery = {
              text: "UPDATE credit_transactions SET reference_id = $1, reference_type = $2 WHERE id = $3",
              values: [payment.id, "payment", recentTransaction.rows[0].id],
            };

            await client.query(updateQuery);
          } else {
            console.warn(
              "No matching credit transaction found to update reference"
            );
          }
        } catch (err) {
          console.warn(
            "Error updating credit transaction reference:",
            err.message
          );
        }
      }

      // Commit the transaction
      await client.query("COMMIT");

      // Send ticket email
      try {
        const user = req.user;
        await sendTicketEmail(
          user.email,
          user.name,
          createdTickets,
          orderNumber
        );
      } catch (emailErr) {
        console.error("Error sending ticket email:", emailErr);
      }

      // Return success response with payment method details
      res.status(200).json({
        success: true,
        message: "Payment successful",
        paymentId: payment.id,
        purchaseId: purchase.id,
        tickets: createdTickets,
        orderNumber,
        paymentMethod,
        savedCardId: usedPaymentMethodId, // Include the used card ID
        paymentCompleted: true, 
        ...(useCredits && {
          currentCredits: await User.getCreditBalance(userId),
        }),
      });
    } catch (error) {
      // Rollback transaction on error
      await client.query("ROLLBACK");
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    res
      .status(400)
      .json({ error: error.message || "Payment processing failed" });
  }
};

// Get payment history for user
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.findByUserId(userId);

    res.status(200).json({ payments });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    next(error);
  }
};

// Get payment details with linked tickets
export const getPaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get payment
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Verify that the payment belongs to the user
    if (payment.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to this payment" });
    }

    // Get linked tickets
    const tickets = await Payment.getPaymentTickets(id);

    res.status(200).json({
      payment,
      tickets,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    next(error);
  }
};
