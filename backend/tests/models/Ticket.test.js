// backend/tests/models/Ticket.test.js
import { jest } from "@jest/globals";
import crypto from "crypto";

// Mock database
const mockDbQuery = jest.fn();
const mockDbPool = {
  connect: jest.fn(),
  query: jest.fn(),
};
jest.unstable_mockModule("../../config/db.js", () => ({
  query: mockDbQuery,
  pool: mockDbPool,
}));

describe("Ticket Model - Comprehensive Additional Tests", () => {
  let Ticket;
  let consoleSpy, consoleErrorSpy;

  beforeAll(async () => {
    Ticket = await import("../../models/Ticket.js");
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("updateCheckinStatus - Fixed Tests", () => {
    it("should handle undefined checked_in_by correctly", async () => {
      const mockUpdated = { id: 1, checked_in: true, checked_in_by: null };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Ticket.updateCheckinStatus(1, true, undefined);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("UPDATE tickets"),
        values: [1, true, null], // undefined should be converted to null
      });
      expect(result).toEqual(mockUpdated);
    });

    it("should handle null checked_in_by", async () => {
      const mockUpdated = { id: 1, checked_in: false, checked_in_by: null };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Ticket.updateCheckinStatus(1, false, null);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("SET checked_in = $2"),
        values: [1, false, null],
      });
      expect(result.checked_in_by).toBeNull();
    });

    it("should verify CASE statement for checked_in_at timestamp", async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      await Ticket.updateCheckinStatus(1, false, "admin");

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /checked_in_at = CASE WHEN \$2 = true THEN CURRENT_TIMESTAMP ELSE NULL END/
        ),
        values: [1, false, "admin"],
      });
    });

    it("should handle check-out scenario (setting to false)", async () => {
      const mockUpdated = {
        id: 1,
        checked_in: false,
        checked_in_at: null,
        checked_in_by: "admin",
      };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await Ticket.updateCheckinStatus(1, false, "admin");

      expect(result.checked_in).toBe(false);
      expect(result.checked_in_at).toBeNull();
    });

    it("should handle very long checked_in_by string", async () => {
      const longAgent = "a".repeat(1000);
      const mockUpdated = { id: 1, checked_in: true, checked_in_by: longAgent };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      await Ticket.updateCheckinStatus(1, true, longAgent);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: [1, true, longAgent],
      });
    });

    it("should handle special characters in checked_in_by", async () => {
      const specialAgent = 'admin@test.com <script>alert("xss")</script>';
      const mockUpdated = {
        id: 1,
        checked_in: true,
        checked_in_by: specialAgent,
      };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      await Ticket.updateCheckinStatus(1, true, specialAgent);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: [1, true, specialAgent],
      });
    });

    it("should handle ticket not found scenario", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Ticket.updateCheckinStatus(999, true, "admin");

      expect(result).toBeUndefined();
    });

    it("should handle database constraint errors", async () => {
      const constraintError = new Error(
        'check constraint "valid_checked_in" failed'
      );
      constraintError.code = "23514";
      mockDbQuery.mockRejectedValue(constraintError);

      await expect(
        Ticket.updateCheckinStatus(1, "invalid", "admin")
      ).rejects.toThrow('check constraint "valid_checked_in" failed');
    });
  });

  describe("processAutomaticRefundCompletion - Comprehensive Fixed Tests", () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockDbPool.connect.mockResolvedValue(mockClient);
    });

    it("should handle payment not found scenario", async () => {
      const mockEligibleTickets = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          ticket_type_id: 1,
          price: "50.00",
          purchase_id: 1,
          event_name: "Test Event",
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: mockEligibleTickets }) // Find eligible tickets
        .mockResolvedValueOnce({}) // Update ticket status
        .mockResolvedValueOnce({ rows: [] }) // Find payment by ticket - not found
        .mockResolvedValueOnce({ rows: [] }) // Find payment by purchase - not found
        .mockResolvedValueOnce({}); // COMMIT

      const result = await Ticket.processAutomaticRefundCompletion(5);

      expect(result).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Processing automatic refund for ticket 1"
      );
    });

    it("should handle card payment refund scenario", async () => {
      const mockEligibleTickets = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          ticket_type_id: 1,
          price: "75.00",
          purchase_id: 1,
          event_name: "Card Payment Event",
        },
      ];

      const mockPayment = {
        id: 1,
        payment_method: "card",
        purchase_id: 1,
      };

      const mockPaymentMethod = {
        id: 1,
        type: "card",
        card_last_four: "1234",
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: mockEligibleTickets }) // Find eligible tickets
        .mockResolvedValueOnce({}) // Update ticket status
        .mockResolvedValueOnce({ rows: [mockPayment] }) // Find payment
        .mockResolvedValueOnce({ rows: [mockPaymentMethod] }) // Find payment method
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert refund record
        .mockResolvedValueOnce({}); // COMMIT

      const result = await Ticket.processAutomaticRefundCompletion(3);

      expect(result).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Looking for refunds pending for more than 3 days..."
      );
    });

    it("should handle transaction rollback on any error", async () => {
      const mockEligibleTickets = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          ticket_type_id: 1,
          price: "50.00",
          purchase_id: 1,
          event_name: "Test Event",
        },
      ];

      const updateError = new Error("Failed to update ticket status");

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: mockEligibleTickets }) // Find eligible tickets
        .mockRejectedValueOnce(updateError) // Update ticket status fails
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(Ticket.processAutomaticRefundCompletion()).rejects.toThrow(
        "Failed to update ticket status"
      );

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error processing automatic refund completion:",
        updateError
      );
    });


    it("should handle edge case with zero-priced tickets", async () => {
      const mockEligibleTickets = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          ticket_type_id: 1,
          price: "0.00",
          purchase_id: 1,
          event_name: "Free Event",
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: mockEligibleTickets }) // Find eligible tickets
        .mockResolvedValueOnce({}) // Update ticket status
        .mockResolvedValueOnce({ rows: [] }) // No payment found
        .mockResolvedValueOnce({ rows: [] }) // No payment by purchase
        .mockResolvedValueOnce({}); // COMMIT

      const result = await Ticket.processAutomaticRefundCompletion();

      expect(result).toHaveLength(1);
      expect(result[0].price).toBe("0.00");
    });

    it("should handle null price values", async () => {
      const mockEligibleTickets = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          ticket_type_id: 1,
          price: null,
          purchase_id: 1,
          event_name: "Null Price Event",
        },
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: mockEligibleTickets }) // Find eligible tickets
        .mockResolvedValueOnce({}) // Update ticket status
        .mockResolvedValueOnce({ rows: [] }) // No payment found
        .mockResolvedValueOnce({ rows: [] }) // No payment by purchase
        .mockResolvedValueOnce({}); // COMMIT

      const result = await Ticket.processAutomaticRefundCompletion();

      expect(result).toHaveLength(1);
      expect(result[0].price).toBeNull();
    });
  });

  describe("findUpcomingByUser - Additional Tests", () => {
    it("should handle date boundary conditions", async () => {
      const mockTickets = [
        {
          id: 1,
          event_name: "Tomorrow Event",
          date: "2024-03-16",
          time: "10:00",
          status: "purchased",
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockTickets });

      const result = await Ticket.findUpcomingByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("e.date >= CURRENT_DATE"),
        values: [1],
      });
      expect(result).toEqual(mockTickets);
    });

    it("should only return purchased tickets", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findUpcomingByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("t.status = 'purchased'"),
        values: [1],
      });
    });

    it("should order by date and time ASC", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findUpcomingByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/ORDER BY e\.date ASC, e\.time ASC/),
        values: [1],
      });
    });

    it("should handle user with no upcoming tickets", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Ticket.findUpcomingByUser(999);

      expect(result).toEqual([]);
    });

    it("should include all necessary event and ticket fields", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findUpcomingByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /e\.name as event_name.*e\.date.*e\.time.*e\.venue.*e\.image_url.*tt\.name as ticket_type_name/s
        ),
        values: [1],
      });
    });
  });

  describe("findPastByUser - Additional Tests", () => {
    it("should handle past date filtering", async () => {
      const mockTickets = [
        {
          id: 1,
          event_name: "Yesterday Event",
          date: "2024-03-14",
          status: "purchased",
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockTickets });

      const result = await Ticket.findPastByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("e.date < CURRENT_DATE"),
        values: [1],
      });
      expect(result).toEqual(mockTickets);
    });

    it("should order by date DESC for past events", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findPastByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/ORDER BY e\.date DESC, e\.time ASC/),
        values: [1],
      });
    });

    it("should only return purchased tickets for past events", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findPastByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("t.status = 'purchased'"),
        values: [1],
      });
    });
  });

  describe("findCancelledByUser - Additional Tests", () => {
    it("should group tickets by event correctly", async () => {
      const mockTickets = [
        {
          id: 1,
          event_id: 1,
          event_name: "Event 1",
          date: "2024-03-15",
          time: "19:00",
          venue: "Venue 1",
          address: "Address 1",
          image_url: "event1.jpg",
          ticket_type_name: "VIP",
          status: "cancelled",
        },
        {
          id: 2,
          event_id: 1,
          event_name: "Event 1",
          date: "2024-03-15",
          time: "19:00",
          venue: "Venue 1",
          address: "Address 1",
          image_url: "event1.jpg",
          ticket_type_name: "Regular",
          status: "cancelled",
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockTickets });

      const result = await Ticket.findCancelledByUser(1);

      expect(result).toHaveLength(1); // One event group
      expect(result[0].tickets).toHaveLength(2); // Two tickets in the group
      expect(result[0].eventId).toBe(1);
      expect(result[0].eventName).toBe("Event 1");
    });

    it("should handle multiple events with cancelled tickets", async () => {
      const mockTickets = [
        {
          id: 1,
          event_id: 1,
          event_name: "Event 1",
          date: "2024-03-15",
          status: "cancelled",
        },
        {
          id: 2,
          event_id: 2,
          event_name: "Event 2",
          date: "2024-03-16",
          status: "cancelled",
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockTickets });

      const result = await Ticket.findCancelledByUser(1);

      expect(result).toHaveLength(2); // Two event groups
      expect(result[0].tickets).toHaveLength(1);
      expect(result[1].tickets).toHaveLength(1);
    });

    it("should order by cancelled_at DESC", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findCancelledByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/ORDER BY t\.cancelled_at DESC/),
        values: [1],
      });
    });

    it("should include address field", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findCancelledByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("e.address"),
        values: [1],
      });
    });

    it("should only return cancelled status tickets", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findCancelledByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("t.status = 'cancelled'"),
        values: [1],
      });
    });
  });

  describe("updateRefundStatus - Additional Tests", () => {
    const validStatuses = [
      "requested",
      "processing",
      "completed",
      "failed",
      "denied",
    ];

    it("should validate refund status values", async () => {
      for (const status of validStatuses) {
        const mockUpdated = { id: 1, refund_status: status };
        mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

        const result = await Ticket.updateRefundStatus(1, status);

        expect(result.refund_status).toBe(status);
        jest.clearAllMocks();
      }
    });

    it("should reject invalid refund status", async () => {
      await expect(
        Ticket.updateRefundStatus(1, "invalid_status")
      ).rejects.toThrow("Invalid refund status: invalid_status");
    });

    it("should reject empty string status", async () => {
      await expect(Ticket.updateRefundStatus(1, "")).rejects.toThrow(
        "Invalid refund status: "
      );
    });

    it("should reject null status", async () => {
      await expect(Ticket.updateRefundStatus(1, null)).rejects.toThrow(
        "Invalid refund status: null"
      );
    });

    it("should reject undefined status", async () => {
      await expect(Ticket.updateRefundStatus(1, undefined)).rejects.toThrow(
        "Invalid refund status: undefined"
      );
    });

    it("should handle case-sensitive validation", async () => {
      await expect(Ticket.updateRefundStatus(1, "REQUESTED")).rejects.toThrow(
        "Invalid refund status: REQUESTED"
      );
    });

    it("should update updated_at timestamp", async () => {
      const mockUpdated = { id: 1, refund_status: "completed" };
      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      await Ticket.updateRefundStatus(1, "completed");

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("updated_at = CURRENT_TIMESTAMP"),
        values: [1, "completed"],
      });
    });

    it("should handle ticket not found", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Ticket.updateRefundStatus(999, "completed");

      expect(result).toBeUndefined();
    });

    it("should handle database errors during update", async () => {
      const dbError = new Error("Database connection failed");
      mockDbQuery.mockRejectedValue(dbError);

      await expect(Ticket.updateRefundStatus(1, "completed")).rejects.toThrow(
        "Database connection failed"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error updating refund status:",
        dbError
      );
    });
  });

  describe("getAllRefunds - Additional Tests", () => {
    it("should return refunds ordered by priority and date", async () => {
      const mockRefunds = [
        { id: 1, refund_status: "requested", cancelled_at: "2024-03-15" },
        { id: 2, refund_status: "processing", cancelled_at: "2024-03-14" },
        { id: 3, refund_status: "completed", cancelled_at: "2024-03-13" },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockRefunds });

      const result = await Ticket.getAllRefunds();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /ORDER BY[\s\S]*CASE[\s\S]*WHEN t\.refund_status = 'requested' OR t\.refund_status IS NULL THEN 1[\s\S]*WHEN t\.refund_status = 'processing' THEN 2[\s\S]*ELSE 3[\s\S]*END,[\s\S]*t\.cancelled_at DESC/
        ),
        values: [],
      });
      expect(result).toEqual(mockRefunds);
    });

    it("should include all necessary fields", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.getAllRefunds();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /u\.name as user_name.*u\.email as user_email.*e\.name as event_name.*e\.date as event_date.*tt\.name as ticket_type_name/s
        ),
        values: [],
      });
    });

    it("should filter cancelled or refunded tickets", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.getAllRefunds();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining(
          "t.status = 'cancelled' OR t.status = 'refunded'"
        ),
        values: [],
      });
    });

    it("should handle empty results", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Ticket.getAllRefunds();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Connection timeout");
      mockDbQuery.mockRejectedValue(dbError);

      await expect(Ticket.getAllRefunds()).rejects.toThrow(
        "Connection timeout"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error finding all refunds:",
        dbError
      );
    });
  });

  describe("findPendingRefunds - Additional Tests", () => {
    it("should find tickets with requested refund status", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findPendingRefunds();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining(
          "t.refund_status = 'requested' OR t.refund_status IS NULL"
        ),
        values: [],
      });
    });

    it("should include user and event information", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findPendingRefunds();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /u\.name as user_name.*u\.email as user_email.*e\.name as event_name.*e\.date as event_date/s
        ),
        values: [],
      });
    });

    it("should order by cancelled_at DESC", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findPendingRefunds();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(/ORDER BY t\.cancelled_at DESC/),
        values: [],
      });
    });

    it("should only return cancelled tickets", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findPendingRefunds();

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringContaining("t.status = 'cancelled'"),
        values: [],
      });
    });

    it("should handle database connection errors", async () => {
      const connectionError = new Error("Connection refused");
      mockDbQuery.mockRejectedValue(connectionError);

      await expect(Ticket.findPendingRefunds()).rejects.toThrow(
        "Connection refused"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error finding pending refunds:",
        connectionError
      );
    });
  });

  describe("Edge Cases and Performance Tests", () => {
    it("should handle very large user IDs", async () => {
      const largeUserId = Number.MAX_SAFE_INTEGER;
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Ticket.findByUser(largeUserId);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: [largeUserId],
      });
    });

    it("should handle concurrent database operations", async () => {
      const operations = [
        Ticket.findByUser(1),
        Ticket.findUpcomingByUser(2),
        Ticket.findPastByUser(3),
        Ticket.findCancelledByUser(4),
      ];

      mockDbQuery.mockResolvedValue({ rows: [] });

      await Promise.all(operations);

      expect(mockDbQuery).toHaveBeenCalledTimes(4);
    });

    it("should handle memory pressure scenarios", async () => {
      const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        event_name: `Event ${i}`,
        user_id: 1,
      }));

      mockDbQuery.mockResolvedValue({ rows: largeDataSet });

      const result = await Ticket.findByUser(1);

      expect(result).toHaveLength(10000);
    });

    it("should handle rapid successive calls", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const promises = Array.from({ length: 100 }, () => Ticket.findByUser(1));

      await Promise.all(promises);

      expect(mockDbQuery).toHaveBeenCalledTimes(100);
    });
  });
});
