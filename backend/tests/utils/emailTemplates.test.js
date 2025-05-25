// backend/tests/utils/emailTemplates.test.js
import { jest } from '@jest/globals';

// Mock config
const mockConfig = {
  cors: {
    origin: 'https://test-app.com'
  }
};
jest.unstable_mockModule('../../config/config.js', () => ({
  default: mockConfig
}));

describe('emailTemplates', () => {
  let emailTemplates, getEmailTemplate;

  beforeAll(async () => {
    const module = await import('../../utils/emailTemplates.js');
    emailTemplates = module.default;
    getEmailTemplate = module.getEmailTemplate;
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2024-03-15';
      const result = emailTemplates.formatDate(dateString);
      
      expect(result).toBe('Friday, March 15, 2024');
    });

    it('should handle different date formats', () => {
      const dateString = '2024-12-25T10:30:00Z';
      const result = emailTemplates.formatDate(dateString);
      
      expect(result).toContain('December 25, 2024');
    });
  });

  describe('formatTime', () => {
    it('should format time string correctly for AM', () => {
      const timeString = '09:30';
      const result = emailTemplates.formatTime(timeString);
      
      expect(result).toBe('9:30 AM');
    });

    it('should format time string correctly for PM', () => {
      const timeString = '14:45';
      const result = emailTemplates.formatTime(timeString);
      
      expect(result).toBe('2:45 PM');
    });

    it('should handle noon correctly', () => {
      const timeString = '12:00';
      const result = emailTemplates.formatTime(timeString);
      
      expect(result).toBe('12:00 PM');
    });

    it('should handle midnight correctly', () => {
      const timeString = '00:00';
      const result = emailTemplates.formatTime(timeString);
      
      expect(result).toBe('12:00 AM');
    });

    it('should return empty string for undefined/null time', () => {
      expect(emailTemplates.formatTime(null)).toBe('');
      expect(emailTemplates.formatTime(undefined)).toBe('');
      expect(emailTemplates.formatTime('')).toBe('');
    });
  });

  describe('getEmailTemplate', () => {
    const mockData = {
      userName: 'John Doe',
      userEmail: 'john@example.com',
      eventName: 'Test Event',
      eventDate: '2024-03-15',
      refundAmount: '99.50',
      refundMethod: 'Credit Card',
      estimatedRefundTime: '5-10 business days',
      orderReference: 'ORD-123',
      originalDate: '2024-03-15',
      originalTime: '19:00',
      newDate: '2024-03-20',
      newTime: '20:00',
      venue: 'Test Venue',
      city: 'Test City'
    };

    it('should return eventCanceled template with correct data', () => {
      const template = getEmailTemplate('eventCanceled', mockData);
      
      expect(template).toHaveProperty('html');
      expect(template).toHaveProperty('text');
      expect(template.html).toContain('Event Canceled: Test Event');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('$99.50');
      expect(template.html).toContain('Credit Card');
      expect(template.html).toContain('ORD-123');
      expect(template.html).toContain('https://test-app.com');
      
      expect(template.text).toContain('Event Canceled: Test Event');
      expect(template.text).toContain('John Doe');
      expect(template.text).toContain('$99.50');
    });

    it('should return eventRescheduled template with correct data', () => {
      const template = getEmailTemplate('eventRescheduled', mockData);
      
      expect(template).toHaveProperty('html');
      expect(template).toHaveProperty('text');
      expect(template.html).toContain('Event Rescheduled: Test Event');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('Friday, March 15, 2024');
      expect(template.html).toContain('7:00 PM');
      expect(template.html).toContain('Wednesday, March 20, 2024');
      expect(template.html).toContain('8:00 PM');
      expect(template.html).toContain('Test Venue');
      
      expect(template.text).toContain('Event Rescheduled: Test Event');
      expect(template.text).toContain('John Doe');
    });

    it('should return eventReminder template with correct data', () => {
      const template = getEmailTemplate('eventReminder', mockData);
      
      expect(template).toHaveProperty('html');
      expect(template).toHaveProperty('text');
      expect(template.html).toContain('Your Event is Coming Up!');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('Test Event');
      expect(template.html).toContain('Test Venue, Test City');
      
      expect(template.text).toContain('Your Event is Coming Up!');
      expect(template.text).toContain('John Doe');
    });

    it('should return default template for unknown template name', () => {
      const template = getEmailTemplate('unknownTemplate', mockData);
      
      expect(template.html).toBe('<p>Email template not found</p>');
      expect(template.text).toBe('Email template not found');
    });

    it('should handle missing data gracefully', () => {
      const incompleteData = {
        userName: 'John Doe',
        eventName: 'Test Event'
      };
      
      const template = getEmailTemplate('eventCanceled', incompleteData);
      
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('Test Event');
      // Should not throw errors for undefined values
      expect(template.html).toContain('$NaN'); // parseFloat of undefined
    });

    it('should include status_change_reason when provided in rescheduled template', () => {
      const dataWithReason = {
        ...mockData,
        status_change_reason: 'Venue conflict'
      };
      
      const template = getEmailTemplate('eventRescheduled', dataWithReason);
      
      expect(template.html).toContain('Venue conflict');
    });

    it('should not include reason section when not provided in rescheduled template', () => {
      const template = getEmailTemplate('eventRescheduled', mockData);
      
      expect(template.html).not.toContain('<p><strong>Reason:</strong>');
    });
  });
});