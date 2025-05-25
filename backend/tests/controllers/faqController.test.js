// tests/controllers/faqController.test.js

import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'admin@example.com', name: 'Admin User', role: 'admin' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the FaqService
const mockFaqService = {
  getAllFAQs: jest.fn(),
  createFAQ: jest.fn(),
  updateFAQ: jest.fn(),
  deleteFAQ: jest.fn(),
  updateFAQOrder: jest.fn()
};

jest.unstable_mockModule('../../services/FaqService.js', () => ({
  FaqService: jest.fn().mockImplementation(() => mockFaqService)
}));

const { getAllFAQs, createFAQ, updateFAQ, deleteFAQ, updateFAQOrder } = await import('../../controllers/faqController.js');

describe('FaqController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockFaqService).forEach(mock => mock.mockReset());
  });

  describe('getAllFAQs', () => {
    it('should get all FAQs successfully', async () => {
      const mockFaqs = [
        {
          id: 1,
          question: 'How do I buy tickets?',
          answer: 'You can purchase tickets through our website.',
          display_order: 1,
          is_active: true
        },
        {
          id: 2,
          question: 'Can I get a refund?',
          answer: 'Refunds are available according to our policy.',
          display_order: 2,
          is_active: true
        }
      ];
      mockFaqService.getAllFAQs.mockResolvedValue(mockFaqs);

      await getAllFAQs(req, res, next);

      expect(mockFaqService.getAllFAQs).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        faqs: mockFaqs
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockFaqService.getAllFAQs.mockRejectedValue(error);

      await getAllFAQs(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createFAQ', () => {
    const faqData = {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards, PayPal, and bank transfers.',
      display_order: 3
    };

    it('should create FAQ successfully', async () => {
      const mockFaq = { id: 1, ...faqData, is_active: true };
      req.body = faqData;
      mockFaqService.createFAQ.mockResolvedValue(mockFaq);

      await createFAQ(req, res, next);

      expect(mockFaqService.createFAQ).toHaveBeenCalledWith(faqData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        faq: mockFaq
      });
    });

    it('should handle missing question', async () => {
      req.body = { answer: 'Answer without question', display_order: 1 };

      await createFAQ(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Question and answer are required fields'
      });
    });

    it('should handle missing answer', async () => {
      req.body = { question: 'Question without answer', display_order: 1 };

      await createFAQ(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Question and answer are required fields'
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database constraint violation');
      req.body = faqData;
      mockFaqService.createFAQ.mockRejectedValue(error);

      await createFAQ(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateFAQ', () => {
    const updateData = {
      question: 'Updated question?',
      answer: 'Updated answer.',
      display_order: 5,
      is_active: false
    };

    it('should update FAQ successfully', async () => {
      const mockUpdatedFaq = { id: 1, ...updateData };
      req.params = { id: '1' };
      req.body = updateData;
      mockFaqService.updateFAQ.mockResolvedValue(mockUpdatedFaq);

      await updateFAQ(req, res, next);

      expect(mockFaqService.updateFAQ).toHaveBeenCalledWith('1', updateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        faq: mockUpdatedFaq
      });
    });

    it('should handle FAQ not found', async () => {
      req.params = { id: '999' };
      req.body = updateData;
      mockFaqService.updateFAQ.mockResolvedValue(null);

      await updateFAQ(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'FAQ not found'
      });
    });

    it('should handle partial update', async () => {
      const partialUpdate = { is_active: false };
      const mockUpdatedFaq = { id: 1, question: 'Original question', answer: 'Original answer', is_active: false };
      req.params = { id: '1' };
      req.body = partialUpdate;
      mockFaqService.updateFAQ.mockResolvedValue(mockUpdatedFaq);

      await updateFAQ(req, res, next);

      expect(mockFaqService.updateFAQ).toHaveBeenCalledWith('1', partialUpdate);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        faq: mockUpdatedFaq
      });
    });
  });

  describe('deleteFAQ', () => {
    it('should delete FAQ successfully', async () => {
      req.params = { id: '1' };
      mockFaqService.deleteFAQ.mockResolvedValue(true);

      await deleteFAQ(req, res, next);

      expect(mockFaqService.deleteFAQ).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'FAQ deleted successfully'
      });
    });

    it('should handle FAQ not found', async () => {
      req.params = { id: '999' };
      mockFaqService.deleteFAQ.mockResolvedValue(false);

      await deleteFAQ(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'FAQ not found'
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Cannot delete FAQ with dependencies');
      req.params = { id: '1' };
      mockFaqService.deleteFAQ.mockRejectedValue(error);

      await deleteFAQ(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateFAQOrder', () => {
    it('should update FAQ order successfully', async () => {
      const orderData = [
        { id: 1, display_order: 2 },
        { id: 2, display_order: 1 },
        { id: 3, display_order: 3 }
      ];
      req.body = { order: orderData };
      mockFaqService.updateFAQOrder.mockResolvedValue();

      await updateFAQOrder(req, res);

      expect(mockFaqService.updateFAQOrder).toHaveBeenCalledWith(orderData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'FAQ order updated successfully'
      });
    });

    it('should handle invalid order format', async () => {
      req.body = { order: 'not-an-array' };

      await updateFAQOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order must be an array of {id, display_order} objects'
      });
    });

    it('should handle missing order data', async () => {
      req.body = {};

      await updateFAQOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order must be an array of {id, display_order} objects'
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database transaction failed');
      const orderData = [{ id: 1, display_order: 1 }];
      req.body = { order: orderData };
      mockFaqService.updateFAQOrder.mockRejectedValue(error);

      await updateFAQOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database transaction failed'
      });
    });
  });
});