import { jest } from '@jest/globals';

// Mock models using unstable_mockModule
jest.unstable_mockModule('../../models/User.js', () => ({
  findById: jest.fn(),
  updateProfile: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule('../../services/BaseService.js', () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  }
}));

describe('UserService', () => {
  let UserService;
  let UserModel;
  let userService;

  beforeAll(async () => {
    UserModel = await import('../../models/User.js');
    const { UserService: UserServiceClass } = await import('../../services/UserService.js');
    UserService = UserServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const userId = 1;
      const mockUser = { 
        id: userId, 
        name: 'John Doe', 
        email: 'john@example.com',
        profile_image: 'avatar.jpg',
        phone: '+1234567890',
        bio: 'Test bio',
        location: 'New York',
        created_at: '2024-01-01T00:00:00Z'
      };

      UserModel.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserProfile(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = 999;

      UserModel.findById.mockResolvedValue(null);

      const result = await userService.getUserProfile(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const userId = 1;

      UserModel.findById.mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.getUserProfile(userId))
        .rejects.toThrow('Database connection failed');
    });

    it('should return user with minimal profile data', async () => {
      const userId = 1;
      const mockUser = { 
        id: userId, 
        name: 'Jane Doe', 
        email: 'jane@example.com',
        profile_image: null,
        phone: null,
        bio: null,
        location: null
      };

      UserModel.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserProfile(userId);

      expect(result.profile_image).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.bio).toBeNull();
      expect(result.location).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 1;
      const updateData = { 
        name: 'John Updated',
        bio: 'Updated bio',
        location: 'Los Angeles',
        phone: '+1987654321'
      };
      const updatedUser = { 
        id: userId, 
        name: 'John Updated', 
        email: 'john@example.com',
        bio: 'Updated bio',
        location: 'Los Angeles',
        phone: '+1987654321',
        updated_at: '2024-05-26T12:00:00Z'
      };

      UserModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(UserModel.updateProfile).toHaveBeenCalledWith(userId, updateData, undefined);
      expect(result).toEqual(updatedUser);
    });

    it('should handle partial profile updates', async () => {
      const userId = 1;
      const updateData = { name: 'John Partial' };
      const updatedUser = { 
        id: userId, 
        name: 'John Partial', 
        email: 'john@example.com',
        bio: 'Existing bio',
        location: 'Existing location'
      };

      UserModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(UserModel.updateProfile).toHaveBeenCalledWith(userId, updateData, undefined);
      expect(result.name).toBe('John Partial');
      expect(result.bio).toBe('Existing bio');
    });

    it('should handle transaction client parameter', async () => {
      const userId = 1;
      const updateData = { name: 'John Transaction' };
      const updatedUser = { 
        id: userId, 
        name: 'John Transaction', 
        email: 'john@example.com'
      };
      const mockClient = { query: jest.fn() };

      UserModel.updateProfile.mockResolvedValue(updatedUser);

      userService.executeInTransaction = jest.fn(async (callback) => {
        return callback(mockClient);
      });

      const result = await userService.updateUserProfile(userId, updateData);

      expect(UserModel.updateProfile).toHaveBeenCalledWith(userId, updateData, mockClient);
      expect(result).toEqual(updatedUser);
    });

    it('should return null when user not found for update', async () => {
      const userId = 999;
      const updateData = { name: 'Non-existent User' };

      UserModel.updateProfile.mockResolvedValue(null);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(UserModel.updateProfile).toHaveBeenCalledWith(userId, updateData, undefined);
      expect(result).toBeNull();
    });

    it('should handle empty update data', async () => {
      const userId = 1;
      const updateData = {};
      const existingUser = { 
        id: userId, 
        name: 'John Doe', 
        email: 'john@example.com'
      };

      UserModel.updateProfile.mockResolvedValue(existingUser);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(UserModel.updateProfile).toHaveBeenCalledWith(userId, updateData, undefined);
      expect(result).toEqual(existingUser);
    });

    it('should handle profile image updates', async () => {
      const userId = 1;
      const updateData = { 
        name: 'John Doe',
        profile_image: 'new_avatar.jpg'
      };
      const updatedUser = { 
        id: userId, 
        name: 'John Doe', 
        email: 'john@example.com',
        profile_image: 'uploads/profiles/new_avatar.jpg'
      };

      UserModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(result.profile_image).toBe('uploads/profiles/new_avatar.jpg');
    });

    it('should handle database errors during update', async () => {
      const userId = 1;
      const updateData = { name: 'John Error' };

      UserModel.updateProfile.mockRejectedValue(new Error('Database update failed'));

      await expect(userService.updateUserProfile(userId, updateData))
        .rejects.toThrow('Database update failed');
    });

    it('should handle null values in update data', async () => {
      const userId = 1;
      const updateData = { 
        name: 'John Clean',
        bio: null,
        location: null,
        phone: null
      };
      const updatedUser = { 
        id: userId, 
        name: 'John Clean', 
        email: 'john@example.com',
        bio: null,
        location: null,
        phone: null
      };

      UserModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(result.bio).toBeNull();
      expect(result.location).toBeNull();
      expect(result.phone).toBeNull();
    });

    it('should use transaction when updating profile', async () => {
      const userId = 1;
      const updateData = { name: 'John Transaction' };
      const updatedUser = { 
        id: userId, 
        name: 'John Transaction', 
        email: 'john@example.com'
      };

      UserModel.updateProfile.mockResolvedValue(updatedUser);

      // Mock executeInTransaction to verify it's called
      const executeInTransactionSpy = jest.spyOn(userService, 'executeInTransaction');
      executeInTransactionSpy.mockImplementation(async (callback) => {
        return callback();
      });

      const result = await userService.updateUserProfile(userId, updateData);

      expect(executeInTransactionSpy).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);

      executeInTransactionSpy.mockRestore();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle invalid user ID types', async () => {
      const invalidUserId = 'invalid';

      UserModel.findById.mockRejectedValue(new Error('Invalid user ID format'));

      await expect(userService.getUserProfile(invalidUserId))
        .rejects.toThrow('Invalid user ID format');
    });

    it('should handle transaction errors', async () => {
      const userId = 1;
      const updateData = { name: 'John Rollback' };

      userService.executeInTransaction = jest.fn(async (callback) => {
        throw new Error('Transaction failed');
      });

      await expect(userService.updateUserProfile(userId, updateData))
        .rejects.toThrow('Transaction failed');
    });

    it('should handle network timeout scenarios', async () => {
      const userId = 1;

      UserModel.findById.mockRejectedValue(new Error('Network timeout'));

      await expect(userService.getUserProfile(userId))
        .rejects.toThrow('Network timeout');
    });

    it('should handle concurrent update scenarios', async () => {
      const userId = 1;
      const updateData = { name: 'John Concurrent' };
      const updatedUser = { 
        id: userId, 
        name: 'John Concurrent', 
        email: 'john@example.com'
      };

      UserModel.updateProfile.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updateData);

      expect(result).toEqual(updatedUser);
    });
  });
});