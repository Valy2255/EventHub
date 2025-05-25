// tests/controllers/userController.test.js

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
  return res;
};

// Mock the UserService
const mockUserService = {
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn()
};

jest.unstable_mockModule('../../services/UserService.js', () => ({
  UserService: jest.fn().mockImplementation(() => mockUserService)
}));

const { getUserProfile, updateUserProfile } = await import('../../controllers/userController.js');

describe('UserController', () => {
  let req, res;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    
    Object.values(mockUserService).forEach(mock => mock.mockReset());
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        profile_image: 'avatar.jpg',
        role: 'user',
        created_at: '2024-01-01T10:00:00Z'
      };
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      await getUserProfile(req, res);

      expect(mockUserService.getUserProfile).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should handle user not found', async () => {
      mockUserService.getUserProfile.mockResolvedValue(null);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockUserService.getUserProfile.mockRejectedValue(error);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get user profile',
        error: 'Database connection failed'
      });
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com',
        profileImage: 'new-avatar.jpg'
      };
      const mockUpdatedUser = {
        user: {
          id: 1,
          name: 'Updated User',
          email: 'updated@example.com',
          profile_image: 'new-avatar.jpg'
        },
        token: 'new-jwt-token'
      };
      
      req.body = updateData;
      mockUserService.updateUserProfile.mockResolvedValue(mockUpdatedUser);

      await updateUserProfile(req, res);

      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith(1, {
        name: 'Updated User',
        email: 'updated@example.com',
        profile_image: 'new-avatar.jpg'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        ...mockUpdatedUser
      });
    });

    it('should handle partial profile update', async () => {
      const updateData = { name: 'New Name Only' };
      const mockUpdatedUser = {
        user: {
          id: 1,
          name: 'New Name Only',
          email: 'test@example.com',
          profile_image: 'avatar.jpg'
        },
        token: 'updated-jwt-token'
      };
      
      req.body = updateData;
      mockUserService.updateUserProfile.mockResolvedValue(mockUpdatedUser);

      await updateUserProfile(req, res);

      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith(1, {
        name: 'New Name Only',
        email: undefined,
        profile_image: undefined
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        ...mockUpdatedUser
      });
    });

    it('should handle service error during update', async () => {
      const error = new Error('Email already exists');
      req.body = { name: 'Test User', email: 'existing@example.com' };
      mockUserService.updateUserProfile.mockRejectedValue(error);

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update profile',
        error: 'Email already exists'
      });
    });

    it('should handle empty update data', async () => {
      const mockUpdatedUser = {
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          profile_image: 'avatar.jpg'
        },
        token: 'jwt-token'
      };
      
      req.body = {};
      mockUserService.updateUserProfile.mockResolvedValue(mockUpdatedUser);

      await updateUserProfile(req, res);

      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith(1, {
        name: undefined,
        email: undefined,
        profile_image: undefined
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        ...mockUpdatedUser
      });
    });
  });
});