// backend/tests/models/Event.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('Event Model', () => {
  let Event;
  let consoleSpy, consoleErrorSpy;

  beforeAll(async () => {
    Event = await import('../../models/Event.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('findById', () => {
    it('should find event by ID with detailed information', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        category_name: 'Concert',
        category_slug: 'concert',
        subcategory_name: 'Rock',
        subcategory_slug: 'rock',
        status: 'active'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockEvent] });

      const result = await Event.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT e\.\*.*FROM events e.*WHERE e\.id = \$1 AND e\.status IN \('active', 'rescheduled'\)/s),
        values: [1]
      });
      expect(result).toEqual(mockEvent);
    });

    it('should return undefined for non-existent event', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Event.findById(999);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Event.findById(1)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding event:', error);
    });

    it('should only return active or rescheduled events', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Event.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("e.status IN ('active', 'rescheduled')"),
        values: [1]
      });
    });
  });

  describe('findRelated', () => {
    it('should find related events in same category', async () => {
      const mockRelatedEvents = [
        {
          id: 2,
          name: 'Related Event 1',
          category_name: 'Concert',
          category_slug: 'concert',
          is_rescheduled: false
        },
        {
          id: 3,
          name: 'Related Event 2',
          category_name: 'Concert',
          category_slug: 'concert',
          is_rescheduled: true
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockRelatedEvents });

      const result = await Event.findRelated(1, 5, 4);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/SELECT e\.\*.*WHERE e\.category_id = \$1.*AND e\.id != \$2.*AND e\.date >= CURRENT_DATE.*LIMIT \$3/s),
        values: [1, 5, 4]
      });
      expect(result).toEqual(mockRelatedEvents);
    });

    it('should use default limit when not provided', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Event.findRelated(1, 5);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('LIMIT $3'),
        values: [1, 5, 4]
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Event.findRelated(1, 5)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding related events:', error);
    });
  });

  describe('incrementViews', () => {
    it('should increment view count for an event', async () => {
      const mockResult = { id: 1 };
      mockDbQuery.mockResolvedValue({ rows: [mockResult] });

      const result = await Event.incrementViews(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE events.*SET views = COALESCE\(views, 0\) \+ 1.*WHERE id = \$1.*RETURNING id/s),
        values: [1]
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Event.incrementViews(1)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error incrementing views:', error);
    });
  });

  describe('create', () => {
    const mockEventData = {
      name: 'New Event',
      description: 'Event description',
      date: '2024-03-15',
      time: '19:00',
      venue: 'Test Venue',
      address: '123 Test St',
      image_url: 'http://example.com/image.jpg',
      category_id: 1,
      subcategory_id: 1,
      organizer_id: 1,
      price_range: '$50-100',
      cancellation_policy: 'Refund available',
      max_tickets: 100
    };

    it('should create a new event', async () => {
      const mockCreated = { id: 1, ...mockEventData, status: 'active' };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await Event.create(mockEventData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/INSERT INTO events\(.*\).*VALUES\(\$1, \$2, \$3.*\).*RETURNING \*/s),
        values: [
          'New Event',
          'Event description',
          '2024-03-15',
          '19:00',
          'Test Venue',
          '123 Test St',
          'http://example.com/image.jpg',
          1,
          1,
          1,
          '$50-100',
          'active',
          'Refund available',
          100
        ]
      });
      expect(result).toEqual(mockCreated);
    });

    it('should create event with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockCreated = { id: 1, ...mockEventData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await Event.create(mockEventData, mockClient);

      expect(mockClient.query).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it('should use default status if not provided', async () => {
      const dataWithoutStatus = { ...mockEventData };
      delete dataWithoutStatus.status;
      
      const mockCreated = { id: 1, ...dataWithoutStatus, status: 'active' };
      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      await Event.create(dataWithoutStatus);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: expect.arrayContaining(['active'])
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Event.create(mockEventData)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating event:', error);
    });
  });

  describe('update', () => {
    const mockUpdateData = {
      name: 'Updated Event',
      description: 'Updated description'
    };

    it('should update an event', async () => {
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Event.update(1, mockUpdateData);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/UPDATE events.*SET name = \$1, description = \$2, updated_at = CURRENT_TIMESTAMP.*WHERE id = \$3.*RETURNING \*/s),
        values: ['Updated Event', 'Updated description', 1]
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should update event with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockUpdated = { id: 1, ...mockUpdateData };
      mockClient.query.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Event.update(1, mockUpdateData, mockClient);

      expect(mockClient.query).toHaveBeenCalled();
      expect(result).toEqual(mockUpdated);
    });

    
    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Event.update(1, mockUpdateData)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating event:', error);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const mockDeleted = { id: 1 };
      mockDbQuery.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Event.deleteEvent(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: 'DELETE FROM events WHERE id = $1 RETURNING id',
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should delete event with custom client', async () => {
      const mockClient = { query: jest.fn() };
      const mockDeleted = { id: 1 };
      mockClient.query.mockResolvedValue({ rows: [mockDeleted] });

      const result = await Event.deleteEvent(1, mockClient);

      expect(mockClient.query).toHaveBeenCalledWith({
        text: 'DELETE FROM events WHERE id = $1 RETURNING id',
        values: [1]
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Event.deleteEvent(1)).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting event:', error);
    });
  });

  describe('findAll', () => {
    it('should find all events with default filters', async () => {
      const mockEvents = [
        { id: 1, name: 'Event 1', category_name: 'Concert', subcategory_name: 'Rock' },
        { id: 2, name: 'Event 2', category_name: 'Sports', subcategory_name: 'Football' }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockEvents });

      const result = await Event.findAll();

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT e\.\*.*FROM events e.*WHERE e\.status IN \('active', 'rescheduled'\).*ORDER BY e\.created_at DESC.*LIMIT \$1 OFFSET \$2/s),
        [10, 0]
      );
      expect(result).toEqual(mockEvents);
    });

    it('should apply status filter', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Event.findAll({ status: 'cancelled' });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/WHERE e\.status = \$1/s),
        ['cancelled', 10, 0]
      );
    });

    it('should apply sorting options', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Event.findAll({ sort: 'date_asc' });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/ORDER BY e\.date ASC, e\.time ASC/s),
        [10, 0]
      );
    });

    it('should apply pagination', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Event.findAll({}, { page: 2, limit: 5 });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/LIMIT \$1 OFFSET \$2/s),
        [5, 5]
      );
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(Event.findAll()).rejects.toThrow('Database error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error finding all events:', error);
    });
  });

  describe('checkEventPermission', () => {
    it('should return true for event creator', async () => {
      const mockEvent = { id: 1, creator_id: 123 };
      mockDbQuery.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await Event.checkEventPermission(1, 123);

      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT * FROM events WHERE id = $1',
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return true for admin user', async () => {
      const mockEvent = { id: 1, creator_id: 456 };
      const mockUser = { role: 'admin' };
      
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockEvent] })
        .mockResolvedValueOnce({ rows: [mockUser] });

      const result = await Event.checkEventPermission(1, 123);

      expect(result).toBe(true);
    });

    it('should return false for non-creator non-admin', async () => {
      const mockEvent = { id: 1, creator_id: 456 };
      const mockUser = { role: 'user' };
      
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockEvent] })
        .mockResolvedValueOnce({ rows: [mockUser] });

      const result = await Event.checkEventPermission(1, 123);

      expect(result).toBe(false);
    });

    it('should return false for non-existent event', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Event.checkEventPermission(999, 123);

      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const mockEvent = { id: 1, creator_id: 456 };
      
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockEvent] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await Event.checkEventPermission(1, 123);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      const result = await Event.checkEventPermission(1, 123);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking event permission:', error);
    });
  });
});