// tests/controllers/paymentController.test.js

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

// Mock the PaymentService
const mockPaymentService = {
  processPayment: jest.fn(),
  sendTicketEmail: jest.fn(),
  getPaymentHistory: jest.fn(),
  getPaymentDetails: jest.fn()
};

jest.unstable_mockModule('../../services/PaymentService.js', () => ({
  PaymentService: jest.fn().mockImplementation(() => mockPaymentService)
}));

const { processPayment, getPaymentHistory, getPaymentDetails } = await import('../../controllers/paymentController.js');

describe('PaymentController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockPaymentService).forEach(mock => mock.mockReset());
  });

  describe('processPayment', () => {
    const paymentData = {
      amount: 100.00,
      paymentMethod: 'card',
      tickets: [
        { eventId: 1, ticketTypeId: 1, quantity: 2 }
      ]
    };

    it('should process payment successfully', async () => {
      const mockResult = {
        payment: { id: 1, amount: 100.00, status: 'completed' },
        purchase: { id: 1 },
        createdTickets: [
          { id: 1, qr_code: 'qr1', event_title: 'Test Event' },
          { id: 2, qr_code: 'qr2', event_title: 'Test Event' }
        ],
        orderNumber: 'ORD-001',
        paymentMethod: 'card',
        currentCredits: null
      };

      req.body = paymentData;
      req.user = { id: 1, email: 'test@example.com', name: 'Test User' };
      mockPaymentService.processPayment.mockResolvedValue(mockResult);
      mockPaymentService.sendTicketEmail.mockResolvedValue();

      await processPayment(req, res, next);

      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(1, paymentData);
      expect(mockPaymentService.sendTicketEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        mockResult.createdTickets,
        'ORD-001'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Payment successful",
        paymentId: 1,
        purchaseId: 1,
        tickets: mockResult.createdTickets,
        orderNumber: 'ORD-001',
        paymentMethod: 'card',
        savedCardId: undefined,
        paymentCompleted: true
      });
    });

    it('should handle invalid payment amount', async () => {
      const error = new Error('Invalid payment amount');
      req.body = { ...paymentData, amount: -10 };
      mockPaymentService.processPayment.mockRejectedValue(error);

      await processPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid payment amount'
      });
    });

    it('should handle insufficient credits', async () => {
      const error = new Error('Insufficient credits');
      error.creditsNeeded = 50;
      error.currentCredits = 20;
      req.body = { ...paymentData, useCredits: true };
      mockPaymentService.processPayment.mockRejectedValue(error);

      await processPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient credits',
        creditsNeeded: 50,
        currentCredits: 20
      });
    });

    it('should handle missing tickets', async () => {
      const error = new Error('No tickets provided');
      req.body = { ...paymentData, tickets: [] };
      mockPaymentService.processPayment.mockRejectedValue(error);

      await processPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No tickets provided'
      });
    });

    it('should handle payment processing failure', async () => {
      const error = new Error('Payment gateway error');
      req.body = paymentData;
      mockPaymentService.processPayment.mockRejectedValue(error);

      await processPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment processing failed',
        error: 'Payment gateway error'
      });
    });
  });

  describe('getPaymentHistory', () => {
    it('should get payment history successfully', async () => {
      const mockPayments = [
        { id: 1, amount: 100.00, status: 'completed', created_at: '2024-01-01' },
        { id: 2, amount: 50.00, status: 'completed', created_at: '2024-01-02' }
      ];
      mockPaymentService.getPaymentHistory.mockResolvedValue(mockPayments);

      await getPaymentHistory(req, res, next);

      expect(mockPaymentService.getPaymentHistory).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayments
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockPaymentService.getPaymentHistory.mockRejectedValue(error);

      await getPaymentHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch payment history',
        error: 'Database connection failed'
      });
    });
  });

  describe('getPaymentDetails', () => {
    it('should get payment details successfully', async () => {
      const mockResult = {
        payment: { id: 1, amount: 100.00, status: 'completed' },
        tickets: [
          { id: 1, qr_code: 'qr1', event_title: 'Test Event' },
          { id: 2, qr_code: 'qr2', event_title: 'Test Event' }
        ]
      };
      req.params = { id: '1' };
      mockPaymentService.getPaymentDetails.mockResolvedValue(mockResult);

      await getPaymentDetails(req, res, next);

      expect(mockPaymentService.getPaymentDetails).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle payment not found', async () => {
      const error = new Error('Payment not found');
      req.params = { id: '999' };
      mockPaymentService.getPaymentDetails.mockRejectedValue(error);

      await getPaymentDetails(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment not found'
      });
    });

    it('should handle unauthorized access', async () => {
      const error = new Error('Unauthorized access to this payment');
      req.params = { id: '1' };
      mockPaymentService.getPaymentDetails.mockRejectedValue(error);

      await getPaymentDetails(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized access to this payment'
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      req.params = { id: '1' };
      mockPaymentService.getPaymentDetails.mockRejectedValue(error);

      await getPaymentDetails(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch payment details',
        error: 'Database connection failed'
      });
    });
  });
});