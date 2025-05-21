// backend/models/Ticket.js
import * as db from '../config/db.js';
import crypto from 'crypto';

// Find tickets by user and event
export const findByUserAndEvent = async (userId, eventId) => {
  const query = {
    text: `
      SELECT * FROM tickets
      WHERE user_id = $1 AND event_id = $2 AND status = 'purchased'
    `,
    values: [userId, eventId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding tickets:', error);
    throw error;
  }
};

// Find ticket by ID
export const findById = async (id) => {
  const query = {
    text: `
      SELECT t.*, tt.name as ticket_type_name, e.name as event_name, e.date, e.time, e.venue
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON t.event_id = e.id
      WHERE t.id = $1
    `,
    values: [id]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error finding ticket:', error);
    throw error;
  }
};

// Create a new ticket (reserved status initially)
export const createReserved = async (data) => {
  const { ticket_type_id, user_id, event_id, price } = data;
  
  // Calculate reservation expiration time (15 minutes from now)
  const now = new Date();
  const reservationExpires = new Date(now.getTime() + 15 * 60 * 1000);
  
  const query = {
    text: `
      INSERT INTO tickets(
        ticket_type_id, user_id, event_id, price, status, reservation_expires_at
      )
      VALUES($1, $2, $3, $4, 'reserved', $5)
      RETURNING *
    `,
    values: [ticket_type_id, user_id, event_id, price, reservationExpires]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

// Create a purchased ticket directly
export const createPurchased = async (client, data) => {
  const { ticket_type_id, user_id, event_id, price, qr_code } = data;
  
  // Use the provided client or the default connection pool
  const queryExecutor = client || db;
  
  const query = {
    text: `
      INSERT INTO tickets(
        ticket_type_id, user_id, event_id, qr_code, price, status, purchase_date
      )
      VALUES($1, $2, $3, $4, $5, 'purchased', CURRENT_TIMESTAMP)
      RETURNING *
    `,
    values: [ticket_type_id, user_id, event_id, qr_code, price]
  };
  
  try {
    const result = await queryExecutor.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating purchased ticket:', error);
    throw error;
  }
};

// Update ticket status to purchased
export const updateToPurchased = async (id, qrCode) => {
  const query = {
    text: `
      UPDATE tickets
      SET status = 'purchased', qr_code = $2, purchase_date = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    values: [id, qrCode]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket to purchased:', error);
    throw error;
  }
};

// Update ticket status to cancelled (when refunded)
export const updateToCancelled = async (id, refundStatus = 'requested') => {
  const query = {
    text: `
      UPDATE tickets
      SET status = 'cancelled',
          cancelled_at = CURRENT_TIMESTAMP,
          refund_status = $2
      WHERE id = $1
      RETURNING *
    `,
    values: [id, refundStatus]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating ticket to cancelled:', error);
    throw error;
  }
};

// Update to capture check-in agent information
export const updateCheckinStatus = async (id, checkedIn, checkedInBy = null) => {
  const query = {
    text: `
      UPDATE tickets
      SET checked_in = $2,
          checked_in_at = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
          checked_in_by = $3
      WHERE id = $1
      RETURNING *
    `,
    values: [id, checkedIn, checkedInBy]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating check-in status:', error);
    throw error;
  }
};

// Get all tickets for a user
export const findByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue, e.image_url, e.cancellation_policy,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1
      ORDER BY e.date DESC, t.id ASC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding user tickets:', error);
    throw error;
  }
};

// Validate a ticket by QR code
export const validateQrCode = async (qrCode) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue,
             tt.name as ticket_type_name,
             u.name as user_name, u.email as user_email
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN users u ON t.user_id = u.id
      WHERE t.qr_code = $1 AND t.status = 'purchased'
    `,
    values: [qrCode]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error validating QR code:', error);
    throw error;
  }
};

// Get upcoming tickets for a user
export const findUpcomingByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue, e.image_url,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1 AND e.date >= CURRENT_DATE AND t.status = 'purchased'
      ORDER BY e.date ASC, e.time ASC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding upcoming tickets:', error);
    throw error;
  }
};

// Get past tickets for a user
export const findPastByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, e.date, e.time, e.venue, e.image_url,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1 AND e.date < CURRENT_DATE AND t.status = 'purchased'
      ORDER BY e.date DESC, e.time ASC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding past tickets:', error);
    throw error;
  }
};

/**
 * Find all cancelled tickets for a user and organize them by event
 */
