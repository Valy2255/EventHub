// backend/tests/utils/sendEmail.test.js
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
  }
};
jest.unstable_mockModule('../../config/config.js', () => ({
  default: mockConfig
}));

describe('sendEmail', () => {
  let sendEmail;

  beforeAll(async () => {
    sendEmail = (await import('../../utils/sendEmail.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create transporter with correct config', async () => {
    const emailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    };

    mockSendMail.mockResolvedValue({});

    await sendEmail(emailOptions);

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    });
  });

  it('should send email with correct options', async () => {
    const emailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    };

    const expectedMailOptions = {
      from: '"Test App" <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    };

    mockSendMail.mockResolvedValue({});

    await sendEmail(emailOptions);

    expect(mockSendMail).toHaveBeenCalledWith(expectedMailOptions);
  });

  it('should handle multiple recipients', async () => {
    const emailOptions = {
      to: ['recipient1@example.com', 'recipient2@example.com'],
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    };

    mockSendMail.mockResolvedValue({});

    await sendEmail(emailOptions);

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['recipient1@example.com', 'recipient2@example.com']
      })
    );
  });

  it('should propagate sendMail errors', async () => {
    const emailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    };

    const error = new Error('SMTP connection failed');
    mockSendMail.mockRejectedValue(error);

    await expect(sendEmail(emailOptions)).rejects.toThrow('SMTP connection failed');
  });

  it('should handle empty or minimal options', async () => {
    const emailOptions = {
      to: 'test@example.com',
      subject: '',
      html: ''
    };

    mockSendMail.mockResolvedValue({});

    await sendEmail(emailOptions);

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Test App" <test@example.com>',
      to: 'test@example.com',
      subject: '',
      html: ''
    });
  });

});