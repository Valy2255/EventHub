import { PurchaseService } from '../services/PurchaseService.js';

const purchaseService = new PurchaseService();

/**
 * GET /api/purchases
 * Get purchase history for authenticated user
 */
export const getPurchaseHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = req.query.page;
    const limit = req.query.limit;
    
    const result = await purchaseService.getPurchaseHistory(userId, page, limit);
    
    res.status(200).json({
      success: true,
      data: result.purchases,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch purchase history', 
      error: error.message 
    });
  }
};

/**
 * GET /api/purchases/:id
 * Get purchase by ID
 */
export const getPurchaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const result = await purchaseService.getPurchaseById(id, userId, userRole);
    
    res.status(200).json({
      success: true,
      data: {
        ...result.purchase,
        items: result.items,
        event: result.event,
        tickets: result.tickets
      }
    });
  } catch (error) {
    if (error.message === 'Purchase not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'You do not have permission to view this purchase') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Error fetching purchase:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch purchase', 
      error: error.message 
    });
  }
};