export const findCancelledByUser = async (userId) => {
  const query = {
    text: `
      SELECT t.*, 
             e.name as event_name, 
             e.date, 
             e.time, 
             e.venue, 
             e.image_url,
             e.address,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.user_id = $1 
      AND t.status = 'cancelled'
      ORDER BY t.cancelled_at DESC
    `,
    values: [userId]
  };
  
  try {
    const result = await db.query(query);
    
    // Group tickets by event
    const ticketsByEvent = {};
    
    result.rows.forEach(ticket => {
      const eventId = ticket.event_id;
      
      if (!ticketsByEvent[eventId]) {
        ticketsByEvent[eventId] = {
          eventId,
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          eventAddress: ticket.address,
          eventImage: ticket.image_url,
          tickets: []
        };
      }
      
      ticketsByEvent[eventId].tickets.push(ticket);
    });
    
    return Object.values(ticketsByEvent);
  } catch (error) {
    console.error('Error finding cancelled tickets:', error);
    throw error;
  }
};

/**
 * Find all pending refund requests
 */
export const findPendingRefunds = async () => {
  const query = {
    text: `
      SELECT t.*, 
             u.name as user_name, 
             u.email as user_email,
             e.name as event_name, 
             e.date as event_date,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.status = 'cancelled' 
      AND (t.refund_status = 'requested' OR t.refund_status IS NULL)
      ORDER BY t.cancelled_at DESC
    `,
    values: []
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding pending refunds:', error);
    throw error;
  }
};

/**
 * Update the refund status of a ticket
 */
export const updateRefundStatus = async (id, status) => {
  const validStatuses = ['requested', 'processing', 'completed', 'failed', 'denied'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid refund status: ${status}`);
  }
  
  const query = {
    text: `
      UPDATE tickets
      SET refund_status = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    values: [id, status]
  };
  
  try {
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating refund status:', error);
    throw error;
  }
};

/**
 * Find all refunds with their status (for admin)
 */
export const getAllRefunds = async () => {
  const query = {
    text: `
      SELECT t.*, 
             u.name as user_name, 
             u.email as user_email,
             e.name as event_name, 
             e.date as event_date,
             tt.name as ticket_type_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.status = 'cancelled' OR t.status = 'refunded'
      ORDER BY 
        CASE
          WHEN t.refund_status = 'requested' OR t.refund_status IS NULL THEN 1
          WHEN t.refund_status = 'processing' THEN 2
          ELSE 3
        END,
        t.cancelled_at DESC
    `,
    values: []
  };
  
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error finding all refunds:', error);
    throw error;
  }
};

/**
 * Process refunds that have been in 'processing' status for more than the specified days
 * This should be called by a scheduled job rather than using setTimeout
 */
