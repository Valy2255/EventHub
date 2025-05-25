// tests/controllers/paymentMethodController.test.js

import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the PaymentMethodService
const mockPaymentMethodService = {
  getPaymentMethods: jest.fn(),
  getPaymentMethod: jest.fn(),
  addPaymentMethod: jest.fn(),
  updatePaymentMethod: jest.fn(),
  deletePaymentMethod: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  getDefaultPaymentMethod: jest.fn()
};

jest.unstable_mockModule('../../services/PaymentMethodService.js', () => ({
  PaymentMethodService: jest.fn().mockImplementation(() => mockPaymentMethodService)
}));

const { 
  getPaymentMethods, 
  getPaymentMethod, 
  addPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod
} = await import('../../controllers/paymentMethodController.js');

describe('PaymentMethodController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockPaymentMethodService).forEach(mock => mock.mockReset());
  });

  describe('getPaymentMethods', () => {
    it('should get payment methods successfully', async () => {
      const mockPaymentMethods = [
        { id: 1, card_number: '**** **** **** 1234', card_holder: 'John Doe', is_default: true },
        { id: 2, card_number: '**** **** **** 5678', card_holder: 'John Doe', is_default: false }
      ];
      mockPaymentMethodService.getPaymentMethods.mockResolvedValue(mockPaymentMethods);

      await getPaymentMethods(req, res, next);

      expect(mockPaymentMethodService.getPaymentMethods).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        paymentMethods: mockPaymentMethods
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockPaymentMethodService.getPaymentMethods.mockRejectedValue(error);

      await getPaymentMethods(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch payment methods',
        error: 'Database connection failed'
      });
    });
  });

  describe('getPaymentMethod', () => {
    it('should get payment method successfully', async () => {
      const mockPaymentMethod = { 
        id: 1, 
        card_number: '**** **** **** 1234', 
        card_holder: 'John Doe', 
        expiry_date: '12/25',
        is_default: true 
      };
      req.params = { id: '1' };
      mockPaymentMethodService.getPaymentMethod.mockResolvedValue(mockPaymentMethod);

      await getPaymentMethod(req, res, next);

      expect(mockPaymentMethodService.getPaymentMethod).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPaymentMethod
      });
    });

    it('should handle payment method not found', async () => {
      const error = new Error('Payment method not found');
      req.params = { id: '999' };
      mockPaymentMethodService.getPaymentMethod.mockRejectedValue(error);

      await getPaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment method not found'
      });
    });
  });

  describe('addPaymentMethod', () => {
    const paymentMethodData = {
      cardNumber: '4111111111111111',
      cardHolder: 'John Doe',
      expiryDate: '12/25',
      cvv: '123'
    };

    it('should add payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 1,
        card_number: '**** **** **** 1111',
        card_holder: 'John Doe',
        expiry_date: '12/25',
        is_default: false
      };
      req.body = paymentMethodData;
      mockPaymentMethodService.addPaymentMethod.mockResolvedValue(mockPaymentMethod);

      await addPaymentMethod(req, res, next);

      expect(mockPaymentMethodService.addPaymentMethod).toHaveBeenCalledWith(1, paymentMethodData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment method added successfully',
        paymentMethod: mockPaymentMethod
      });
    });

    it('should handle missing required fields', async () => {
      const error = new Error('Missing required fields');
      req.body = { cardHolder: 'John Doe' }; // Missing other fields
      mockPaymentMethodService.addPaymentMethod.mockRejectedValue(error);

      await addPaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields'
      });
    });

    it('should handle invalid card number', async () => {
      const error = new Error('Invalid card number');
      req.body = { ...paymentMethodData, cardNumber: '1234' };
      mockPaymentMethodService.addPaymentMethod.mockRejectedValue(error);

      await addPaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid card number'
      });
    });

    it('should handle expired card', async () => {
      const error = new Error('Card has expired');
      req.body = { ...paymentMethodData, expiryDate: '12/20' };
      mockPaymentMethodService.addPaymentMethod.mockRejectedValue(error);

      await addPaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Card has expired'
      });
    });
  });

  describe('updatePaymentMethod', () => {
    const updateData = {
      cardHolder: 'John Updated Doe',
      expiryDate: '06/26'
    };

    it('should update payment method successfully', async () => {
      const mockUpdatedMethod = {
        id: 1,
        card_number: '**** **** **** 1111',
        card_holder: 'John Updated Doe',
        expiry_date: '06/26',
        is_default: false
      };
      req.params = { id: '1' };
      req.body = updateData;
      mockPaymentMethodService.updatePaymentMethod.mockResolvedValue(mockUpdatedMethod);

      await updatePaymentMethod(req, res, next);

      expect(mockPaymentMethodService.updatePaymentMethod).toHaveBeenCalledWith('1', 1, updateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment method updated successfully',
        data: mockUpdatedMethod
      });
    });

    it('should handle payment method not found', async () => {
      const error = new Error('Payment method not found');
      req.params = { id: '999' };
      req.body = updateData;
      mockPaymentMethodService.updatePaymentMethod.mockRejectedValue(error);

      await updatePaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment method not found'
      });
    });

    it('should handle invalid expiry date', async () => {
      const error = new Error('Invalid expiry month');
      req.params = { id: '1' };
      req.body = { expiryDate: '13/25' };
      mockPaymentMethodService.updatePaymentMethod.mockRejectedValue(error);

      await updatePaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid expiry month'
      });
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set default payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 1,
        card_number: '**** **** **** 1111',
        card_holder: 'John Doe',
        is_default: true
      };
      req.params = { id: '1' };
      mockPaymentMethodService.setDefaultPaymentMethod.mockResolvedValue(mockPaymentMethod);

      await setDefaultPaymentMethod(req, res, next);

      expect(mockPaymentMethodService.setDefaultPaymentMethod).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Default payment method updated successfully',
        data: mockPaymentMethod
      });
    });

    it('should handle payment method not found', async () => {
      const error = new Error('Payment method not found');
      req.params = { id: '999' };
      mockPaymentMethodService.setDefaultPaymentMethod.mockRejectedValue(error);

      await setDefaultPaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment method not found'
      });
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method successfully', async () => {
      const mockDeletedMethod = { id: 1 };
      req.params = { id: '1' };
      mockPaymentMethodService.deletePaymentMethod.mockResolvedValue(mockDeletedMethod);

      await deletePaymentMethod(req, res, next);

      expect(mockPaymentMethodService.deletePaymentMethod).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment method deleted successfully',
        data: { id: 1 }
      });
    });

    it('should handle payment method not found', async () => {
      const error = new Error('Payment method not found');
      req.params = { id: '999' };
      mockPaymentMethodService.deletePaymentMethod.mockRejectedValue(error);

      await deletePaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment method not found'
      });
    });
  });

  describe('getDefaultPaymentMethod', () => {
    it('should get default payment method successfully', async () => {
      const mockDefaultMethod = {
        id: 1,
        card_number: '**** **** **** 1111',
        card_holder: 'John Doe',
        is_default: true
      };
      mockPaymentMethodService.getDefaultPaymentMethod.mockResolvedValue(mockDefaultMethod);

      await getDefaultPaymentMethod(req, res, next);

      expect(mockPaymentMethodService.getDefaultPaymentMethod).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDefaultMethod
      });
    });

    it('should handle no default payment method', async () => {
      mockPaymentMethodService.getDefaultPaymentMethod.mockResolvedValue(null);

      await getDefaultPaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockPaymentMethodService.getDefaultPaymentMethod.mockRejectedValue(error);

      await getDefaultPaymentMethod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch default payment method',
        error: 'Database connection failed'
      });
    });
  });
});