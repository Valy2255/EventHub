// tests/controllers/authController.test.js

import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  getMe: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn()
};

jest.unstable_mockModule('../../services/AuthService.js', () => ({
  AuthService: jest.fn().mockImplementation(() => mockAuthService)
}));

const { register, login, getMe, forgotPassword, resetPassword } = await import('../../controllers/authController.js');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockAuthService).forEach(mock => mock.mockReset());
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const registerData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const mockResponse = { user: { id: 1, name: 'Test User', email: 'test@example.com' }, token: 'jwt-token' };
      
      req.body = registerData;
      mockAuthService.register.mockResolvedValue(mockResponse);

      await register(req, res, next);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle user already exists error', async () => {
      const error = new Error('User with this email already exists');
      req.body = { name: 'Test', email: 'test@example.com', password: 'password' };
      mockAuthService.register.mockRejectedValue(error);

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { user: { id: 1, email: 'test@example.com' }, token: 'jwt-token' };
      
      req.body = loginData;
      mockAuthService.login.mockResolvedValue(mockResponse);

      await login(req, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle invalid credentials', async () => {
      req.body = { email: 'test@example.com', password: 'wrong' };
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });
  });

  describe('getMe', () => {
    it('should return user profile successfully', async () => {
      const user = { id: 1, name: 'Test User', email: 'test@example.com' };
      mockAuthService.getMe.mockResolvedValue(user);

      await getMe(req, res);

      expect(mockAuthService.getMe).toHaveBeenCalledWith(req.user.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user });
    });

    it('should handle user not found', async () => {
      const error = new Error('User not found');
      mockAuthService.getMe.mockRejectedValue(error);

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('forgotPassword', () => {
    it('should handle forgot password successfully', async () => {
      const mockResponse = { message: 'Reset email sent' };
      req.body = { email: 'test@example.com' };
      mockAuthService.forgotPassword.mockResolvedValue(mockResponse);

      await forgotPassword(req, res, next);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle user not found', async () => {
      const error = new Error('No user exists with this email');
      req.body = { email: 'nonexistent@example.com' };
      mockAuthService.forgotPassword.mockRejectedValue(error);

      await forgotPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockResponse = { message: 'Password reset successful' };
      req.params = { token: 'valid-token' };
      req.body = { password: 'newpassword123' };
      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      await resetPassword(req, res);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle invalid token', async () => {
      const error = new Error('Invalid or expired token');
      req.params = { token: 'invalid-token' };
      req.body = { password: 'newpassword123' };
      mockAuthService.resetPassword.mockRejectedValue(error);

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});