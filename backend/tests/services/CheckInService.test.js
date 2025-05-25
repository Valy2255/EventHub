import { jest } from "@jest/globals";

// Mock models using unstable_mockModule
jest.unstable_mockModule("../../models/CheckIn.js", () => ({
  findTicketById: jest.fn(),
  updateCheckInStatus: jest.fn(),
  findEventById: jest.fn(),
  getEventStats: jest.fn(),
  getRecentCheckIns: jest.fn(),
}));

jest.unstable_mockModule("../../models/Ticket.js", () => ({
  generateTicketHash: jest.fn(),
}));

describe("CheckInService", () => {
  let CheckInService;
  let CheckInModel;
  let TicketModel;
  let checkInService;
  let mockDate;

  beforeAll(async () => {
    CheckInModel = await import("../../models/CheckIn.js");
    TicketModel = await import("../../models/Ticket.js");
    const { CheckInService: CheckInServiceClass } = await import("../../services/CheckInService.js");
    CheckInService = CheckInServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Date to return a consistent time
    mockDate = new Date('2024-06-15T10:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    Date.now = jest.fn(() => mockDate.getTime());
    
    checkInService = new CheckInService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findTicketByQr", () => {
    it("should find ticket by QR code object", async () => {
      const qrData = { id: 1, hash: "valid-hash" };
      
      // Use the same mocked date
      const todayDateString = '2024-06-15'; // Same as mockDate

      const mockTicket = {
        id: 1,
        event_id: 1,
        user_id: 1,
        event_name: "Test Event",
        date: todayDateString,
        checked_in: false,
      };

      CheckInModel.findTicketById.mockResolvedValue(mockTicket);
      TicketModel.generateTicketHash.mockReturnValue("valid-hash");

      const result = await checkInService.findTicketByQr(qrData);

      expect(CheckInModel.findTicketById).toHaveBeenCalledWith(1);
      expect(TicketModel.generateTicketHash).toHaveBeenCalledWith(1, 1, 1);
      expect(result.status).toBe("VALID_TODAY");
    });

    it("should handle manual entry", async () => {
      const qrData = { id: 1, hash: "manual-entry" };
      
      // Use the same mocked date
      const todayDateString = '2024-06-15'; // Same as mockDate

      const mockTicket = {
        id: 1,
        event_name: "Test Event",
        date: todayDateString,
        checked_in: false,
      };

      CheckInModel.findTicketById.mockResolvedValue(mockTicket);

      const result = await checkInService.findTicketByQr(qrData);

      expect(TicketModel.generateTicketHash).not.toHaveBeenCalled();
      expect(result.status).toBe("VALID_TODAY");
    });

    it("should handle numeric ticket ID", async () => {
      const qrData = 123;
      
      // Use the same mocked date
      const todayDateString = '2024-06-15'; // Same as mockDate

      const mockTicket = {
        id: 123,
        event_name: "Test Event",
        date: todayDateString,
        checked_in: false,
      };

      CheckInModel.findTicketById.mockResolvedValue(mockTicket);

      const result = await checkInService.findTicketByQr(qrData);

      expect(CheckInModel.findTicketById).toHaveBeenCalledWith(123);
      expect(result.status).toBe("VALID_TODAY");
    });

    it("should throw error for invalid ticket signature", async () => {
      const qrData = { id: 1, hash: "invalid-hash" };
      const mockTicket = { id: 1, event_id: 1, user_id: 1, checked_in: false };

      CheckInModel.findTicketById.mockResolvedValue(mockTicket);
      TicketModel.generateTicketHash.mockReturnValue("valid-hash");

      await expect(checkInService.findTicketByQr(qrData)).rejects.toThrow(
        "Invalid ticket signature - possible forgery attempt"
      );
    });

    it("should throw error if ticket already checked in", async () => {
      const qrData = { id: 1, hash: "manual-entry" };
      const mockTicket = {
        id: 1,
        event_name: "Test Event",
        user_name: "John Doe",
        checked_in: true,
        checked_in_at: "2024-01-01T10:00:00",
      };

      CheckInModel.findTicketById.mockResolvedValue(mockTicket);

      try {
        await checkInService.findTicketByQr(qrData);
      } catch (error) {
        expect(error.message).toBe("This ticket has already been used");
        expect(error.isAlreadyCheckedIn).toBe(true);
        expect(error.ticketData.id).toBe(1);
      }
    });
  });

  // ... rest of your tests remain the same
  describe("checkInTicket", () => {
    it("should check in ticket successfully", async () => {
      const ticketId = 1;
      const mockTicket = {
        id: ticketId,
        event_name: "Test Event",
        user_name: "John Doe",
        ticket_type_name: "General",
        checked_in: false,
      };
      const updatedTicket = {
        ...mockTicket,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      };

      CheckInModel.findTicketById.mockResolvedValue(mockTicket);
      CheckInModel.updateCheckInStatus.mockResolvedValue(updatedTicket);

      const result = await checkInService.checkInTicket(ticketId);

      expect(CheckInModel.findTicketById).toHaveBeenCalledWith(ticketId);
      expect(CheckInModel.updateCheckInStatus).toHaveBeenCalledWith(ticketId);
      expect(result.ticket.checked_in_at).toBeDefined();
    });

    it("should throw error if ticket not found", async () => {
      CheckInModel.findTicketById.mockResolvedValue(null);

      await expect(checkInService.checkInTicket(999)).rejects.toThrow(
        "Ticket not found or has been cancelled"
      );
    });

    it("should throw error if ticket already checked in", async () => {
      const mockTicket = {
        id: 1,
        checked_in: true,
        checked_in_at: "2024-01-01T10:00:00",
      };

      CheckInModel.findTicketById.mockResolvedValue(mockTicket);

      try {
        await checkInService.checkInTicket(1);
      } catch (error) {
        expect(error.message).toBe("This ticket has already been used");
        expect(error.isAlreadyCheckedIn).toBe(true);
      }
    });
  });

  describe("getEventCheckInStats", () => {
    it("should return event check-in statistics", async () => {
      const eventId = 1;
      const mockEvent = {
        id: eventId,
        name: "Test Event",
        date: "2024-12-25",
        time: "18:00",
        venue: "Test Venue",
      };
      const mockStats = {
        total_tickets: "100",
        valid_tickets: "80",
        checked_in_count: "40",
      };
      const mockRecentCheckIns = [
        { user_name: "John Doe", checked_in_at: "2024-01-01T10:00:00" },
        { user_name: "Jane Smith", checked_in_at: "2024-01-01T10:05:00" },
      ];

      CheckInModel.findEventById.mockResolvedValue(mockEvent);
      CheckInModel.getEventStats.mockResolvedValue(mockStats);
      CheckInModel.getRecentCheckIns.mockResolvedValue(mockRecentCheckIns);

      const result = await checkInService.getEventCheckInStats(eventId);

      expect(CheckInModel.findEventById).toHaveBeenCalledWith(eventId);
      expect(CheckInModel.getEventStats).toHaveBeenCalledWith(eventId);
      expect(CheckInModel.getRecentCheckIns).toHaveBeenCalledWith(eventId);

      expect(result.event).toEqual(mockEvent);
      expect(result.stats.totalTickets).toBe(100);
      expect(result.stats.validTickets).toBe(80);
      expect(result.stats.checkedInCount).toBe(40);
      expect(result.stats.checkInPercentage).toBe(50);
      expect(result.stats.remaining).toBe(40);
      expect(result.recentCheckIns).toEqual(mockRecentCheckIns);
    });

    it("should throw error if event not found", async () => {
      CheckInModel.findEventById.mockResolvedValue(null);

      await expect(checkInService.getEventCheckInStats(999)).rejects.toThrow(
        "Event not found"
      );
    });

    it("should handle zero tickets gracefully", async () => {
      const mockEvent = { id: 1, name: "Test Event" };
      const mockStats = {
        total_tickets: "0",
        valid_tickets: "0",
        checked_in_count: "0",
      };

      CheckInModel.findEventById.mockResolvedValue(mockEvent);
      CheckInModel.getEventStats.mockResolvedValue(mockStats);
      CheckInModel.getRecentCheckIns.mockResolvedValue([]);

      const result = await checkInService.getEventCheckInStats(1);

      expect(result.stats.checkInPercentage).toBe(0);
      expect(result.stats.remaining).toBe(0);
    });
  });
});