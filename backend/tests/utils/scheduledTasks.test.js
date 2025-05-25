// backend/tests/utils/scheduledTasks.test.js
import { jest } from '@jest/globals';

// Mock node-cron
const mockSchedule = jest.fn();
jest.unstable_mockModule('node-cron', () => ({
  default: { schedule: mockSchedule }
}));

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

// Mock Ticket model
const mockProcessAutomaticRefundCompletion = jest.fn();
jest.unstable_mockModule('../../models/Ticket.js', () => ({
  processAutomaticRefundCompletion: mockProcessAutomaticRefundCompletion
}));

// Mock User model
jest.unstable_mockModule('../../models/User.js', () => ({}));

// Mock email service
const mockSendEventCanceledEmail = jest.fn();
const mockSendEventRescheduledEmail = jest.fn();
const mockSendEventReminderEmail = jest.fn();
jest.unstable_mockModule('../../utils/emailService.js', () => ({
  sendEventCanceledEmail: mockSendEventCanceledEmail,
  sendEventRescheduledEmail: mockSendEventRescheduledEmail,
  sendEventReminderEmail: mockSendEventReminderEmail
}));

// Mock refund service
const mockProcessEventCancellationRefunds = jest.fn();
jest.unstable_mockModule('../../services/refundService.js', () => ({
  default: { processEventCancellationRefunds: mockProcessEventCancellationRefunds }
}));

