import { CreditService } from '../services/CreditService.js';

const creditService = new CreditService();

/**
 * GET /api/credits/balance
 * Get user's credit balance
 */
export const getCreditBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const credits = await creditService.getCreditBalance(userId);
    
    res.status(200).json({ 
      success: true,
      credits 
    });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch credit balance',
      error: error.message 
    });
  }
};

/**
 * GET /api/credits/history
 * Get credit transaction history
 */
export const getCreditHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = req.query.page;
    const limit = req.query.limit;
    
    const result = await creditService.getCreditHistory(userId, page, limit);
    
    res.status(200).json({ 
      success: true,
      transactions: result.transactions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch credit history',
      error: error.message 
    });
  }
};

