// backend/services/refundService.js
import * as User from '../models/User.js';
import * as db from '../config/db.js';

// Process refunds for a canceled event
export const processEventCancellationRefunds = async (eventId) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find all purchases for this event
    const purchasesResult = await client.query(
      `SELECT DISTINCT p.* FROM purchases p
       JOIN tickets t ON t.purchase_id = p.id
       WHERE t.event_id = $1 AND t.status != 'refunded'`,
      [eventId]
    );
    
    const purchases = purchasesResult.rows;
    const processedRefunds = [];
    
    // Process each purchase for refund
    for (const purchase of purchases) {
      try {
        const refundInfo = await processRefund(client, purchase, eventId);
        if (refundInfo) {
          processedRefunds.push(refundInfo);
        }
      } catch (err) {
        console.error(`Error processing refund for purchase ${purchase.id}:`, err);
      }
    }
    
    await client.query('COMMIT');
    return { success: true, processedRefunds };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing refunds:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Process individual refund
const processRefund = async (client, purchase, eventId) => {
  // Get tickets for this event in this purchase
  const ticketsResult = await client.query(
    `SELECT t.*, tt.price FROM tickets t
     JOIN ticket_types tt ON t.ticket_type_id = tt.id
     WHERE t.purchase_id = $1 AND t.event_id = $2 AND t.status != 'refunded'`,
    [purchase.id, eventId]
  );
  
  const tickets = ticketsResult.rows;
  
  if (tickets.length === 0) {
    return null; // No tickets to refund
  }
  
  // Calculate refund amount
  const refundAmount = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.price || 0), 0);
  
  if (refundAmount <= 0) {
    return null; // Nothing to refund
  }
  
  // Get original payment information
  const paymentResult = await client.query(
    `SELECT p.* FROM payments p
     JOIN payment_tickets pt ON pt.payment_id = p.id
     WHERE pt.ticket_id = $1 LIMIT 1`,
    [tickets[0].id]
  );
  
  const payment = paymentResult.rows[0];
  
  if (!payment) {
    throw new Error(`Payment not found for purchase ${purchase.id}`);
  }
  
  // Get payment method if available (for card payments)
  let paymentMethodId = null;
  
  if (payment.payment_method === 'card') {
    // Check if payment has a reference to payment method
    const paymentMethodResult = await client.query(
      `SELECT id FROM payment_methods 
       WHERE user_id = $1 AND is_default = true 
       ORDER BY created_at DESC LIMIT 1`,
      [purchase.user_id]
    );
    
    if (paymentMethodResult.rows.length > 0) {
      paymentMethodId = paymentMethodResult.rows[0].id;
    }
  }
  
  // Create refund record
  const refundData = {
    purchase_id: purchase.id,
    payment_id: payment.id,
    payment_method_id: paymentMethodId,
    payment_method_type: payment.payment_method,
    amount: refundAmount,
    status: 'processing',
    reference_id: `ref_${Date.now()}_${purchase.id}`,
    notes: `Refund for canceled event ID: ${eventId}`
  };
  
  const insertResult = await client.query(
    `INSERT INTO refunds
     (purchase_id, payment_id, payment_method_id, payment_method_type, amount, status, reference_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
  
  // Process refund based on payment method
  if (payment.payment_method === 'credits') {
    // Refund to user credits
    await User.addCredits(
      purchase.user_id,
      refundAmount,
      'refund',
      `Refund for canceled event: ${eventId}`,
      refundId,
      'refund'
    );
    
    // Mark refund as completed
    await client.query(
      `UPDATE refunds SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [refundId]
    );
  } else if (payment.payment_method === 'card') {
    // In a real app, call payment processor API here
    // For this implementation, we'll mark it as completed automatically
    
    await client.query(
      `UPDATE refunds SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [refundId]
    );
  }
  
  // Update ticket status
  for (const ticket of tickets) {
    await client.query(
      `UPDATE tickets SET status = 'refunded', refund_status = 'completed', cancelled_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [ticket.id]
    );
  }
  
  // Return refund info for email notification
  return {
    id: refundId,
    purchaseId: purchase.id,
    amount: refundAmount,
    paymentMethod: payment.payment_method,
    tickets: tickets.length
  };
};

export default {
  processEventCancellationRefunds
};