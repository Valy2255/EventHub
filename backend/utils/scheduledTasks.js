// backend/utils/scheduledTasks.js
import * as Ticket from '../models/Ticket.js';

/**
 * Process refunds that have been in 'processing' status for the specified threshold days
 * This function should be called periodically (e.g., daily) by a scheduler
 */
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