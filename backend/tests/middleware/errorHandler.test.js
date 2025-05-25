// backend/tests/middleware/errorHandler.test.js
import { jest } from "@jest/globals";

describe("ErrorHandler Middleware", () => {
  let errorHandler;
  let req, res, next;
  let consoleErrorSpy;
  let originalNodeEnv;

  beforeAll(async () => {
    errorHandler = (await import("../../middleware/errorHandler.js")).default;
    originalNodeEnv = process.env.NODE_ENV;
  });

  beforeEach(() => {
    req = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
    // Reset NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("error logging", () => {
    it("should log error stack to console", () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1";

      errorHandler(error, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
    });

    it("should log error even without stack trace", () => {
      const error = new Error("Test error");
      delete error.stack;

      errorHandler(error, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(undefined);
    });

    it("should log custom error objects", () => {
      const customError = {
        message: "Custom error",
        statusCode: 400,
        stack: "Custom stack trace",
      };

      errorHandler(customError, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Custom stack trace");
    });

    it("should handle errors without stack property", () => {
      const simpleError = {
        message: "Simple error",
        statusCode: 500,
      };

      errorHandler(simpleError, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe("status code handling", () => {
    it("should use custom statusCode when provided", () => {
      const error = new Error("Bad request");
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should default to 500 when no statusCode provided", () => {
      const error = new Error("Internal error");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle zero statusCode", () => {
      const error = new Error("Test error");
      error.statusCode = 0;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500); // Should default to 500
    });

    it("should handle null statusCode", () => {
      const error = new Error("Test error");
      error.statusCode = null;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle various HTTP status codes", () => {
      const statusCodes = [400, 401, 403, 404, 422, 500, 503];

      statusCodes.forEach((code) => {
        jest.clearAllMocks();
        const error = new Error(`Error ${code}`);
        error.statusCode = code;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(code);
      });
    });
  });

  describe("error message handling", () => {
    it("should use custom error message when provided", () => {
      const error = new Error("Custom error message");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "Custom error message",
        stack: error.stack,
      });
    });

    it("should use default message when no message provided", () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "A server error occurred",
        stack: undefined,
      });
    });

    it("should handle empty string message", () => {
      const error = new Error("");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "A server error occurred", // Should use default
        stack: error.stack,
      });
    });

    it("should handle null message", () => {
      const error = { message: null };

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "A server error occurred",
        stack: undefined,
      });
    });

    it("should preserve original error message", () => {
      const originalMessage = "Database connection failed";
      const error = new Error(originalMessage);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: originalMessage,
        stack: error.stack,
      });
    });
  });

  describe("stack trace visibility", () => {
    it("should include stack trace in development environment", () => {
      process.env.NODE_ENV = "development";
      const error = new Error("Development error");
      error.stack = "Error stack trace";

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "Development error",
        stack: "Error stack trace",
      });
    });

    it("should include stack trace in test environment", () => {
      process.env.NODE_ENV = "test";
      const error = new Error("Test error");
      error.stack = "Test stack trace";

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "Test error",
        stack: "Test stack trace",
      });
    });

    it("should hide stack trace in production environment", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Production error");
      error.stack = "Production stack trace";

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "Production error",
        stack: undefined,
      });
    });

    it("should include stack trace when NODE_ENV is not set", () => {
      delete process.env.NODE_ENV;
      const error = new Error("No env error");
      error.stack = "No env stack trace";

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "No env error",
        stack: "No env stack trace",
      });
    });

    it("should handle various non-production environments", () => {
      const environments = ["dev", "staging", "local", "testing"];

      environments.forEach((env) => {
        process.env.NODE_ENV = env;
        const error = new Error(`${env} error`);
        error.stack = `${env} stack trace`;

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          error: `${env} error`,
          stack: `${env} stack trace`,
        });
      });
    });
  });

  describe("different error types", () => {
    it("should handle standard Error objects", () => {
      const error = new Error("Standard error");
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Standard error",
        stack: error.stack,
      });
    });

    it("should handle TypeError objects", () => {
      const error = new TypeError("Type error occurred");
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Type error occurred",
        stack: error.stack,
      });
    });

    it("should handle ReferenceError objects", () => {
      const error = new ReferenceError("Reference error occurred");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Reference error occurred",
        stack: error.stack,
      });
    });

    it("should handle custom error classes", () => {
      class CustomError extends Error {
        constructor(message, statusCode) {
          super(message);
          this.name = "CustomError";
          this.statusCode = statusCode;
        }
      }

      const error = new CustomError("Custom error message", 422);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: "Custom error message",
        stack: error.stack,
      });
    });

    it("should handle plain objects as errors", () => {
      const error = {
        message: "Plain object error",
        statusCode: 403,
        stack: "Plain object stack",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Plain object error",
        stack: "Plain object stack",
      });
    });

    it("should handle string errors", () => {
      const error = "String error message";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "A server error occurred", // No message property
        stack: undefined,
      });
    });
  });

  describe("response format", () => {
    it("should always return JSON response", () => {
      const error = new Error("JSON test");

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should not call next() function", () => {
      const error = new Error("Next test");

      errorHandler(error, req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it("should include only error and stack properties", () => {
      const error = new Error("Format test");
      error.customProp = "should not appear";

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "Format test",
        stack: error.stack,
      });
    });
  });

  describe("real-world error scenarios", () => {
    it("should handle database connection errors", () => {
      const dbError = new Error("Database connection failed");
      dbError.statusCode = 500;
      dbError.code = "ECONNREFUSED";

      errorHandler(dbError, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(dbError.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database connection failed",
        stack: dbError.stack,
      });
    });

    it("should handle validation errors", () => {
      const validationError = new Error("Validation failed");
      validationError.statusCode = 400;
      validationError.details = ["Field is required"];

      errorHandler(validationError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        stack: validationError.stack,
      });
    });

    it("should handle authentication errors", () => {
      const authError = new Error("Invalid credentials");
      authError.statusCode = 401;

      errorHandler(authError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid credentials",
        stack: authError.stack,
      });
    });

    it("should handle file system errors", () => {
      const fsError = new Error("ENOENT: no such file or directory");
      fsError.statusCode = 404;
      fsError.code = "ENOENT";

      errorHandler(fsError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "ENOENT: no such file or directory",
        stack: fsError.stack,
      });
    });

    it("should handle API timeout errors", () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.statusCode = 408;
      timeoutError.timeout = 5000;

      errorHandler(timeoutError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(408);
      expect(res.json).toHaveBeenCalledWith({
        error: "Request timeout",
        stack: timeoutError.stack,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty object error", () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "A server error occurred",
        stack: undefined,
      });
    });

    it("should handle circular reference in error", () => {
      const error = new Error("Circular reference error");
      error.circular = error; // Create circular reference

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Circular reference error",
        stack: error.stack,
      });
    });

    it("should handle very long error messages", () => {
      const longMessage = "A".repeat(10000);
      const error = new Error(longMessage);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: longMessage,
        stack: error.stack,
      });
    });

    it("should handle error with numeric statusCode as string", () => {
      const error = new Error("String status code");
      error.statusCode = "404";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith("404"); // Should pass through as-is
    });
  });
});
