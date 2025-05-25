// backend/tests/middleware/admin.test.js
import { jest } from '@jest/globals';

describe('Admin Middleware', () => {
  let adminMiddleware;
  let req, res, next;

  beforeAll(async () => {
    adminMiddleware = (await import('../../middleware/admin.js')).default;
  });

  beforeEach(() => {
    req = {
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

  describe('when user is authenticated and has admin role', () => {
    it('should call next() and allow access', () => {
      req.user = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      };

      adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should work with additional user properties', () => {
      req.user = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: '2024-01-01',
        permissions: ['read', 'write', 'delete']
      };

      adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    it('should return 403 error when req.user is null', () => {
      req.user = null;

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 error when req.user is undefined', () => {
      req.user = undefined;

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 error when req.user is missing', () => {
      delete req.user;

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when user is authenticated but not admin', () => {
    it('should return 403 error for regular user role', () => {
      req.user = {
        id: 1,
        email: 'user@example.com',
        role: 'user'
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 error for moderator role', () => {
      req.user = {
        id: 1,
        email: 'mod@example.com',
        role: 'moderator'
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 error when role is null', () => {
      req.user = {
        id: 1,
        email: 'user@example.com',
        role: null
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 error when role is undefined', () => {
      req.user = {
        id: 1,
        email: 'user@example.com',
        role: undefined
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 error when role property is missing', () => {
      req.user = {
        id: 1,
        email: 'user@example.com'
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case sensitive for admin role', () => {
      req.user = {
        id: 1,
        email: 'user@example.com',
        role: 'Admin' // Capital A
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case sensitive for ADMIN role', () => {
      req.user = {
        id: 1,
        email: 'user@example.com',
        role: 'ADMIN' // All caps
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle user object with extra whitespace in role', () => {
      req.user = {
        id: 1,
        email: 'user@example.com',
        role: ' admin ' // With spaces
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty string role', () => {
      req.user = {
        id: 1,
        email: 'user@example.com',
        role: ''
      };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle boolean false for user', () => {
      req.user = false;

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty object user', () => {
      req.user = {};

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work correctly with multiple admin users', () => {
      const adminUsers = [
        { id: 1, email: 'admin1@example.com', role: 'admin' },
        { id: 2, email: 'admin2@example.com', role: 'admin' },
        { id: 3, email: 'admin3@example.com', role: 'admin' }
      ];

      adminUsers.forEach(user => {
        req.user = user;
        jest.clearAllMocks();

        adminMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('response format', () => {
    it('should return correct error message format', () => {
      req.user = { role: 'user' };

      adminMiddleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Administrator permissions required.'
      });
    });

    it('should return 403 status code', () => {
      req.user = { role: 'user' };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    
  });
});