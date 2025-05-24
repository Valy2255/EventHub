import { BaseService } from './BaseService.js';
import * as PaymentMethod from '../models/PaymentMethod.js';

export class PaymentMethodService extends BaseService {
  // Get all payment methods for a user
  async getPaymentMethods(userId) {
    return await PaymentMethod.findAllByUserId(userId);
  }

  // Get a specific payment method
  async getPaymentMethod(id, userId) {
    const paymentMethod = await PaymentMethod.findById(id, userId);
    
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }
    
    return paymentMethod;
  }

  // Add a new payment method
  async addPaymentMethod(userId, paymentMethodData) {
    return this.executeInTransaction(async (client) => {
      const { 
        cardNumber, 
        cardHolderName, 
        expiryDate, 
        isDefault = false 
      } = paymentMethodData;
      
      // Validate required fields
      this.validatePaymentMethodData(cardNumber, cardHolderName, expiryDate);
      
      // Format and extract data
      const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
      const cardType = this.getCardType(cardNumber);
      const [expiryMonth, expiryYear] = expiryDate.split('/');
      
      // Validate expiry date format
      this.validateExpiryDate(expiryMonth, expiryYear);
      
      // In a real app, you would tokenize the card here
      const token = `tok_${Date.now()}`;
      
      const paymentMethod = await PaymentMethod.create({
        userId,
        cardType,
        lastFour,
        cardHolderName,
        expiryMonth,
        expiryYear,
        isDefault,
        token
      });
      
      return paymentMethod;
    });
  }

  // Update a payment method
  async updatePaymentMethod(id, userId, updateData) {
    return this.executeInTransaction(async (client) => {
      const { 
        cardHolderName, 
        expiryDate, 
        isDefault = false 
      } = updateData;
      
      // Validate required fields
      if (!cardHolderName || !expiryDate) {
        throw new Error('Missing required fields');
      }
      
      // Parse expiry date
      const [expiryMonth, expiryYear] = expiryDate.split('/');
      
      // Validate expiry date format
      this.validateExpiryDate(expiryMonth, expiryYear);
      
      const paymentMethod = await PaymentMethod.update(id, userId, {
        cardHolderName,
        expiryMonth,
        expiryYear,
        isDefault
      });
      
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      
      return paymentMethod;
    });
  }

  // Set a payment method as default
  async setDefaultPaymentMethod(id, userId) {
    return this.executeInTransaction(async (client) => {
      const paymentMethod = await PaymentMethod.setDefault(id, userId);
      
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      
      return paymentMethod;
    });
  }

  // Delete a payment method
  async deletePaymentMethod(id, userId) {
    return this.executeInTransaction(async (client) => {
      const paymentMethod = await PaymentMethod.remove(id, userId);
      
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      
      return paymentMethod;
    });
  }

  // Get default payment method for a user
  async getDefaultPaymentMethod(userId) {
    const paymentMethods = await PaymentMethod.findAllByUserId(userId);
    return paymentMethods.find(pm => pm.is_default) || null;
  }

  // Check if user has any payment methods
  async hasPaymentMethods(userId) {
    const paymentMethods = await PaymentMethod.findAllByUserId(userId);
    return paymentMethods.length > 0;
  }

  // Private helper methods
  validatePaymentMethodData(cardNumber, cardHolderName, expiryDate) {
    if (!cardNumber || !cardHolderName || !expiryDate) {
      throw new Error('Missing required fields');
    }

    // Validate card number (basic check)
    const sanitizedCardNumber = cardNumber.replace(/\D/g, '');
    if (sanitizedCardNumber.length < 13 || sanitizedCardNumber.length > 19) {
      throw new Error('Invalid card number');
    }

    // Validate card holder name
    if (cardHolderName.trim().length < 2) {
      throw new Error('Invalid card holder name');
    }

    // Validate expiry date format
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      throw new Error('Invalid expiry date format. Use MM/YY');
    }
  }

  validateExpiryDate(expiryMonth, expiryYear) {
    const month = parseInt(expiryMonth, 10);
    const year = parseInt(expiryYear, 10);
    
    if (month < 1 || month > 12) {
      throw new Error('Invalid expiry month');
    }
    
    // Check if the card is expired
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new Error('Card has expired');
    }
  }

  getCardType(cardNumber) {
    // Remove all non-numeric characters
    const sanitized = cardNumber.replace(/\D/g, '');
    
    // Check card type based on first digits
    if (/^4/.test(sanitized)) return 'Visa';
    if (/^5[1-5]/.test(sanitized)) return 'Mastercard';
    if (/^3[47]/.test(sanitized)) return 'American Express';
    if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
    if (/^(?:2131|1800|35)/.test(sanitized)) return 'JCB';
    
    return 'Unknown';
  }
}