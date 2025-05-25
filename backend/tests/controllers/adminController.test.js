// tests/controllers/adminController.test.js

import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'admin@example.com', name: 'Admin User', role: 'admin' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the AdminService
const mockAdminService = {
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUserRole: jest.fn(),
  deleteUser: jest.fn(),
  getDashboardStats: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn()
};

jest.unstable_mockModule('../../services/AdminService.js', () => ({
  AdminService: jest.fn().mockImplementation(() => mockAdminService)
}));

const { 
  getAllUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser, 
  getDashboardStats,
  createEvent,
  updateEvent,
  deleteEvent
} = await import('../../controllers/adminController.js');

describe('AdminController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockAdminService).forEach(mock => mock.mockReset());
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@example.com', role: 'user' },
        { id: 2, name: 'User 2', email: 'user2@example.com', role: 'admin' }
      ];
      mockAdminService.getAllUsers.mockResolvedValue(mockUsers);

      await getAllUsers(req, res, next);

      expect(mockAdminService.getAllUsers).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ users: mockUsers });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      mockAdminService.getAllUsers.mockRejectedValue(error);

      await getAllUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' };
      req.params = { id: '1' };
      mockAdminService.getUserById.mockResolvedValue(mockUser);

      await getUserById(req, res, next);

      expect(mockAdminService.getUserById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should handle user not found', async () => {
      const error = new Error('User not found');
      req.params = { id: '999' };
      mockAdminService.getUserById.mockRejectedValue(error);

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'admin' };
      req.params = { id: '1' };
      req.body = { role: 'admin' };
      mockAdminService.updateUserRole.mockResolvedValue(mockUser);

      await updateUserRole(req, res, next);

      expect(mockAdminService.updateUserRole).toHaveBeenCalledWith('1', 'admin');
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should handle invalid role', async () => {
      const error = new Error('Role must be "user" or "admin"');
      req.params = { id: '1' };
      req.body = { role: 'invalid' };
      mockAdminService.updateUserRole.mockRejectedValue(error);

      await updateUserRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    it('should handle user not found', async () => {
      const error = new Error('User not found');
      req.params = { id: '999' };
      req.body = { role: 'admin' };
      mockAdminService.updateUserRole.mockRejectedValue(error);

      await updateUserRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockResult = { message: 'User deleted successfully' };
      req.params = { id: '2' };
      req.user = { id: 1 };
      mockAdminService.deleteUser.mockResolvedValue(mockResult);

      await deleteUser(req, res, next);

      expect(mockAdminService.deleteUser).toHaveBeenCalledWith('2', 1);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle attempt to delete own account', async () => {
      const error = new Error('You cannot delete your own account');
      req.params = { id: '1' };
      req.user = { id: 1 };
      mockAdminService.deleteUser.mockRejectedValue(error);

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('getDashboardStats', () => {
    it('should get dashboard stats successfully', async () => {
      const mockStats = {
        totalUsers: 150,
        totalEvents: 25,
        totalTicketsSold: 1200,
        totalRevenue: 45000
      };
      mockAdminService.getDashboardStats.mockResolvedValue(mockStats);

      await getDashboardStats(req, res, next);

      expect(mockAdminService.getDashboardStats).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ stats: mockStats });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      mockAdminService.getDashboardStats.mockRejectedValue(error);

      await getDashboardStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const eventData = {
        title: 'New Event',
        description: 'Event description',
        date: '2024-12-31',
        time: '20:00:00'
      };
      const mockEvent = { id: 1, ...eventData };
      req.body = eventData;
      mockAdminService.createEvent.mockResolvedValue(mockEvent);

      await createEvent(req, res, next);

      expect(mockAdminService.createEvent).toHaveBeenCalledWith(eventData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEvent
      });
    });

    it('should handle missing required fields', async () => {
      const error = new Error('Missing required fields: title, date');
      req.body = { description: 'Event description' };
      mockAdminService.createEvent.mockRejectedValue(error);

      await createEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const eventData = { title: 'Updated Event', description: 'Updated description' };
      const mockEvent = { id: 1, ...eventData };
      req.params = { id: '1' };
      req.body = eventData;
      mockAdminService.updateEvent.mockResolvedValue(mockEvent);

      await updateEvent(req, res, next);

      expect(mockAdminService.updateEvent).toHaveBeenCalledWith('1', eventData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEvent
      });
    });

    it('should handle event not found', async () => {
      const error = new Error('Event not found');
      req.params = { id: '999' };
      req.body = { title: 'Updated Event' };
      mockAdminService.updateEvent.mockRejectedValue(error);

      await updateEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: error.message });
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const mockResult = { id: 1, message: 'Event deleted successfully' };
      req.params = { id: '1' };
      mockAdminService.deleteEvent.mockResolvedValue(mockResult);

      await deleteEvent(req, res, next);

      expect(mockAdminService.deleteEvent).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: mockResult.id },
        message: mockResult.message
      });
    });

    it('should handle event not found', async () => {
      const error = new Error('Event not found');
      req.params = { id: '999' };
      mockAdminService.deleteEvent.mockRejectedValue(error);

      await deleteEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: error.message });
    });
  });
});