// backend/controllers/creditController.js
import * as User from '../models/User.js';
import * as db from '../config/db.js';

// Get user's credit balance
export const getCreditBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await User.getCreditBalance(userId);
    
    res.status(200).json({ credits });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get credit transaction history
export const getCreditHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    const transactions = await User.getCreditTransactions(userId, limit, offset);
    
    // Format and enrich transaction data
    const formattedTransactions = transactions.map(transaction => {
      let actionText = '';
      let typeLabel = '';
      
      switch(transaction.type) {
        case 'purchase':
          actionText = 'Credits used for purchase';
          typeLabel = 'Purchase';
          break;
        case 'exchange_refund':
          actionText = 'Credits received from ticket exchange';
          typeLabel = 'Exchange Refund';
          break;
        case 'exchange_payment':
          actionText = 'Credits used for ticket upgrade';
          typeLabel = 'Ticket Upgrade';
          break;
        case 'admin_adjustment':
          actionText = transaction.amount > 0 ? 'Credits added by administrator' : 'Credits deducted by administrator';
          typeLabel = 'Admin Adjustment';
          break;
        default:
          actionText = transaction.amount > 0 ? 'Credits added' : 'Credits used';
          typeLabel = 'Transaction';
      }
      
      return {
        ...transaction,
        formattedDate: new Date(transaction.created_at).toLocaleDateString(),
        formattedTime: new Date(transaction.created_at).toLocaleTimeString(),
        actionText,
        typeLabel,
        isAddition: transaction.amount > 0
      };
    });
    
    // Get total transactions count for pagination info
    const countQuery = {
      text: 'SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1',
      values: [userId]
    };
    
    const countResult = await db.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.status(200).json({ 
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: transactions.length === limit && page * limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(400).json({ error: error.message });
  }
};

// Admin endpoint to adjust user credits (would need admin middleware)
export const adjustUserCredits = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    // Verify the requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }
    
    if (!userId || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }
    
    // Convert amount to number to ensure proper type
    const adjustmentAmount = parseFloat(amount);
    
    if (isNaN(adjustmentAmount) || adjustmentAmount === 0) {
      return res.status(400).json({ error: 'Amount must be a non-zero number' });
    }
    
    const result = await User.addCredits(
      userId, 
      adjustmentAmount, 
      'admin_adjustment', 
      description || `Manual adjustment by admin ${req.user.id}`
    );
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully ${adjustmentAmount > 0 ? 'added' : 'deducted'} credits`,
      currentCredits: result.currentCredits 
    });
  } catch (error) {
    console.error('Error adjusting user credits:', error);
    res.status(400).json({ error: error.message });
  }
};