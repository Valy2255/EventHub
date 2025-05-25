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

// Mock the CheckInService
const mockCheckInService = {
  findTicketByQr: jest.fn(),
  checkInTicket: jest.fn(),
  getEventCheckInStats: jest.fn()
};

jest.unstable_mockModule('../../services/CheckInService.js', () => ({
  CheckInService: jest.fn().mockImplementation(() => mockCheckInService)
}));

const { 
  findTicketByQr,
  checkInTicket,
  getEventCheckInStats
} = await import('../../controllers/checkInController.js');

describe('CheckInController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockCheckInService).forEach(mock => mock.mockReset());
  });

  describe('findTicketByQr', () => {
    it('should find ticket by QR data successfully', async () => {
      const mockTicket = {
        id: 1,
        eventId: 1,
        userId: 1,
        qrCode: 'QR123456',
        isCheckedIn: false,
        user: { name: 'John Doe', email: 'john@example.com' },
        event: { title: 'Test Event', date: '2024-12-31' }
      };
      req.body = { qrData: 'QR123456' };
      mockCheckInService.findTicketByQr.mockResolvedValue(mockTicket);

      await findTicketByQr(req, res, next);

      expect(mockCheckInService.findTicketByQr).toHaveBeenCalledWith('QR123456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTicket
      });
    });

    it('should return 400 when qrData is missing', async () => {
      req.body = {};

      await findTicketByQr(req, res, next);

      expect(mockCheckInService.findTicketByQr).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Ticket data is required"
      });
    });

    it('should handle already checked in ticket error', async () => {
      const mockTicket = {
        id: 1,
        eventId: 1,
        userId: 1,
        qrCode: 'QR123456',
        isCheckedIn: true
      };
      const error = new Error('Ticket has already been checked in');
      error.isAlreadyCheckedIn = true;
      error.ticketData = mockTicket;
      
      req.body = { qrData: 'QR123456' };
      mockCheckInService.findTicketByQr.mockRejectedValue(error);

      await findTicketByQr(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message,
        data: {
          ticket: mockTicket
        }
      });
    });

    it('should handle general service error', async () => {
      const error = new Error('Ticket not found');
      req.body = { qrData: 'INVALID_QR' };
      mockCheckInService.findTicketByQr.mockRejectedValue(error);

      await findTicketByQr(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('checkInTicket', () => {
    it('should check in ticket successfully', async () => {
      const mockResult = {
        id: 1,
        eventId: 1,
        userId: 1,
        isCheckedIn: true,
        checkedInAt: new Date().toISOString()
      };
      req.params = { ticketId: '1' };
      mockCheckInService.checkInTicket.mockResolvedValue(mockResult);

      await checkInTicket(req, res, next);

      expect(mockCheckInService.checkInTicket).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Ticket checked in successfully",
        data: mockResult
      });
    });

    it('should handle already checked in ticket error', async () => {
      const mockTicket = {
        id: 1,
        eventId: 1,
        userId: 1,
        isCheckedIn: true
      };
      const error = new Error('Ticket has already been checked in');
      error.isAlreadyCheckedIn = true;
      error.ticketData = mockTicket;
      
      req.params = { ticketId: '1' };
      mockCheckInService.checkInTicket.mockRejectedValue(error);

      await checkInTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message,
        data: {
          ticket: mockTicket
        }
      });
    });

    it('should handle ticket not found error', async () => {
      const error = new Error('Ticket not found');
      req.params = { ticketId: '999' };
      mockCheckInService.checkInTicket.mockRejectedValue(error);

      await checkInTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });

    it('should handle internal server error', async () => {
      const error = new Error('Database connection failed');
      req.params = { ticketId: '1' };
      mockCheckInService.checkInTicket.mockRejectedValue(error);

      await checkInTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Internal server error"
      });
    });

    it('should parse ticketId as integer', async () => {
      const mockResult = { id: 123, isCheckedIn: true };
      req.params = { ticketId: '123' };
      mockCheckInService.checkInTicket.mockResolvedValue(mockResult);

      await checkInTicket(req, res, next);

      expect(mockCheckInService.checkInTicket).toHaveBeenCalledWith(123);
    });
  });

  describe('getEventCheckInStats', () => {
    it('should get event check-in stats successfully', async () => {
      const mockStats = {
        eventId: 1,
        totalTickets: 100,
        checkedInTickets: 75,
        checkInPercentage: 75,
        event: { title: 'Test Event', date: '2024-12-31' }
      };
      req.params = { eventId: '1' };
      mockCheckInService.getEventCheckInStats.mockResolvedValue(mockStats);

      await getEventCheckInStats(req, res, next);

      expect(mockCheckInService.getEventCheckInStats).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle event not found error', async () => {
      const error = new Error('Event not found');
      req.params = { eventId: '999' };
      mockCheckInService.getEventCheckInStats.mockRejectedValue(error);

      await getEventCheckInStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });

    it('should handle internal server error', async () => {
      const error = new Error('Database query failed');
      req.params = { eventId: '1' };
      mockCheckInService.getEventCheckInStats.mockRejectedValue(error);

      await getEventCheckInStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to get check-in statistics"
      });
    });

    it('should parse eventId as integer', async () => {
      const mockStats = { eventId: 456, totalTickets: 50 };
      req.params = { eventId: '456' };
      mockCheckInService.getEventCheckInStats.mockResolvedValue(mockStats);

      await getEventCheckInStats(req, res, next);

      expect(mockCheckInService.getEventCheckInStats).toHaveBeenCalledWith(456);
    });
  });
});