describe('scheduledTasks', () => {
  let scheduledTasks;
  let consoleSpy, consoleErrorSpy;

  beforeAll(async () => {
    scheduledTasks = await import('../../utils/scheduledTasks.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default mock responses
    mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    mockProcessAutomaticRefundCompletion.mockResolvedValue([]);
    mockSendEventCanceledEmail.mockResolvedValue(true);
    mockSendEventRescheduledEmail.mockResolvedValue(true);
    mockSendEventReminderEmail.mockResolvedValue(true);
    mockProcessEventCancellationRefunds.mockResolvedValue({ processedRefunds: [] });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('initializeScheduledTasks', () => {
    it('should schedule all cron jobs', () => {
      scheduledTasks.initializeScheduledTasks();

      expect(mockSchedule).toHaveBeenCalledTimes(4);
      
      // Verify cron patterns
      expect(mockSchedule).toHaveBeenCalledWith('0 1 * * *', expect.any(Function)); // Daily at 1 AM
      expect(mockSchedule).toHaveBeenCalledWith('0 */6 * * *', expect.any(Function)); // Every 6 hours
      expect(mockSchedule).toHaveBeenCalledWith('0 9 * * *', expect.any(Function)); // Daily at 9 AM
      expect(mockSchedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function)); // Every hour

      expect(consoleSpy).toHaveBeenCalledWith('All scheduled tasks initialized');
    });

    it('should handle errors in scheduled tasks', async () => {
      // Mock an error in one of the tasks
      mockDbQuery.mockRejectedValueOnce(new Error('Database error'));

      scheduledTasks.initializeScheduledTasks();

      // Get the first scheduled task (cleanup past events) and execute it
      const cleanupTask = mockSchedule.mock.calls[0][1];
      await cleanupTask();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in cleanup past events task:', 
        expect.any(Error)
      );
    });
  });

  describe('processRefunds', () => {
    it('should process refunds with default threshold', async () => {
      const mockRefunds = [
        { id: 1, amount: 50, status: 'completed' },
        { id: 2, amount: 100, status: 'completed' }
      ];
      mockProcessAutomaticRefundCompletion.mockResolvedValue(mockRefunds);

      const result = await scheduledTasks.processRefunds();

      expect(mockProcessAutomaticRefundCompletion).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockRefunds);
      expect(consoleSpy).toHaveBeenCalledWith('Running scheduled task: Processing refunds pending for more than 5 days...');
      expect(consoleSpy).toHaveBeenCalledWith('Successfully processed 2 refunds automatically.');
    });

    it('should process refunds with custom threshold', async () => {
      const mockRefunds = [];
      mockProcessAutomaticRefundCompletion.mockResolvedValue(mockRefunds);

      const result = await scheduledTasks.processRefunds(10);

      expect(mockProcessAutomaticRefundCompletion).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockRefunds);
      expect(consoleSpy).toHaveBeenCalledWith('Running scheduled task: Processing refunds pending for more than 10 days...');
    });

    it('should handle refund processing errors', async () => {
      const error = new Error('Refund processing failed');
      mockProcessAutomaticRefundCompletion.mockRejectedValue(error);

      await expect(scheduledTasks.processRefunds()).rejects.toThrow('Refund processing failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in scheduled refund processing task:', error);
    });
  });

  describe('cleanupPastEvents', () => {
    beforeEach(() => {
      // Mock Date to return a consistent value
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T10:30:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should update past events to inactive status', async () => {
      const mockResult = {
        rows: [
          { id: 1, name: 'Past Event 1', date: '2024-03-14', time: '19:00' },
          { id: 2, name: 'Past Event 2', date: '2024-03-13', time: '20:00' }
        ],
        rowCount: 2
      };
      mockDbQuery.mockResolvedValue(mockResult);

      const result = await scheduledTasks.cleanupPastEvents();

      // Check that the query was called with the update statement
      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE events.*SET status = 'inactive'/s)
      );
      
      expect(result).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith('Updated 2 past events to inactive status:', mockResult.rows);
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Database connection failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(scheduledTasks.cleanupPastEvents()).rejects.toThrow('Database connection failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error cleaning up past events:', error);
    });

    it('should log timezone information', async () => {
      mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await scheduledTasks.cleanupPastEvents();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Running cleanup at:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ISO time:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Time zone offset:'));
    });
  });

  describe('sendEventReminders', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T09:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should send reminders for events in 7 days', async () => {
      const mockEvents = [
        { id: 1, name: 'Future Event', date: '2024-03-22', status: 'active' }
      ];
      
      const mockTickets = [
        { 
          id: 1, 
          event_id: 1, 
          user_id: 1, 
          name: 'John Doe', 
          email: 'john@example.com',
          status: 'purchased'
        },
        { 
          id: 2, 
          event_id: 1, 
          user_id: 2, 
          name: 'Jane Smith', 
          email: 'jane@example.com',
          status: 'purchased'
        }
      ];

      // Mock database calls
      mockDbQuery
        .mockResolvedValueOnce({ rows: mockEvents }) // Events query
        .mockResolvedValueOnce({ rows: mockTickets }) // Tickets query
        .mockResolvedValue({ rows: [] }); // Notification history queries

      await scheduledTasks.sendEventReminders();

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM events.*WHERE date = \$1/s),
        ['2024-03-22']
      );

      expect(mockSendEventReminderEmail).toHaveBeenCalledTimes(2);
      expect(mockSendEventReminderEmail).toHaveBeenCalledWith(
        { id: 1, name: 'John Doe', email: 'john@example.com', tickets: [mockTickets[0]] },
        mockEvents[0]
      );
      expect(mockSendEventReminderEmail).toHaveBeenCalledWith(
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', tickets: [mockTickets[1]] },
        mockEvents[0]
      );

      expect(consoleSpy).toHaveBeenCalledWith('Found 1 events happening in 7 days');
      expect(consoleSpy).toHaveBeenCalledWith('Sent 2 event reminders');
    });

    it('should not send duplicate reminders', async () => {
      const mockEvents = [
        { id: 1, name: 'Future Event', date: '2024-03-22', status: 'active' }
      ];
      
      const mockTickets = [
        { 
          id: 1, 
          event_id: 1, 
          user_id: 1, 
          name: 'John Doe', 
          email: 'john@example.com',
          status: 'purchased'
        }
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: mockEvents })
        .mockResolvedValueOnce({ rows: mockTickets })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Notification already exists

      await scheduledTasks.sendEventReminders();

      expect(mockSendEventReminderEmail).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Sent 0 event reminders');
    });

    it('should handle email sending errors gracefully', async () => {
      const mockEvents = [
        { id: 1, name: 'Future Event', date: '2024-03-22', status: 'active' }
      ];
      
      const mockTickets = [
        { 
          id: 1, 
          event_id: 1, 
          user_id: 1, 
          name: 'John Doe', 
          email: 'john@example.com',
          status: 'purchased'
        }
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: mockEvents })
        .mockResolvedValueOnce({ rows: mockTickets })
        .mockResolvedValueOnce({ rows: [] });

      mockSendEventReminderEmail.mockRejectedValue(new Error('Email failed'));

      await scheduledTasks.sendEventReminders();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending reminder to user 1:', 
        expect.any(Error)
      );
    });
  });

  describe('processEventStatusChanges', () => {
    it('should process canceled and rescheduled events', async () => {
      const mockEvents = [
        { 
          id: 1, 
          name: 'Canceled Event', 
          status: 'canceled', 
          notification_status: 'pending',
          status_changed_at: '2024-03-15T10:00:00Z'
        },
        { 
          id: 2, 
          name: 'Rescheduled Event', 
          status: 'rescheduled', 
          notification_status: 'pending',
          status_changed_at: '2024-03-15T11:00:00Z'
        }
      ];

      // Mock the main query to find events with status changes
      mockDbQuery.mockResolvedValueOnce({ rows: mockEvents });
      
      // Mock additional queries for processing canceled event
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] }) // purchases query for canceled event
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // update notification status
        .mockResolvedValueOnce({ rows: [] }) // users query for rescheduled event
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // update notification status

      mockProcessEventCancellationRefunds.mockResolvedValue({ processedRefunds: [] });

      await scheduledTasks.processEventStatusChanges();

      // Use flexible matching for the SQL query
      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM events.*WHERE status IN \('canceled', 'rescheduled'\)/s)
      );

      expect(mockProcessEventCancellationRefunds).toHaveBeenCalledWith(1);
      expect(consoleSpy).toHaveBeenCalledWith('Found 2 events with status changes');
    });

    it('should handle processing errors', async () => {
      const error = new Error('Processing failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(scheduledTasks.processEventStatusChanges()).rejects.toThrow('Processing failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing event status changes:', error);
    });
  });
});