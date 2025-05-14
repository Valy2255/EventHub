// backend/controllers/paymentMethodController.js
import * as PaymentMethod from '../models/PaymentMethod.js';

// Get all payment methods for a user
export const getPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const paymentMethods = await PaymentMethod.findAllByUserId(userId);
    
    res.status(200).json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    next(error);
  }
};

// Get a specific payment method
export const getPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const paymentMethod = await PaymentMethod.findById(id, userId);
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    res.status(200).json({ paymentMethod });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    next(error);
  }
};

// Add a new payment method
export const addPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      cardNumber, 
      cardHolderName, 
      expiryDate, 
      isDefault = false 
    } = req.body;
    
    // Basic validation
    if (!cardNumber || !cardHolderName || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Format and extract data
    const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
    
    // Determine card type based on number
    const cardType = getCardType(cardNumber);
    
    // Parse expiry date
    const [expiryMonth, expiryYear] = expiryDate.split('/');
    
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
    
    res.status(201).json({ 
      message: 'Payment method added successfully',
      paymentMethod
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    next(error);
  }
};

// Update a payment method
export const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      cardHolderName, 
      expiryDate, 
      isDefault = false 
    } = req.body;
    
    // Basic validation
    if (!cardHolderName || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Parse expiry date
    const [expiryMonth, expiryYear] = expiryDate.split('/');
    
    const paymentMethod = await PaymentMethod.update(id, userId, {
      cardHolderName,
      expiryMonth,
      expiryYear,
      isDefault
    });
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    res.status(200).json({ 
      message: 'Payment method updated successfully',
      paymentMethod
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    next(error);
  }
};

// Set a payment method as default
export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const paymentMethod = await PaymentMethod.setDefault(id, userId);
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    res.status(200).json({ 
      message: 'Default payment method updated successfully',
      paymentMethod
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    next(error);
  }
};

// Delete a payment method
export const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const paymentMethod = await PaymentMethod.remove(id, userId);
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    res.status(200).json({ 
      message: 'Payment method deleted successfully',
      id: paymentMethod.id
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    next(error);
  }
};

// Utility function to determine card type
const getCardType = (cardNumber) => {
  // Remove all non-numeric characters
  const sanitized = cardNumber.replace(/\D/g, '');
  
  // Check card type based on first digits
  if (/^4/.test(sanitized)) return 'Visa';
  if (/^5[1-5]/.test(sanitized)) return 'Mastercard';
  if (/^3[47]/.test(sanitized)) return 'American Express';
  if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
  if (/^(?:2131|1800|35)/.test(sanitized)) return 'JCB';
  
  return 'Unknown';
};