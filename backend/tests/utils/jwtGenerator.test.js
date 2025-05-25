// backend/tests/utils/jwtGenerator.test.js
import { jest } from '@jest/globals';

// Mock jsonwebtoken
const mockSign = jest.fn();
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: mockSign }
}));

// Mock config
const mockConfig = {
  jwt: {
    secret: 'test-secret',
    expiresIn: '1h'
  }
};
jest.unstable_mockModule('../../config/config.js', () => ({
  default: mockConfig
}));

describe('jwtGenerator', () => {
  let jwtGenerator;

  beforeAll(async () => {
    jwtGenerator = (await import('../../utils/jwtGenerator.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate JWT with correct payload and options', () => {
    const userId = 123;
    const expectedToken = 'mock-jwt-token';
    const expectedPayload = {
      user: {
        id: userId
      }
    };

    mockSign.mockReturnValue(expectedToken);

    const result = jwtGenerator(userId);

    expect(mockSign).toHaveBeenCalledWith(
      expectedPayload,
      mockConfig.jwt.secret,
      { expiresIn: mockConfig.jwt.expiresIn }
    );
    expect(result).toBe(expectedToken);
  });

  it('should handle different user IDs', () => {
    const userIds = [1, 999, 'user-uuid'];
    const expectedToken = 'mock-jwt-token';

    mockSign.mockReturnValue(expectedToken);

    userIds.forEach(userId => {
      const result = jwtGenerator(userId);
      
      expect(mockSign).toHaveBeenCalledWith(
        { user: { id: userId } },
        mockConfig.jwt.secret,
        { expiresIn: mockConfig.jwt.expiresIn }
      );
      expect(result).toBe(expectedToken);
    });
  });

  it('should use config values for secret and expiration', () => {
    const userId = 456;
    mockSign.mockReturnValue('token');

    jwtGenerator(userId);

    expect(mockSign).toHaveBeenCalledWith(
      expect.any(Object),
      'test-secret',
      { expiresIn: '1h' }
    );
  });
});