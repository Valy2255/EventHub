// backend/controllers/purchaseController.js
import * as Purchase from "../models/Purchase.js";
import * as Event from "../models/Event.js";

// Get purchase history for authenticated user
export const getPurchaseHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await Purchase.findByUser(userId, page, limit);
    
    res.status(200).json({
      success: true,
      data: result.purchases,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    next(error);
  }
};

// Get purchase by ID
export const getPurchaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the purchase
    const purchase = await Purchase.findById(id);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }
    
    // Check if the purchase belongs to the user
    if (purchase.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this purchase'
      });
    }
    
    // Get the purchase items (tickets purchased)
    const items = await Purchase.getItemsByPurchaseId(id);
    
    // Get the event details if available
    let event = null;
    if (items && items.length > 0 && items[0].event_id) {
      event = await Event.findById(items[0].event_id);
    }
    
    // Get tickets associated with the purchase
    const tickets = await Purchase.findTicketsByPurchaseId(id);
    
    res.status(200).json({
      success: true,
      data: {
        ...purchase,
        items,
        event,
        tickets
      }
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    next(error);
  }
};