import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'user@example.com', name: 'Test User', role: 'user' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the CreditService
const mockCreditService = {
  getCreditBalance: jest.fn(),
  getCreditHistory: jest.fn()
};

jest.unstable_mockModule('../../services/CreditService.js', () => ({
  CreditService: jest.fn().mockImplementation(() => mockCreditService)
}));

const { 
  getCreditBalance,
  getCreditHistory
} = await import('../../controllers/creditController.js');

describe('CreditController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockCreditService).forEach(mock => mock.mockReset());
  });

  describe('getCreditBalance', () => {
    it('should get credit balance successfully', async () => {
      const mockCredits = {
        balance: 150.50,
        pending: 25.00,
        total: 175.50
      };
      req.user = { id: 1 };
      mockCreditService.getCreditBalance.mockResolvedValue(mockCredits);

      await getCreditBalance(req, res, next);

      expect(mockCreditService.getCreditBalance).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        credits: mockCredits
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      req.user = { id: 1 };
      mockCreditService.getCreditBalance.mockRejectedValue(error);

      await getCreditBalance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch credit balance',
        error: error.message
      });
    });

    it('should use user ID from request', async () => {
      const mockCredits = { balance: 75.25 };
      req.user = { id: 5 };
      mockCreditService.getCreditBalance.mockResolvedValue(mockCredits);

      await getCreditBalance(req, res, next);

      expect(mockCreditService.getCreditBalance).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        credits: mockCredits
      });
    });
  });

  describe('getCreditHistory', () => {
    it('should get credit history successfully', async () => {
      const mockResult = {
        transactions: [
          {
            id: 1,
            type: 'credit',
            amount: 50.00,
            description: 'Bonus credits',
            createdAt: '2024-12-01T10:00:00Z'
          },
          {
            id: 2,
            type: 'debit',
            amount: 25.00,
            description: 'Ticket purchase',
            createdAt: '2024-12-02T15:30:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };
      req.user = { id: 1 };
      req.query = { page: '1', limit: '20' };
      mockCreditService.getCreditHistory.mockResolvedValue(mockResult);

      await getCreditHistory(req, res, next);

      expect(mockCreditService.getCreditHistory).toHaveBeenCalledWith(1, '1', '20');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        transactions: mockResult.transactions,
        pagination: mockResult.pagination
      });
    });

    it('should handle query parameters correctly', async () => {
      const mockResult = {
        transactions: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 }
      };
      req.user = { id: 3 };
      req.query = { page: '2', limit: '10' };
      mockCreditService.getCreditHistory.mockResolvedValue(mockResult);

      await getCreditHistory(req, res, next);

      expect(mockCreditService.getCreditHistory).toHaveBeenCalledWith(3, '2', '10');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        transactions: mockResult.transactions,
        pagination: mockResult.pagination
      });
    });

    it('should handle missing query parameters', async () => {
      const mockResult = {
        transactions: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
      req.user = { id: 1 };
      req.query = {};
      mockCreditService.getCreditHistory.mockResolvedValue(mockResult);

      await getCreditHistory(req, res, next);

      expect(mockCreditService.getCreditHistory).toHaveBeenCalledWith(1, undefined, undefined);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        transactions: mockResult.transactions,
        pagination: mockResult.pagination
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      req.user = { id: 1 };
      mockCreditService.getCreditHistory.mockRejectedValue(error);

      await getCreditHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch credit history',
        error: error.message
      });
    });

    it('should use user ID from request for history', async () => {
      const mockResult = {
        transactions: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
      req.user = { id: 7 };
      req.query = { page: '1', limit: '15' };
      mockCreditService.getCreditHistory.mockResolvedValue(mockResult);

      await getCreditHistory(req, res, next);

      expect(mockCreditService.getCreditHistory).toHaveBeenCalledWith(7, '1', '15');
    });
  });
});