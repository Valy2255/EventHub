// backend/utils/scheduledTasks.js
import * as Ticket from '../models/Ticket.js';
import * as db from '../config/db.js';

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

export const cleanupPastEvents = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { rowCount } = await db.query(`
      UPDATE events 
      SET status = 'inactive' 
      WHERE date < $1 AND status = 'active'
    `, [today]);
    
    console.log(`Updated ${rowCount} past events to inactive status`);
  } catch (error) {
    console.error('Error cleaning up past events:', error);
  }
};

