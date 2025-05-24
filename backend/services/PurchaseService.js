import { BaseService } from './BaseService.js';
import * as Purchase from '../models/Purchase.js';
import * as Event from '../models/Event.js';

export class PurchaseService extends BaseService {
  // Get purchase history for a user with pagination
  async getPurchaseHistory(userId, page, limit) {
    const validatedPage = parseInt(page) || 1;
    const validatedLimit = parseInt(limit) || 10;
    
    return await Purchase.findByUser(userId, validatedPage, validatedLimit);
  }

  // Get purchase by ID with authorization check
  async getPurchaseById(purchaseId, userId, userRole) {
    // Find the purchase
    const purchase = await Purchase.findById(purchaseId);
    
    if (!purchase) {
      throw new Error('Purchase not found');
    }
    
    // Check authorization
    if (purchase.user_id !== userId && userRole !== 'admin') {
      throw new Error('You do not have permission to view this purchase');
    }
    
    // Get the purchase items (tickets purchased)
    const items = await Purchase.getItemsByPurchaseId(purchaseId);
    
    // Get the event details if available
    let event = null;
    if (items && items.length > 0 && items[0].event_id) {
      event = await Event.findById(items[0].event_id);
    }
    
    // Get tickets associated with the purchase
    const tickets = await Purchase.findTicketsByPurchaseId(purchaseId);
    
    return {
      purchase,
      items,
      event,
      tickets
    };
  }
}