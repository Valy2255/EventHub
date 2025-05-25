// backend/tests/utils/emailService.test.js
import { jest } from '@jest/globals';

// Mock nodemailer
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail
}));
jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: mockCreateTransport }
}));

// Mock config
const mockConfig = {
  email: {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    user: 'test@example.com',
    pass: 'test-password',
    fromName: 'Test App'
  },
  cors: {
    origin: 'https://test-app.com'
  }
};
jest.unstable_mockModule('../../config/config.js', () => ({
  default: mockConfig
}));

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

// Mock email templates
const mockGetEmailTemplate = jest.fn();
jest.unstable_mockModule('../../utils/emailTemplates.js', () => ({
  getEmailTemplate: mockGetEmailTemplate
}));

describe('emailService', () => {
  let emailService;
  let consoleSpy, consoleErrorSpy;

  beforeAll(async () => {
    emailService = await import('../../utils/emailService.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default successful response for sendMail
    mockSendMail.mockResolvedValue({});
    mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      const email = 'user@example.com';
      const name = 'John Doe';

      await emailService.sendWelcomeEmail(email, name);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Test App" <test@example.com>',
        to: email,
        subject: 'Welcome to EventHub!',
        html: expect.stringContaining('Welcome to EventHub!')
      });

      // Check that HTML contains user's name and app origin
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hello John Doe');
      expect(callArgs.html).toContain('https://test-app.com/events/search');
      expect(callArgs.html).toContain(email);

      expect(consoleSpy).toHaveBeenCalledWith(`Welcome email sent to ${email}`);
    });

    it('should handle sendMail errors', async () => {
      const email = 'user@example.com';
      const name = 'John Doe';
      const error = new Error('SMTP error');

      mockSendMail.mockRejectedValue(error);

      await expect(emailService.sendWelcomeEmail(email, name)).rejects.toThrow('SMTP error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending welcome email:', error);
    });
  });

  describe('sendTicketEmail', () => {
    const mockTickets = [
      {
        id: 1,
        event_id: 1,
        event_name: 'Test Event',
        date: '2024-03-15',
        time: '19:00',
        venue: 'Test Venue',
        ticket_type_name: 'General Admission',
        price: '50.00',
        qr_code: 'data:image/png;base64,mock-qr-code'
      },
      {
        id: 2,
        event_id: 1,
        event_name: 'Test Event',
        date: '2024-03-15',
        time: '19:00',
        venue: 'Test Venue',
        ticket_type_name: 'VIP',
        price: '100.00',
        qr_code: 'data:image/png;base64,mock-qr-code-2'
      }
    ];

    it('should send ticket email with correct content', async () => {
      const email = 'user@example.com';
      const name = 'John Doe';
      const orderNumber = 'ORD-123';

      await emailService.sendTicketEmail(email, name, mockTickets, orderNumber);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Test App" <test@example.com>',
        to: email,
        subject: 'Your EventHub Tickets',
        html: expect.stringContaining('Your Tickets are Ready!')
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hello John Doe');
      expect(callArgs.html).toContain('ORD-123');
      expect(callArgs.html).toContain('Test Event');
      expect(callArgs.html).toContain('Friday, March 15, 2024');
      expect(callArgs.html).toContain('7:00 PM');
      expect(callArgs.html).toContain('Test Venue');
      expect(callArgs.html).toContain('General Admission');
      expect(callArgs.html).toContain('$50.00');
      expect(callArgs.html).toContain('VIP');
      expect(callArgs.html).toContain('$100.00');
      expect(callArgs.html).toContain('mock-qr-code');

      expect(consoleSpy).toHaveBeenCalledWith(`Ticket email sent to ${email}`);
    });

    it('should group tickets by event correctly', async () => {
      const ticketsFromMultipleEvents = [
        ...mockTickets,
        {
          id: 3,
          event_id: 2,
          event_name: 'Another Event',
          date: '2024-03-20',
          time: '20:00',
          venue: 'Another Venue',
          ticket_type_name: 'Standard',
          price: '75.00',
          qr_code: 'data:image/png;base64,mock-qr-code-3'
        }
      ];

      await emailService.sendTicketEmail('user@example.com', 'John Doe', ticketsFromMultipleEvents, 'ORD-123');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Test Event');
      expect(callArgs.html).toContain('Another Event');
      expect(callArgs.html).toContain('Test Venue');
      expect(callArgs.html).toContain('Another Venue');
    });

    it('should handle sendMail errors', async () => {
      const error = new Error('SMTP error');
      mockSendMail.mockRejectedValue(error);

      await expect(emailService.sendTicketEmail('user@example.com', 'John Doe', mockTickets, 'ORD-123'))
        .rejects.toThrow('SMTP error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending ticket email:', error);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct content', async () => {
      const email = 'user@example.com';
      const resetURL = 'https://test-app.com/reset-password?token=abc123';

      await emailService.sendPasswordResetEmail(email, resetURL);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Test App" <test@example.com>',
        to: email,
        subject: 'Password Reset Request',
        html: expect.stringContaining('Reset Your Password')
      });

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(resetURL);
      expect(callArgs.html).toContain('Reset Password');
      expect(callArgs.html).toContain('This link is valid for one hour');

      expect(consoleSpy).toHaveBeenCalledWith(`Password reset email sent to ${email}`);
    });

    it('should handle sendMail errors', async () => {
      const error = new Error('SMTP error');
      mockSendMail.mockRejectedValue(error);

      await expect(emailService.sendPasswordResetEmail('user@example.com', 'reset-url'))
        .rejects.toThrow('SMTP error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending password reset email:', error);
    });
  });

  describe('sendEventCanceledEmail', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'user@example.com'
    };

    const mockEvent = {
      id: 1,
      name: 'Test Event',
      date: '2024-03-15'
    };

    const mockPurchaseInfo = {
      order_id: 'ORD-123'
    };

    const mockRefundInfo = {
      amount: '100.00',
      paymentMethod: 'card'
    };

    const mockTemplate = {
      html: '<p>Event canceled email HTML</p>',
      text: 'Event canceled email text'
    };

    it('should send event canceled email successfully', async () => {
      mockGetEmailTemplate.mockReturnValue(mockTemplate);

      const result = await emailService.sendEventCanceledEmail(mockUser, mockEvent, mockPurchaseInfo, mockRefundInfo);

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('eventCanceled', {
        userName: 'John Doe',
        userEmail: 'user@example.com',
        eventName: 'Test Event',
        eventDate: '2024-03-15',
        refundAmount: '100.00',
        refundMethod: 'Original Payment Method',
        estimatedRefundTime: '5-10 business days',
        orderReference: 'ORD-123'
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Test App" <test@example.com>',
        to: 'user@example.com',
        subject: 'Event Canceled: Test Event - Refund Processing',
        html: '<p>Event canceled email HTML</p>',
        text: 'Event canceled email text'
      });

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('INSERT INTO notification_history'),
        values: [1, 1, 'event_canceled', 'user@example.com', 'Event canceled email text']
      });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Event cancellation email sent to user@example.com');
    });

    it('should handle credits refund method', async () => {
      mockGetEmailTemplate.mockReturnValue(mockTemplate);
      const creditsRefundInfo = { ...mockRefundInfo, paymentMethod: 'credits' };

      await emailService.sendEventCanceledEmail(mockUser, mockEvent, mockPurchaseInfo, creditsRefundInfo);

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('eventCanceled', 
        expect.objectContaining({
          refundMethod: 'Account Credits'
        })
      );
    });

    it('should handle sendMail errors', async () => {
      mockGetEmailTemplate.mockReturnValue(mockTemplate);
      const error = new Error('SMTP error');
      mockSendMail.mockRejectedValue(error);

      await expect(emailService.sendEventCanceledEmail(mockUser, mockEvent, mockPurchaseInfo, mockRefundInfo))
        .rejects.toThrow('SMTP error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending event cancellation email:', error);
    });
  });

  describe('sendEventRescheduledEmail', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'user@example.com'
    };

    const mockEvent = {
      id: 1,
      name: 'Test Event',
      original_date: '2024-03-15',
      original_time: '19:00',
      date: '2024-03-20',
      time: '20:00',
      venue: 'Test Venue'
    };

    const mockTemplate = {
      html: '<p>Event rescheduled email HTML</p>',
      text: 'Event rescheduled email text'
    };

    it('should send event rescheduled email successfully', async () => {
      mockGetEmailTemplate.mockReturnValue(mockTemplate);

      const result = await emailService.sendEventRescheduledEmail(mockUser, mockEvent);

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('eventRescheduled', {
        userName: 'John Doe',
        userEmail: 'user@example.com',
        eventName: 'Test Event',
        originalDate: '2024-03-15',
        originalTime: '19:00',
        newDate: '2024-03-20',
        newTime: '20:00',
        venue: 'Test Venue'
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Test App" <test@example.com>',
        to: 'user@example.com',
        subject: 'Event Rescheduled: Test Event',
        html: '<p>Event rescheduled email HTML</p>',
        text: 'Event rescheduled email text'
      });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Event rescheduling email sent to user@example.com');
    });
  });

  describe('sendEventReminderEmail', () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'user@example.com'
    };

    const mockEvent = {
      id: 1,
      name: 'Test Event',
      date: '2024-03-15',
      time: '19:00',
      venue: 'Test Venue',
      city: 'Test City'
    };

    const mockTemplate = {
      html: '<p>Event reminder email HTML</p>',
      text: 'Event reminder email text'
    };

    it('should send event reminder email successfully', async () => {
      mockGetEmailTemplate.mockReturnValue(mockTemplate);

      const result = await emailService.sendEventReminderEmail(mockUser, mockEvent);

      expect(mockGetEmailTemplate).toHaveBeenCalledWith('eventReminder', {
        userName: 'John Doe',
        userEmail: 'user@example.com',
        eventName: 'Test Event',
        eventDate: '2024-03-15',
        eventTime: '19:00',
        venue: 'Test Venue',
        city: 'Test City'
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"Test App" <test@example.com>',
        to: 'user@example.com',
        subject: 'Reminder: Test Event is Coming Up!',
        html: '<p>Event reminder email HTML</p>',
        text: 'Event reminder email text'
      });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Event reminder email sent to user@example.com');
    });
  });
});