export const processAutomaticRefundCompletion = async (daysThreshold = 5) => {
  // Use a transaction to ensure all operations succeed or fail together
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find tickets eligible for automatic completion
    const eligibleTicketsQuery = {
      text: `
        SELECT t.id, t.user_id, t.event_id, t.ticket_type_id, 
               t.price, t.purchase_id, e.name as event_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        WHERE t.status = 'cancelled'
        AND t.refund_status = 'processing'
        AND t.cancelled_at < (CURRENT_TIMESTAMP - INTERVAL '${daysThreshold} days')
      `,
      values: []
    };
    
    console.log(`Looking for refunds pending for more than ${daysThreshold} days...`);
    const eligibleTickets = await client.query(eligibleTicketsQuery);
    console.log(`Found ${eligibleTickets.rows.length} eligible tickets for automatic processing`);
    
    // Process each eligible ticket
    const processedTickets = [];
    
    for (const ticket of eligibleTickets.rows) {
      console.log(`Processing automatic refund for ticket ${ticket.id}`);
      
      // 1. Update ticket status to 'refunded' and refund_status to 'completed'
      await client.query(
        `UPDATE tickets 
         SET status = 'refunded', 
             refund_status = 'completed', 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [ticket.id]
      );
      
      // 2. Get payment information
      const paymentResult = await client.query(
        `SELECT p.* FROM payments p
         JOIN payment_tickets pt ON pt.payment_id = p.id
         WHERE pt.ticket_id = $1 LIMIT 1`,
        [ticket.id]
      );
      
      let payment = null;
      if (paymentResult.rows.length > 0) {
        payment = paymentResult.rows[0];
      } else {
        // Try to find through purchase
        const purchasePaymentResult = await client.query(
          `SELECT p.* FROM payments p
           WHERE p.purchase_id = $1 LIMIT 1`,
          [ticket.purchase_id]
        );
        
        if (purchasePaymentResult.rows.length > 0) {
          payment = purchasePaymentResult.rows[0];
        }
      }
      
      // 3. Create refund record if payment found
      if (payment) {
        const refundAmount = parseFloat(ticket.price || 0);
        
        // Get payment method if available (for card payments)
        let paymentMethodId = null;
        
        if (payment.payment_method === 'card') {
          const paymentMethodResult = await client.query(
            `SELECT id FROM payment_methods 
             WHERE user_id = $1 AND is_default = true 
             ORDER BY created_at DESC LIMIT 1`,
            [ticket.user_id]
          );
          
          if (paymentMethodResult.rows.length > 0) {
            paymentMethodId = paymentMethodResult.rows[0].id;
          }
        }
        
        // Create refund record
        const refundData = {
          purchase_id: ticket.purchase_id,
          payment_id: payment.id,
          payment_method_id: paymentMethodId,
          payment_method_type: payment.payment_method || 'card',
          amount: refundAmount,
          status: 'completed',
          reference_id: `auto_ref_${Date.now()}_${ticket.id}`,
          notes: `Automatic refund for ticket ID: ${ticket.id} after ${daysThreshold} days in processing`
        };
        
        const insertResult = await client.query(
          `INSERT INTO refunds
           (purchase_id, payment_id, payment_method_id, payment_method_type, amount, 
            status, reference_id, notes, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
           RETURNING id`,
          [
            refundData.purchase_id,
            refundData.payment_id,
            refundData.payment_method_id,
            refundData.payment_method_type,
            refundData.amount,
            refundData.status,
            refundData.reference_id,
            refundData.notes
          ]
        );
        
        const refundId = insertResult.rows[0].id;
        
        // 4. Process refund based on payment method
        if (payment.payment_method === 'credits') {
          // FIXED: Update both credit balance AND create transaction record
          // by using User.addCredits instead of just inserting transaction
          try {
            // Update user's credit balance
            const updateQuery = {
              text: `
                UPDATE users 
                SET credits = credits + $1 
                WHERE id = $2 
                RETURNING credits
              `,
              values: [refundAmount, ticket.user_id]
            };
            
            const userResult = await client.query(updateQuery);
            
            if (userResult.rows.length === 0) {
              throw new Error(`User with ID ${ticket.user_id} not found`);
            }
            
            // Record the transaction (still done inside the transaction)
            const transactionQuery = {
              text: `
                INSERT INTO credit_transactions 
                (user_id, amount, type, description, reference_id, reference_type) 
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
              `,
              values: [
                ticket.user_id, 
                refundAmount, 
                'refund', 
                `Automatic refund for ticket to: ${ticket.event_name}`, 
                refundId, 
                'refund'
              ]
            };
            
            await client.query(transactionQuery);
            
            const newBalance = parseFloat(userResult.rows[0].credits);
            console.log(`Refunded ${refundAmount} credits to user ${ticket.user_id}. New balance: ${newBalance}`);
          } catch (creditError) {
            console.error(`Error processing credit refund for ticket ${ticket.id}:`, creditError);
            throw creditError; // Re-throw to trigger rollback
          }
        } else if (payment.payment_method === 'card') {
          // In production, you'd call your payment processor API here
          console.log(`Simulating automatic card refund of $${refundAmount} for ticket ${ticket.id}`);
        }
        
        console.log(`Created automatic refund record with ID: ${refundId} for ticket ${ticket.id}`);
      } else {
        console.warn(`No payment found for ticket ${ticket.id}, skipping refund record creation`);
      }
      
      processedTickets.push({
        id: ticket.id,
        event_id: ticket.event_id,
        ticket_type_id: ticket.ticket_type_id,
        user_id: ticket.user_id,
        price: ticket.price,
        status: 'refunded',
        refund_status: 'completed'
      });
    }
    
    await client.query('COMMIT');
    return processedTickets;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing automatic refund completion:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Add these new functions to your Ticket.js model

// Find ticket by QR code data
export const findByQrData = async (qrData) => {
  try {
    // The qrData is expected to be a JSON string with ticketId and hash
    const data = JSON.parse(qrData);
    
    if (!data || !data.id || !data.hash) {
      throw new Error('Invalid QR code data format');
    }
    
    const query = {
      text: `
        SELECT t.*, 
              e.name as event_name, e.date, e.time, e.venue, e.address,
              tt.name as ticket_type_name,
              u.name as user_name, u.email as user_email
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.status = 'purchased'
      `,
      values: [data.id]
    };
    
    const result = await db.query(query);
    const ticket = result.rows[0];
    
    if (!ticket) {
      return null;
    }
    
    // Verify the hash to prevent forgery
    const expectedHash = generateTicketHash(ticket.id, ticket.event_id, ticket.user_id);
    if (expectedHash !== data.hash) {
      throw new Error('Invalid ticket signature');
    }
    
    return ticket;
  } catch (error) {
    console.error('Error validating ticket by QR data:', error);
    throw error;
  }
};

// Generate hash for ticket verification
export const generateTicketHash = (ticketId, eventId, userId) => {
  const secret = process.env.QR_SECRET || 'eventhub-ticket-secret';
  return crypto.createHmac('sha256', secret)
    .update(`${ticketId}-${eventId}-${userId}`)
    .digest('hex')
    .substring(0, 16);
};

// Exchange ticket for a different ticket type
export const exchangeTicketType = async (ticketId, newTicketTypeId, newPrice) => {
  try {
    const query = {
      text: `
        UPDATE tickets
        SET 
          ticket_type_id = $2,
          price = $3,
          exchange_timestamp = NOW() 
        WHERE id = $1
        RETURNING *
      `,
      values: [ticketId, newTicketTypeId, newPrice]
    };
    
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error exchanging ticket type:', error);
    throw error;
  }
};