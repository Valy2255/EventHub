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
        event_id: 1,
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        refund_status: "completed",
        status: "cancelled",
      };

      // Mock transaction with the exact query sequence from approveRefund
      adminService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            // 1. Get ticket with event and purchase details
            .mockResolvedValueOnce({ rows: [mockTicket] })
            // 2. Update ticket refund status
            .mockResolvedValueOnce({ rows: [] })
            // 3. Update ticket status to 'cancelled' (for completed refunds)
            .mockResolvedValueOnce({ rows: [] })
            // 4. Get payment information (first attempt - direct association)
            .mockResolvedValueOnce({
              rows: [{ id: 1, payment_method: "card", purchase_id: 1 }],
            })
            // 5. Get payment method for card payments
            .mockResolvedValueOnce({ rows: [{ id: 1 }] })
            // 6. Create refund record
            .mockResolvedValueOnce({ rows: [{ id: 1 }] })
            // 7. Update refund status to completed (for card payments)
            .mockResolvedValueOnce({ rows: [] })
            // 8. Get updated ticket data for response
            .mockResolvedValueOnce({ rows: [mockUpdatedTicket] }),
        };

        UserModel.addCredits.mockResolvedValue();

        return callback(mockClient);
      });

      const result = await adminService.approveRefund(ticketId, status);

      expect(result.message).toBe("Refund status updated to completed");
      expect(result.data).toBeDefined();
      expect(result.data).toEqual(mockUpdatedTicket);
    });

    it("should throw error for invalid status", async () => {
      await expect(adminService.approveRefund(1, "invalid")).rejects.toThrow(
        "Invalid status"
      );
    });

    it("should handle refund when no payment is found", async () => {
      const ticketId = 1;
      const status = "completed";
      const mockTicket = {
        id: ticketId,
        event_name: "Test Event",
        price: "50.00",
        user_id: 1,
        purchase_id: 1,
        event_id: 1,
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        refund_status: "completed",
        status: "cancelled",
      };

      adminService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            // 1. Get ticket with event and purchase details
            .mockResolvedValueOnce({ rows: [mockTicket] })
            // 2. Update ticket refund status
            .mockResolvedValueOnce({ rows: [] })
            // 3. Update ticket status to 'cancelled'
            .mockResolvedValueOnce({ rows: [] })
            // 4. Get payment information (first attempt) - no payment found
            .mockResolvedValueOnce({ rows: [] })
            // 5. Try to find payment through purchase - no payment found
            .mockResolvedValueOnce({ rows: [] })
            // 6. Get updated ticket data for response
            .mockResolvedValueOnce({ rows: [mockUpdatedTicket] }),
        };

        return callback(mockClient);
      });

      const result = await adminService.approveRefund(ticketId, status);

      expect(result.message).toBe("Refund status updated to completed");
      expect(result.data).toEqual(mockUpdatedTicket);
    });

    it("should handle credit refunds", async () => {
      const ticketId = 1;
      const status = "completed";
      const mockTicket = {
        id: ticketId,
        event_name: "Test Event",
        price: "50.00",
        user_id: 1,
        purchase_id: 1,
        event_id: 1,
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        refund_status: "completed",
        status: "cancelled",
      };

      adminService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            // 1. Get ticket with event and purchase details
            .mockResolvedValueOnce({ rows: [mockTicket] })
            // 2. Update ticket refund status
            .mockResolvedValueOnce({ rows: [] })
            // 3. Update ticket status to 'cancelled'
            .mockResolvedValueOnce({ rows: [] })
            // 4. Get payment information (credits payment)
            .mockResolvedValueOnce({
              rows: [{ id: 1, payment_method: "credits", purchase_id: 1 }],
            })
            // 5. Create refund record
            .mockResolvedValueOnce({ rows: [{ id: 1 }] })
            // 6. Update refund status to completed (for credits)
            .mockResolvedValueOnce({ rows: [] })
            // 7. Get updated ticket data for response
            .mockResolvedValueOnce({ rows: [mockUpdatedTicket] }),
        };

        UserModel.addCredits.mockResolvedValue();

        return callback(mockClient);
      });

      const result = await adminService.approveRefund(ticketId, status);

      expect(UserModel.addCredits).toHaveBeenCalledWith(
        mockTicket.user_id,
        50, // refund amount
        "refund",
        expect.stringContaining("Refund for ticket to:"),
        1, // refund ID
        "refund"
      );
      expect(result.message).toBe("Refund status updated to completed");
      expect(result.data).toEqual(mockUpdatedTicket);
    });

    it("should handle non-completed status updates", async () => {
      const ticketId = 1;
      const status = "processing";
      const mockTicket = {
        id: ticketId,
        event_name: "Test Event",
        price: "50.00",
        user_id: 1,
        purchase_id: 1,
        event_id: 1,
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        refund_status: "processing",
      };

      adminService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            // 1. Get ticket with event and purchase details
            .mockResolvedValueOnce({ rows: [mockTicket] })
            // 2. Update ticket refund status
            .mockResolvedValueOnce({ rows: [] })
            // 3. Get updated ticket data for response (no refund processing for non-completed status)
            .mockResolvedValueOnce({ rows: [mockUpdatedTicket] }),
        };

        return callback(mockClient);
      });

      const result = await adminService.approveRefund(ticketId, status);

      expect(result.message).toBe("Refund status updated to processing");
      expect(result.data).toEqual(mockUpdatedTicket);
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
