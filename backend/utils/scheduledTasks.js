// backend/utils/scheduledTasks.js
import cron from 'node-cron';
import * as Ticket from '../models/Ticket.js';
import * as User from '../models/User.js';
import * as db from '../config/db.js';
import { 
  sendEventCanceledEmail, 
  sendEventRescheduledEmail, 
  sendEventReminderEmail 
} from './emailService.js';
import refundService from '../services/refundService.js';

// Initialize all scheduled tasks
export const initializeScheduledTasks = () => {
  // Clean up past events - runs daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    try {
      await cleanupPastEvents();
    } catch (error) {
      console.error('Error in cleanup past events task:', error);
    }
  });
  
  // Process pending refunds - runs every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      await processRefunds();
    } catch (error) {
      console.error('Error in refund processing task:', error);
    }
  });
  
  // Send event reminders - runs daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      await sendEventReminders();
    } catch (error) {
      console.error('Error in event reminder task:', error);
    }
  });
  
  // Process status changes - runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await processEventStatusChanges();
    } catch (error) {
      console.error('Error in event status changes task:', error);
    }
  });
  
  console.log('All scheduled tasks initialized');
};

// Process refunds that are pending
export const processRefunds = async (daysThreshold = 5) => {
  try {
    console.log(`Running scheduled task: Processing refunds pending for more than ${daysThreshold} days...`);
    
    const processedRefunds = await Ticket.processAutomaticRefundCompletion(daysThreshold);
    
    console.log(`Successfully processed ${processedRefunds.length} refunds automatically.`);
    
    return processedRefunds;
  } catch (error) {
    console.error('Error in scheduled refund processing task:', error);
    throw error;
  }
};

// Clean up past events
export const cleanupPastEvents = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(`
      UPDATE events 
      SET status = 'inactive' 
      WHERE date < $1 AND status = 'active'
    `, [today]);
    
    console.log(`Updated ${result.rowCount} past events to inactive status`);
  } catch (error) {
    console.error('Error cleaning up past events:', error);
  }
};

// Send reminders for events in 7 days
export const sendEventReminders = async () => {
  try {
    console.log('Running scheduled task: Sending event reminders...');
    
    // Calculate date for 7 days from now
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 7);
    const formattedDate = reminderDate.toISOString().split('T')[0];
    
    // Find events happening in 7 days that are active
    const eventsResult = await db.query(`
      SELECT * FROM events 
      WHERE date = $1 AND status = 'active'
    `, [formattedDate]);
    
    const events = eventsResult.rows;
    console.log(`Found ${events.length} events happening in 7 days`);
    
    let remindersSent = 0;
    
    // For each event, find ticket holders and send reminders
    for (const event of events) {
      // Get all tickets for this event
      const ticketsResult = await db.query(`
        SELECT t.*, u.id as user_id, u.name, u.email 
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.event_id = $1 AND t.status = 'purchased'
      `, [event.id]);
      
      const tickets = ticketsResult.rows;
      
      // Group tickets by user
      const userMap = new Map();
      for (const ticket of tickets) {
        if (!userMap.has(ticket.user_id)) {
          userMap.set(ticket.user_id, {
            id: ticket.user_id,
            name: ticket.name,
            email: ticket.email,
            tickets: []
          });
        }
        userMap.get(ticket.user_id).tickets.push(ticket);
      }
      
      // Send reminder to each user
      for (const [userId, userData] of userMap.entries()) {
        // Check if reminder already sent
        const notificationResult = await db.query(`
          SELECT * FROM notification_history
          WHERE user_id = $1 AND event_id = $2 AND notification_type = 'event_reminder'
        `, [userId, event.id]);
        
        if (notificationResult.rows.length === 0) {
          try {
            await sendEventReminderEmail(userData, event);
            remindersSent++;
          } catch (err) {
            console.error(`Error sending reminder to user ${userId}:`, err);
          }
        }
      }
    }
    
    console.log(`Sent ${remindersSent} event reminders`);
  } catch (error) {
    console.error('Error sending event reminders:', error);
    throw error;
  }
};

