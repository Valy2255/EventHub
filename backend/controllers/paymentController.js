// backend/controllers/paymentController.js
import * as Payment from '../models/Payment.js';
import * as Ticket from '../models/Ticket.js';
import * as TicketType from '../models/TicketType.js';
import * as Event from '../models/Event.js';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { sendTicketEmail } from '../utils/emailService.js';


// Process payment and create tickets
export const processPayment = async (req, res, next) => {
  try {
    const { amount, currency = 'USD', paymentMethod, tickets } = req.body;
    const userId = req.user.id;
    
    // Validate the request
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
    
    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ error: 'No tickets provided' });
    }
    
    // Start a transaction for database operations
    const client = await global.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create payment record
      const payment = await Payment.create(client, {
        user_id: userId,
        amount,
        currency,
        payment_method: paymentMethod,
        transaction_id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`, // Simulate transaction ID
        status: 'succeeded' // In a real system, this would come from the payment gateway
      });
      
      // Generate a unique order number
      const orderNumber = `ORD-${Date.now().toString().substring(6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      
      // Create tickets for each ticket type
      const createdTickets = [];
      
      for (const ticketData of tickets) {
        const { ticketTypeId, quantity, price, eventId } = ticketData;
        
        // Convert ticketTypeId to a number to ensure it's the correct type
        const ticketTypeIdNum = parseInt(ticketTypeId, 10);
        
        if (isNaN(ticketTypeIdNum)) {
          throw new Error(`Invalid ticket type ID: ${ticketTypeId}`);
        }
        
        // Verify ticket type exists and has sufficient availability
        const ticketType = await TicketType.findById(ticketTypeIdNum);
        
        if (!ticketType) {
          throw new Error(`Ticket type with ID ${ticketTypeIdNum} not found`);
        }
        
        if (ticketType.available_quantity < quantity) {
          throw new Error(`Not enough tickets available for ${ticketType.name}`);
        }
        
        // Get event details for QR code data
        const event = await Event.findById(eventId);
        
        // Create tickets
        for (let i = 0; i < quantity; i++) {
          // First, create ticket in database
          const ticket = await Ticket.createPurchased(client, {
            ticket_type_id: ticketTypeIdNum,
            user_id: userId,
            event_id: eventId,
            price,
            qr_code: null // We'll update this after getting the database ID
          });
          
          // Now that we have the ticket ID, create the secure QR code data
          const secureTicketData = {
            id: ticket.id, // Database ID for reliable lookup
            hash: Ticket.generateTicketHash(ticket.id, eventId, userId), // Security signature
            v: 1 // Version for future compatibility
          };
          
          // Generate QR code with the compact, secure data
          const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(secureTicketData));
          
          // Update the ticket with the QR code
          const updatedTicket = await client.query(
            'UPDATE tickets SET qr_code = $1 WHERE id = $2 RETURNING *',
            [qrCodeDataUrl, ticket.id]
          );
          
          // Link ticket to payment
          await Payment.linkTicketToPayment(client, payment.id, ticket.id);
          
          createdTickets.push({
            ...updatedTicket.rows[0],
            qr_code: qrCodeDataUrl,
            event_name: event.name,
            ticket_type_name: ticketType.name,
            date: event.date,
            time: event.time,
            venue: event.venue
          });
        }
        
        // Update available quantity for ticket type
        try {
          await TicketType.updateAvailability(ticketTypeIdNum, -quantity);
        } catch (err) {
          console.warn('Error updating ticket availability:', err.message);
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Send ticket email to user
      try {
        const user = req.user;
        await sendTicketEmail(user.email, user.name, createdTickets, orderNumber);
      } catch (emailErr) {
        console.error('Error sending ticket email:', emailErr);
      }
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Payment successful',
        paymentId: payment.id,
        tickets: createdTickets,
        orderNumber
      });
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(400).json({ error: error.message || 'Payment processing failed' });
  }
};

// Get payment history for user
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const payments = await Payment.findByUserId(userId);
    
    res.status(200).json({ payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
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
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Verify that the payment belongs to the user
    if (payment.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to this payment' });
    }
    
    // Get linked tickets
    const tickets = await Payment.getPaymentTickets(id);
    
    res.status(200).json({
      payment,
      tickets
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    next(error);
  }
};