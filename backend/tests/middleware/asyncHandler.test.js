// backend/tests/middleware/asyncHandler.test.js
import { jest } from '@jest/globals';

describe('AsyncHandler Middleware', () => {
  let asyncHandler;
  let req, res, next;

  beforeAll(async () => {
    const module = await import('../../middleware/asyncHandler.js');
    asyncHandler = module.asyncHandler;
  });

  beforeEach(() => {
    req = {
      params: { id: '1' },
      body: { name: 'test' },
      query: { page: '1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful async operations', () => {
    it('should call the wrapped function with correct parameters', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);
    });

    it('should not call next() when async function succeeds', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it('should work with async/await functions', async () => {
      const mockAsyncFn = jest.fn(async (req, res) => {
        res.json({ message: 'success' });
        return 'completed';
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ message: 'success' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with Promise-based functions', async () => {
      const mockAsyncFn = jest.fn((req, res) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            res.json({ data: 'test' });
            resolve('done');
          }, 0);
        });
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ data: 'test' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should preserve return value from async function', async () => {
      const expectedReturn = { id: 1, name: 'test' };
      const mockAsyncFn = jest.fn().mockResolvedValue(expectedReturn);
      const wrappedFn = asyncHandler(mockAsyncFn);

      const result = await wrappedFn(req, res, next);

      expect(result).toEqual(expectedReturn);
    });

    it('should work with functions that return undefined', async () => {
      const mockAsyncFn = jest.fn(async (req, res) => {
        res.send('OK');
        // No explicit return (returns undefined)
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      const result = await wrappedFn(req, res, next);

      expect(result).toBeUndefined();
      expect(res.send).toHaveBeenCalledWith('OK');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch async errors and call next()', async () => {
      const error = new Error('Async operation failed');
      const mockAsyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should catch errors thrown in async/await functions', async () => {
      const error = new Error('Database connection failed');
      const mockAsyncFn = jest.fn(async () => {
        throw error;
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should catch Promise rejection errors', async () => {
      const error = new Error('Promise rejected');
      const mockAsyncFn = jest.fn(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(error), 0);
        });
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle custom error objects', async () => {
      const customError = {
        message: 'Custom error',
        statusCode: 400,
        details: 'Validation failed'
      };
      const mockAsyncFn = jest.fn().mockRejectedValue(customError);
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(customError);
    });

    it('should handle string errors', async () => {
      const stringError = 'Something went wrong';
      const mockAsyncFn = jest.fn().mockRejectedValue(stringError);
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(stringError);
    });

    it('should handle null/undefined errors', async () => {
      const mockAsyncFn = jest.fn().mockRejectedValue(null);
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(null);
    });


  });

  describe('function signature preservation', () => {
    it('should return a function', () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('test');
      const wrappedFn = asyncHandler(mockAsyncFn);

      expect(typeof wrappedFn).toBe('function');
    });

    it('should accept and pass through all parameters', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('test');
      const wrappedFn = asyncHandler(mockAsyncFn);

      const customReq = { custom: 'request' };
      const customRes = { custom: 'response' };
      const customNext = jest.fn();

      await wrappedFn(customReq, customRes, customNext);

      expect(mockAsyncFn).toHaveBeenCalledWith(customReq, customRes, customNext);
    });

  });

  describe('real-world scenarios', () => {
    it('should work with database operations', async () => {
      const mockDbResult = { id: 1, name: 'John Doe' };
      const mockAsyncFn = jest.fn(async (req, res) => {
        // Simulate database call
        const user = await Promise.resolve(mockDbResult);
        res.json(user);
        return user;
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockDbResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection timeout');
      dbError.statusCode = 500;
      const mockAsyncFn = jest.fn(async () => {
        // Simulate database error
        throw dbError;
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });

    it('should work with API calls', async () => {
      const apiResponse = { data: 'external api data' };
      const mockAsyncFn = jest.fn(async (req, res) => {
        // Simulate external API call
        const response = await Promise.resolve(apiResponse);
        res.json(response);
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(res.json).toHaveBeenCalledWith(apiResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle file operations', async () => {
      const mockAsyncFn = jest.fn(async (req, res) => {
        // Simulate file read operation
        await new Promise(resolve => setTimeout(resolve, 0));
        res.json({ file: 'content' });
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      await wrappedFn(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ file: 'content' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with validation functions', async () => {
      const validationError = new Error('Validation failed');
      validationError.statusCode = 400;
      const mockAsyncFn = jest.fn(async (req) => {
        if (!req.body.email) {
          throw validationError;
        }
        return { valid: true };
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      req.body = {}; // No email

      await wrappedFn(req, res, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });
  });

  describe('performance and memory', () => {
    it('should not create memory leaks with many calls', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('test');
      const wrappedFn = asyncHandler(mockAsyncFn);

      // Call multiple times
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(wrappedFn(req, res, next));
      }

      await Promise.all(promises);

      expect(mockAsyncFn).toHaveBeenCalledTimes(100);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle concurrent requests', async () => {
      let callCount = 0;
      const mockAsyncFn = jest.fn(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return `call-${callCount}`;
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      const promises = [
        wrappedFn(req, res, next),
        wrappedFn(req, res, next),
        wrappedFn(req, res, next)
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAsyncFn).toHaveBeenCalledTimes(3);
      expect(next).not.toHaveBeenCalled();
    });
  });
});