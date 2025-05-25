// tests/services/AdminService.test.js
import { jest } from "@jest/globals";

// Mock models and database using unstable_mockModule
jest.unstable_mockModule("../../config/db.js", () => ({
  query: jest.fn(),
}));

jest.unstable_mockModule("../../models/User.js", () => ({
  addCredits: jest.fn(),
}));

jest.unstable_mockModule("../../models/Ticket.js", () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.unstable_mockModule("../../models/Event.js", () => ({
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.unstable_mockModule("../../services/EventService.js", () => ({
  EventService: jest.fn(),
}));

describe("AdminService", () => {
  let AdminService;
  let db;
  let UserModel;
  let TicketModel;
  let EventModel;
  let adminService;

  beforeAll(async () => {
    db = await import("../../config/db.js");
    UserModel = await import("../../models/User.js");
    TicketModel = await import("../../models/Ticket.js");
    EventModel = await import("../../models/Event.js");
    const { AdminService: AdminServiceClass } = await import(
      "../../services/AdminService.js"
    );
    AdminService = AdminServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    adminService = new AdminService();
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { id: 1, name: "User 1", email: "user1@test.com", role: "user" },
        { id: 2, name: "User 2", email: "user2@test.com", role: "admin" },
      ];

      db.query.mockResolvedValue({ rows: mockUsers });

      const result = await adminService.getAllUsers();

      expect(db.query).toHaveBeenCalledWith({
        text: "SELECT id, name, email, role, profile_image, created_at FROM users ORDER BY created_at DESC",
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe("updateUserRole", () => {
    it("should update user role successfully", async () => {
      const userId = 1;
      const newRole = "admin";
      const updatedUser = {
        id: userId,
        name: "User",
        email: "user@test.com",
        role: newRole,
      };

      db.query.mockResolvedValue({ rows: [updatedUser] });

      const result = await adminService.updateUserRole(userId, newRole);

      expect(db.query).toHaveBeenCalledWith({
        text: "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
        values: [newRole, userId],
      });
      expect(result).toEqual(updatedUser);
    });

    it("should throw error for invalid role", async () => {
      await expect(adminService.updateUserRole(1, "invalid")).rejects.toThrow(
        'Role must be "user" or "admin"'
      );
    });

    it("should throw error if user not found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(adminService.updateUserRole(999, "admin")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("getDashboardStats", () => {
    it("should return dashboard statistics", async () => {
      db.query.mockImplementation((query) => {
        if (query.text.includes("COUNT(*) FROM users"))
          return { rows: [{ count: "100" }] };
        if (query.text.includes("COUNT(*) FROM events"))
          return { rows: [{ count: "50" }] };
        if (
          query.text.includes(
            "COUNT(*) FROM tickets WHERE status = 'purchased'"
          )
        )
          return { rows: [{ count: "500" }] };
        if (query.text.includes("COUNT(*) FROM categories"))
          return { rows: [{ count: "10" }] };
        if (
          query.text.includes("COUNT(*) FROM tickets") &&
          query.text.includes("status = 'cancelled'") &&
          query.text.includes("refund_status = 'requested'")
        )
          return { rows: [{ count: "5" }] };
      });

      const result = await adminService.getDashboardStats();

      expect(result).toEqual({
        users: 100,
        events: 50,
        tickets: 500,
        categories: 10,
        pendingRefunds: 5,
      });
    });
  });

  describe("approveRefund", () => {
    it("should approve refund successfully", async () => {
      const ticketId = 1;
      const status = "completed";
      const mockTicket = {
        id: ticketId,
        event_name: "Test Event",
        price: "50.00",
        user_id: 1,
        purchase_id: 1,
      };

      // Mock transaction
      adminService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({ rows: [mockTicket] }) // Get ticket
            .mockResolvedValueOnce({}) // Update refund status
            .mockResolvedValueOnce({}) // Update ticket status
            .mockResolvedValueOnce({
              rows: [{ id: 1, payment_method: "card" }],
            }) // Get payment
            .mockResolvedValueOnce({ rows: [] }) // Get payment method
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Create refund
            .mockResolvedValueOnce({ rows: [mockTicket] }), // Get updated ticket
        };

        UserModel.addCredits.mockResolvedValue();

        return callback(mockClient);
      });

      const result = await adminService.approveRefund(ticketId, status);

      expect(result.message).toBe("Refund status updated to completed");
      expect(result.data).toBeDefined();
    });

    it("should throw error for invalid status", async () => {
      await expect(adminService.approveRefund(1, "invalid")).rejects.toThrow(
        "Invalid status"
      );
    });
  });

  describe("createEvent", () => {
    it("should create event successfully", async () => {
      const eventData = {
        name: "Test Event",
        slug: "test-event",
        description: "Test Description",
        date: "2024-12-25",
        venue: "Test Venue",
        address: "123 Test St",
        city: "Test City",
        category_id: 1,
      };

      const createdEvent = { id: 1, ...eventData };
      db.query.mockResolvedValue({ rows: [createdEvent] });

      const result = await adminService.createEvent(eventData);

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(createdEvent);
    });

    it("should throw error for missing required fields", async () => {
      const invalidEventData = { name: "Test Event" };

      await expect(adminService.createEvent(invalidEventData)).rejects.toThrow(
        "Missing required fields"
      );
    });
  });
});
