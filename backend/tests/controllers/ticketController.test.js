// tests/controllers/ticketController.test.js

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

// Mock the TicketService
const mockTicketService = {
  getUserTickets: jest.fn(),
  getUpcomingTickets: jest.fn(),
  getTicketById: jest.fn(),
  requestRefund: jest.fn(),
  exchangeTicket: jest.fn(),
  getCancelledTickets: jest.fn()
};

jest.unstable_mockModule('../../services/TicketService.js', () => ({
  TicketService: jest.fn().mockImplementation(() => mockTicketService)
}));

const { 
  getUserTickets, 
  getUpcomingTickets, 
  getTicketById, 
  requestRefund, 
  exchangeTicket,
  getCancelledTickets
} = await import('../../controllers/ticketController.js');

describe('TicketController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockTicketService).forEach(mock => mock.mockReset());
  });

  describe('getUserTickets', () => {
    it('should get user tickets successfully', async () => {
      const mockTickets = {
        'Test Event 1': [
          { id: 1, qr_code: 'qr1', status: 'active', event_title: 'Test Event 1' }
        ],
        'Test Event 2': [
          { id: 2, qr_code: 'qr2', status: 'active', event_title: 'Test Event 2' }
        ]
      };
      mockTicketService.getUserTickets.mockResolvedValue(mockTickets);

      await getUserTickets(req, res, next);

      expect(mockTicketService.getUserTickets).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTickets
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockTicketService.getUserTickets.mockRejectedValue(error);

      await getUserTickets(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUpcomingTickets', () => {
    it('should get upcoming tickets successfully', async () => {
      const mockTickets = {
        'Upcoming Event': [
          { id: 1, qr_code: 'qr1', status: 'active', event_date: '2024-12-31' }
        ]
      };
      mockTicketService.getUpcomingTickets.mockResolvedValue(mockTickets);

      await getUpcomingTickets(req, res, next);

      expect(mockTicketService.getUpcomingTickets).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTickets
      });
    });
  });

  describe('getTicketById', () => {
    it('should get ticket by ID successfully', async () => {
      const mockResult = {
        ticket: { id: 1, qr_code: 'qr1', status: 'active' },
        event: { id: 1, title: 'Test Event', date: '2024-12-31' }
      };
      req.params = { id: '1' };
      mockTicketService.getTicketById.mockResolvedValue(mockResult);

      await getTicketById(req, res, next);

      expect(mockTicketService.getTicketById).toHaveBeenCalledWith('1', 1, 'user');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle ticket not found', async () => {
      const error = new Error('Ticket not found');
      req.params = { id: '999' };
      mockTicketService.getTicketById.mockRejectedValue(error);

      await getTicketById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Ticket not found'
      });
    });

    it('should handle unauthorized access', async () => {
      const error = new Error('You do not have permission to view this ticket');
      req.params = { id: '1' };
      mockTicketService.getTicketById.mockRejectedValue(error);

      await getTicketById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have permission to view this ticket'
      });
    });
  });

  describe('requestRefund', () => {
    it('should request refund successfully', async () => {
      const mockTicket = { id: 1, status: 'refund_requested', refund_status: 'pending' };
      req.params = { id: '1' };
      mockTicketService.requestRefund.mockResolvedValue(mockTicket);

      await requestRefund(req, res, next);

      expect(mockTicketService.requestRefund).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Ticket has been cancelled and refund has been requested',
        data: { ticket: mockTicket }
      });
    });

    it('should handle ticket not found', async () => {
      const error = new Error('Ticket not found');
      req.params = { id: '999' };
      mockTicketService.requestRefund.mockRejectedValue(error);

      await requestRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Ticket not found'
      });
    });

    it('should handle unauthorized refund', async () => {
      const error = new Error('You do not have permission to refund this ticket');
      req.params = { id: '1' };
      mockTicketService.requestRefund.mockRejectedValue(error);

      await requestRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have permission to refund this ticket'
      });
    });

    it('should handle already cancelled ticket', async () => {
      const error = new Error('This ticket has already been cancelled');
      req.params = { id: '1' };
      mockTicketService.requestRefund.mockRejectedValue(error);

      await requestRefund(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'This ticket has already been cancelled'
      });
    });
  });

  describe('exchangeTicket', () => {
    const exchangeData = {
      newTicketTypeId: 2,
      paymentMethod: 'card',
      amount: 25.00
    };

    it('should exchange ticket successfully', async () => {
      const mockResult = {
        originalTicket: { id: 1, status: 'exchanged' },
        newTicket: { id: 3, status: 'active', ticket_type_id: 2 },
        refundAmount: 10.00,
        additionalPayment: 25.00
      };
      req.params = { id: '1' };
      req.body = exchangeData;
      mockTicketService.exchangeTicket.mockResolvedValue(mockResult);

      await exchangeTicket(req, res, next);

      expect(mockTicketService.exchangeTicket).toHaveBeenCalledWith('1', 1, exchangeData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Ticket has been exchanged successfully',
        data: mockResult
      });
    });

    it('should handle ticket not found', async () => {
      const error = new Error('Ticket not found');
      req.params = { id: '999' };
      req.body = exchangeData;
      mockTicketService.exchangeTicket.mockRejectedValue(error);

      await exchangeTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Ticket not found'
      });
    });

    it('should handle unauthorized exchange', async () => {
      const error = new Error('You do not have permission to exchange this ticket');
      req.params = { id: '1' };
      req.body = exchangeData;
      mockTicketService.exchangeTicket.mockRejectedValue(error);

      await exchangeTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have permission to exchange this ticket'
      });
    });

    it('should handle insufficient credits for exchange', async () => {
      const error = new Error('Insufficient credits for exchange');
      error.creditsNeeded = 50;
      error.currentCredits = 20;
      error.canUseCardPayment = true;
      req.params = { id: '1' };
      req.body = exchangeData;
      mockTicketService.exchangeTicket.mockRejectedValue(error);

      await exchangeTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient credits for exchange',
        creditsNeeded: 50,
        currentCredits: 20,
        canUseCardPayment: true
      });
    });

    it('should handle already exchanged ticket', async () => {
      const error = new Error('This ticket has already been exchanged');
      req.params = { id: '1' };
      req.body = exchangeData;
      mockTicketService.exchangeTicket.mockRejectedValue(error);

      await exchangeTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'This ticket has already been exchanged'
      });
    });
  });

  describe('getCancelledTickets', () => {
    it('should get cancelled tickets successfully', async () => {
      const mockTickets = [
        { id: 1, status: 'cancelled', refund_status: 'approved' },
        { id: 2, status: 'cancelled', refund_status: 'pending' }
      ];
      mockTicketService.getCancelledTickets.mockResolvedValue(mockTickets);

      await getCancelledTickets(req, res, next);

      expect(mockTicketService.getCancelledTickets).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTickets
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockTicketService.getCancelledTickets.mockRejectedValue(error);

      await getCancelledTickets(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});