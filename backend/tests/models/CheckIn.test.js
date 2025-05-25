// backend/tests/models/CheckIn.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('CheckIn Model', () => {
  let CheckIn;

  beforeAll(async () => {
    CheckIn = await import('../../models/CheckIn.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findTicketById', () => {
    it('should find ticket with all related information', async () => {
      const mockTicket = {
        id: 1,
        event_name: 'Test Event',
        date: '2024-03-15',
        time: '19:00',
        venue: 'Test Venue',
        ticket_type_name: 'General Admission',
        user_name: 'John Doe',
        user_email: 'john@example.com',
        status: 'purchased'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockTicket] });

      const result = await CheckIn.findTicketById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT t\.\*.*FROM tickets t.*WHERE t\.id = \$1 AND t\.status = 'purchased'/s),
        values: [1]
      });
      expect(result).toEqual(mockTicket);
    });

    it('should return undefined for non-existent ticket', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await CheckIn.findTicketById(999);

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-purchased ticket', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await CheckIn.findTicketById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("t.status = 'purchased'"),
        values: [1]
      });
      expect(result).toBeUndefined();
    });
  });

  describe('updateCheckInStatus', () => {
    it('should update ticket check-in status', async () => {
      const mockUpdatedTicket = {
        id: 1,
        checked_in: true,
        checked_in_at: '2024-03-15T19:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockUpdatedTicket] });

      const result = await CheckIn.updateCheckInStatus(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE tickets.*SET checked_in = true.*WHERE id = \$1.*RETURNING \*/s),
        values: [1]
      });
      expect(result).toEqual(mockUpdatedTicket);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(CheckIn.updateCheckInStatus(1)).rejects.toThrow('Database error');
    });
  });

  describe('findEventById', () => {
    it('should find event by ID', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        date: '2024-03-15',
        time: '19:00',
        venue: 'Test Venue'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockEvent] });

      const result = await CheckIn.findEventById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'SELECT * FROM events WHERE id = $1',
        values: [1]
      });
      expect(result).toEqual(mockEvent);
    });

    it('should return undefined for non-existent event', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await CheckIn.findEventById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('getEventStats', () => {
    it('should get event statistics', async () => {
      const mockStats = {
        total_tickets: '100',
        valid_tickets: '95',
        checked_in_count: '25'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockStats] });

      const result = await CheckIn.getEventStats(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT.*COUNT\(\*\) as total_tickets.*FROM tickets.*WHERE event_id = \$1/s),
        values: [1]
      });
      expect(result).toEqual(mockStats);
    });

    it('should handle events with no tickets', async () => {
      const mockStats = {
        total_tickets: '0',
        valid_tickets: '0',
        checked_in_count: '0'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockStats] });

      const result = await CheckIn.getEventStats(1);

      expect(result).toEqual(mockStats);
    });
  });

  describe('getRecentCheckIns', () => {
    it('should get recent check-ins for an event', async () => {
      const mockCheckIns = [
        {
          id: 1,
          checked_in_at: '2024-03-15T19:30:00Z',
          ticket_type: 'VIP',
          user_name: 'John Doe'
        },
        {
          id: 2,
          checked_in_at: '2024-03-15T19:25:00Z',
          ticket_type: 'General',
          user_name: 'Jane Smith'
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockCheckIns });

      const result = await CheckIn.getRecentCheckIns(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT t\.id, t\.checked_in_at.*FROM tickets t.*WHERE t\.event_id = \$1 AND t\.checked_in = true.*ORDER BY t\.checked_in_at DESC.*LIMIT 10/s),
        values: [1]
      });
      expect(result).toEqual(mockCheckIns);
    });

    it('should return empty array for events with no check-ins', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await CheckIn.getRecentCheckIns(1);

      expect(result).toEqual([]);
    });

    it('should limit results to 10', async () => {
      const mockCheckIns = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        checked_in_at: '2024-03-15T19:30:00Z',
        ticket_type: 'General',
        user_name: `User ${i + 1}`
      }));

      mockDbQuery.mockResolvedValue({ rows: mockCheckIns });

      const result = await CheckIn.getRecentCheckIns(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('LIMIT 10'),
        values: [1]
      });
      expect(result).toHaveLength(10);
    });
  });
});