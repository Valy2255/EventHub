import { BaseService } from './BaseService.js';
import * as User from '../models/User.js';
import * as Purchase from '../models/Purchase.js';
import * as db from '../config/db.js';

export class CreditService extends BaseService {
  // Get user's credit balance
  async getCreditBalance(userId) {
    return await User.getCreditBalance(userId);
  }

  // Get credit transaction history with pagination and formatting
  async getCreditHistory(userId, page = 1, limit = 10) {
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page
    const offset = (validatedPage - 1) * validatedLimit;
    
    const transactions = await User.getCreditTransactions(userId, validatedLimit, offset);
    
    // Format and enrich transaction data
    const formattedTransactions = await Promise.all(
      transactions.map(transaction => this.formatCreditTransaction(transaction))
    );
    
    // Get total transactions count for pagination info
    const totalCount = await this.getCreditTransactionCount(userId);
    
    const pagination = {
      page: validatedPage,
      limit: validatedLimit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / validatedLimit),
      hasMore: transactions.length === validatedLimit && validatedPage * validatedLimit < totalCount
    };
    
    return {
      transactions: formattedTransactions,
      pagination
    };
  }

 
  // Private helper methods
  async formatCreditTransaction(transaction) {
    let actionText = '';
    let typeLabel = '';
    
    switch(transaction.type) {
      case 'purchase':
        actionText = 'Credits used for purchase';
        typeLabel = 'Purchase';
        break;
      case 'refund':
        actionText = 'Credits received from refund';
        typeLabel = 'Refund';
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
      case 'bonus':
        actionText = 'Bonus credits received';
        typeLabel = 'Bonus';
        break;
      default:
        actionText = transaction.amount > 0 ? 'Credits added' : 'Credits used';
        typeLabel = 'Transaction';
    }
    
    // Only try to find purchase_id if it's a payment reference
    let purchase_id = undefined;
    if (transaction.reference_type === 'payment' && transaction.reference_id) {
      try {
        // Look up the purchase associated with this payment
        const purchase = await Purchase.findByPaymentId(transaction.reference_id);
        if (purchase) {
          purchase_id = purchase.id;
        }
      } catch (err) {
        console.error('Error finding purchase by payment ID:', err);
        // Continue even if lookup fails
      }
    }
    
    const result = {
      ...transaction,
      amount: parseFloat(transaction.amount),
      formattedDate: new Date(transaction.created_at).toLocaleDateString(),
      formattedTime: new Date(transaction.created_at).toLocaleTimeString(),
      actionText,
      typeLabel,
      isAddition: transaction.amount > 0
    };
    
    // Only add purchase_id if we found one
    if (purchase_id !== undefined) {
      result.purchase_id = purchase_id;
    }
    
    return result;
  }

  async getCreditTransactionCount(userId) {
    const countQuery = {
      text: 'SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1',
      values: [userId]
    };
    
    const countResult = await db.query(countQuery);
    return parseInt(countResult.rows[0].count);
  }
}