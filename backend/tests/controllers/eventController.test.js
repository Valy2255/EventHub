// tests/controllers/eventController.test.js

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

// Mock the EventService
const mockEventService = {
  getEventById: jest.fn(),
  incrementViewCount: jest.fn(),
  getEventTicketTypes: jest.fn()
};

jest.unstable_mockModule('../../services/EventService.js', () => ({
  EventService: jest.fn().mockImplementation(() => mockEventService)
}));

const { getEventById, incrementViewCount, getEventTicketTypes } = await import('../../controllers/eventController.js');

describe('EventController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockEventService).forEach(mock => mock.mockReset());
  });

  describe('getEventById', () => {
    it('should get event by ID successfully', async () => {
      const mockEvent = {
        event: {
          id: 1,
          title: 'Test Event',
          description: 'Test Description',
          date: '2024-12-31',
          time: '20:00:00',
          venue: 'Test Venue',
          view_count: 100
        },
        ticketTypes: [
          { id: 1, name: 'General', price: 50.00, available_quantity: 100 },
          { id: 2, name: 'VIP', price: 150.00, available_quantity: 50 }
        ],
        reviews: [
          { id: 1, rating: 5, comment: 'Great event!', user_name: 'John Doe' }
        ],
        averageRating: 4.5,
        totalReviews: 10
      };
      req.params = { id: '1' };
      mockEventService.getEventById.mockResolvedValue(mockEvent);

      await getEventById(req, res, next);

      expect(mockEventService.getEventById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle event not found', async () => {
      const error = new Error('Event not found');
      req.params = { id: '999' };
      mockEventService.getEventById.mockRejectedValue(error);

      await getEventById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      req.params = { id: '1' };
      mockEventService.getEventById.mockRejectedValue(error);

      await getEventById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count successfully', async () => {
      req.params = { id: '1' };
      mockEventService.incrementViewCount.mockResolvedValue();

      await incrementViewCount(req, res, next);

      expect(mockEventService.incrementViewCount).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle service error gracefully', async () => {
      const error = new Error('Database connection failed');
      req.params = { id: '1' };
      mockEventService.incrementViewCount.mockRejectedValue(error);

      await incrementViewCount(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getEventTicketTypes', () => {
    it('should get event ticket types successfully', async () => {
      const mockTicketTypes = [
        {
          id: 1,
          name: 'General Admission',
          price: 50.00,
          description: 'Standard entry ticket',
          available_quantity: 100,
          max_per_purchase: 10
        },
        {
          id: 2,
          name: 'VIP',
          price: 150.00,
          description: 'VIP access with perks',
          available_quantity: 25,
          max_per_purchase: 4
        }
      ];
      req.params = { id: '1' };
      mockEventService.getEventTicketTypes.mockResolvedValue(mockTicketTypes);

      await getEventTicketTypes(req, res, next);

      expect(mockEventService.getEventTicketTypes).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTicketTypes
      });
    });

    it('should handle event not found', async () => {
      const error = new Error('Event not found');
      req.params = { id: '999' };
      mockEventService.getEventTicketTypes.mockRejectedValue(error);

      await getEventTicketTypes(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Event not found'
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      req.params = { id: '1' };
      mockEventService.getEventTicketTypes.mockRejectedValue(error);

      await getEventTicketTypes(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should return empty array for event with no ticket types', async () => {
      req.params = { id: '1' };
      mockEventService.getEventTicketTypes.mockResolvedValue([]);

      await getEventTicketTypes(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });
  });
});