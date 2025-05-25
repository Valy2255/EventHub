// backend/tests/middleware/auth.test.js
import { jest } from '@jest/globals';

// Mock passport
const mockAuthenticate = jest.fn();
jest.unstable_mockModule('passport', () => ({
  default: {
    authenticate: mockAuthenticate
  }
}));

describe('Auth Middleware', () => {
  let authMiddleware;
  let req, res, next;

  beforeAll(async () => {
    authMiddleware = (await import('../../middleware/auth.js')).default;
  });

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful authentication', () => {
    it('should authenticate valid user and call next()', () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        role: 'user'
      };

      // Mock passport.authenticate to call callback with user
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, mockUser, null);
        };
      });

      authMiddleware(req, res, next);

      expect(mockAuthenticate).toHaveBeenCalledWith(
        'jwt',
        { session: false },
        expect.any(Function)
      );
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should set req.user with complete user object', () => {
      const mockUser = {
        id: 123,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        credits: 100
      };

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, mockUser, null);
        };
      });

      authMiddleware(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.user.id).toBe(123);
      expect(req.user.email).toBe('admin@example.com');
      expect(req.user.role).toBe('admin');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should work with minimal user object', () => {
      const mockUser = {
        id: 1
      };

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, mockUser, null);
        };
      });

      authMiddleware(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('authentication failures', () => {
    it('should return 401 when no user is returned', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, null, { message: 'No token provided' });
        };
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Missing or invalid token.'
      });
      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is false', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, false, { message: 'Invalid token' });
        };
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Missing or invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is undefined', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, undefined, { message: 'Token expired' });
        };
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Missing or invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed tokens', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, null, { message: 'Malformed token' });
        };
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Missing or invalid token.'
      });
    });

    it('should handle expired tokens', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, null, { message: 'Token expired' });
        };
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Missing or invalid token.'
      });
    });
  });

  describe('passport errors', () => {
    it('should call next() with error when passport returns error', () => {
      const passportError = new Error('Passport configuration error');

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(passportError, null, null);
        };
      });

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(passportError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', () => {
      const dbError = new Error('Database connection failed');
      dbError.statusCode = 500;

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(dbError, null, null);
        };
      });

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });

    it('should handle JWT verification errors', () => {
      const jwtError = new Error('JWT verification failed');
      jwtError.name = 'JsonWebTokenError';

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(jwtError, null, null);
        };
      });

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(jwtError);
    });

    it('should handle custom error objects', () => {
      const customError = {
        message: 'Custom authentication error',
        statusCode: 403,
        type: 'CUSTOM_AUTH_ERROR'
      };

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(customError, null, null);
        };
      });

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(customError);
    });
  });

  describe('passport configuration', () => {
    it('should call passport.authenticate with correct strategy', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, { id: 1 }, null);
        };
      });

      authMiddleware(req, res, next);

      expect(mockAuthenticate).toHaveBeenCalledWith(
        'jwt',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should disable sessions', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, { id: 1 }, null);
        };
      });

      authMiddleware(req, res, next);

      expect(mockAuthenticate).toHaveBeenCalledWith(
        'jwt',
        { session: false },
        expect.any(Function)
      );
    });

    it('should provide callback function', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        expect(typeof callback).toBe('function');
        return (req, res, next) => {
          callback(null, { id: 1 }, null);
        };
      });

      authMiddleware(req, res, next);

      expect(mockAuthenticate).toHaveBeenCalled();
    });
  });

  describe('middleware execution flow', () => {
    it('should execute passport authenticate with req, res, next', () => {
      const mockPassportMiddleware = jest.fn();
      
      mockAuthenticate.mockImplementation(() => mockPassportMiddleware);

      authMiddleware(req, res, next);

      expect(mockPassportMiddleware).toHaveBeenCalledWith(req, res, next);
    });

    it('should not modify req object before authentication', () => {
      const originalReq = { ...req };

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          // Should not have user set yet
          expect(req.user).toBeNull();
          callback(null, { id: 1 }, null);
        };
      });

      authMiddleware(req, res, next);

      // Original req should have been preserved until authentication
      expect(originalReq.user).toBeNull();
    });

    it('should handle multiple authentication attempts', () => {
      const user1 = { id: 1, email: 'user1@example.com' };
      const user2 = { id: 2, email: 'user2@example.com' };

      // First authentication
      mockAuthenticate.mockImplementationOnce((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, user1, null);
        };
      });

      authMiddleware(req, res, next);
      expect(req.user).toEqual(user1);

      // Reset and second authentication
      jest.clearAllMocks();
      req.user = null;

      mockAuthenticate.mockImplementationOnce((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, user2, null);
        };
      });

      authMiddleware(req, res, next);
      expect(req.user).toEqual(user2);
    });
  });

  describe('error response format', () => {
    it('should return correct error message format', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, null, { message: 'No token' });
        };
      });

      authMiddleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Missing or invalid token.'
      });
    });

    it('should return 401 status code for auth failures', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, false, null);
        };
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

  });

  describe('edge cases', () => {
    it('should handle callback with all null parameters', () => {
      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, null, null);
        };
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Missing or invalid token.'
      });
    });

    it('should handle empty user object', () => {
      const emptyUser = {};

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, emptyUser, null);
        };
      });

      authMiddleware(req, res, next);

      expect(req.user).toEqual(emptyUser);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle user with falsy properties', () => {
      const userWithFalsyProps = {
        id: 0,
        email: '',
        role: null
      };

      mockAuthenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, userWithFalsyProps, null);
        };
      });

      authMiddleware(req, res, next);

      expect(req.user).toEqual(userWithFalsyProps);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});