// Process events with status changes (canceled or rescheduled)
export const processEventStatusChanges = async () => {
  try {
    console.log('Running scheduled task: Processing event status changes...');
    
    // Find events with recent status changes 
    const eventsResult = await db.query(`
      SELECT * FROM events 
      WHERE status IN ('canceled', 'rescheduled')
      AND notification_status = 'pending'
      AND status_changed_at IS NOT NULL
    `);
    
    const events = eventsResult.rows;
    console.log(`Found ${events.length} events with status changes`);
    
    // Process each event
    for (const event of events) {
      if (event.status === 'canceled') {
        await processCanceledEvent(event);
      } else if (event.status === 'rescheduled') {
        await processRescheduledEvent(event);
      }
    }
  } catch (error) {
    console.error('Error processing event status changes:', error);
    throw error;
  }
};

// Process canceled event
const processCanceledEvent = async (event) => {
  try {
    console.log(`Processing canceled event: ${event.id} - ${event.name}`);
    
    // Process refunds
    const refundResult = await refundService.processEventCancellationRefunds(event.id);
    
    // Get purchases associated with this event
    const purchasesResult = await db.query(`
      SELECT DISTINCT p.*, u.id as user_id, u.name, u.email 
      FROM purchases p
      JOIN tickets t ON t.purchase_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE t.event_id = $1
    `, [event.id]);
    
    const purchases = purchasesResult.rows;
    
    // Send notifications to purchasers
    for (const purchase of purchases) {
      // Get refund info for this purchase
      const refundInfo = refundResult.processedRefunds.find(r => r.purchaseId === purchase.id);
      
      if (refundInfo) {
        try {
          // Check if notification already sent
          const notificationResult = await db.query(`
            SELECT * FROM notification_history
            WHERE user_id = $1 AND event_id = $2 AND notification_type = 'event_canceled'
          `, [purchase.user_id, event.id]);
          
          if (notificationResult.rows.length === 0) {
            await sendEventCanceledEmail(
              {
                id: purchase.user_id,
                name: purchase.name,
                email: purchase.email
              },
              event,
              purchase,
              {
                amount: refundInfo.amount,
                paymentMethod: refundInfo.paymentMethod
              }
            );
          }
        } catch (err) {
          console.error(`Error sending cancellation email to user ${purchase.user_id}:`, err);
        }
      }
    }
    
    // Update event notification status
    await db.query(`
      UPDATE events 
      SET notification_status = 'notified' 
      WHERE id = $1
    `, [event.id]);
    
    console.log(`Processed canceled event: ${event.id} - ${event.name}`);
  } catch (error) {
    console.error(`Error processing canceled event ${event.id}:`, error);
  }
};

// Process rescheduled event
const processRescheduledEvent = async (event) => {
  try {
    console.log(`Processing rescheduled event: ${event.id} - ${event.name}`);
    
    // Get ticket holders for this event
    const usersResult = await db.query(`
      SELECT DISTINCT u.id, u.name, u.email 
      FROM users u
      JOIN tickets t ON t.user_id = u.id
      WHERE t.event_id = $1 AND t.status = 'purchased'
    `, [event.id]);
    
    const users = usersResult.rows;
    console.log(`Found ${users.length} ticket holders to notify`);
    
    // Send notifications to ticket holders
    let notificationsSent = 0;
    
    for (const user of users) {
      try {
        // Check if notification already sent since the last status change
        const notificationResult = await db.query(`
          SELECT * FROM notification_history
          WHERE user_id = $1 
          AND event_id = $2 
          AND notification_type = 'event_rescheduled'
          AND created_at > $3
        `, [user.id, event.id, event.status_changed_at]);
        
        if (notificationResult.rows.length === 0) {
          console.log(`Sending rescheduling notification to user ${user.id} (${user.email})`);
          await sendEventRescheduledEmail(user, event);
          notificationsSent++;
        } else {
          console.log(`Notification already sent to user ${user.id} after the latest status change`);
        }
      } catch (err) {
        console.error(`Error sending rescheduling email to user ${user.id}:`, err);
      }
    }
    
    // Update event notification status
    await db.query(`
      UPDATE events 
      SET notification_status = 'notified' 
      WHERE id = $1
    `, [event.id]);
    
    console.log(`Processed rescheduled event: ${event.id} - ${event.name} (${notificationsSent} notifications sent)`);
  } catch (error) {
    console.error(`Error processing rescheduled event ${event.id}:`, error);
  }
};

export default {
  initializeScheduledTasks,
  processRefunds,
  cleanupPastEvents,
  sendEventReminders,
  processEventStatusChanges
};