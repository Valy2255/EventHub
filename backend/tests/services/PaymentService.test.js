import { jest } from "@jest/globals";

// Mock models using unstable_mockModule
jest.unstable_mockModule("../../models/Payment.js", () => ({
  create: jest.fn(),
  findByUserId: jest.fn(),
  findById: jest.fn(),
  getPaymentTickets: jest.fn(),
  linkTicketToPayment: jest.fn(),
}));

jest.unstable_mockModule("../../models/Ticket.js", () => ({
  createPurchased: jest.fn(),
  generateTicketHash: jest.fn(),
}));

jest.unstable_mockModule("../../models/TicketType.js", () => ({
  findById: jest.fn(),
  updateAvailability: jest.fn(),
}));

jest.unstable_mockModule("../../models/Event.js", () => ({
  findById: jest.fn(),
}));

jest.unstable_mockModule("../../models/User.js", () => ({
  getCreditBalance: jest.fn(),
  addCredits: jest.fn(),
}));

jest.unstable_mockModule("../../models/Purchase.js", () => ({
  createPurchase: jest.fn(),
}));

jest.unstable_mockModule("qrcode", () => ({
  default: {
    toDataURL: jest.fn(),
  },
}));

jest.unstable_mockModule("../../utils/emailService.js", () => ({
  sendTicketEmail: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule("../../services/BaseService.js", () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  },
}));

describe("PaymentService", () => {
  let PaymentService;
  let Payment;
  let Ticket;
  let TicketType;
  let Event;
  let User;
  let Purchase;
  let QRCode;
  let emailService;
  let paymentService;

  beforeAll(async () => {
    Payment = await import("../../models/Payment.js");
    Ticket = await import("../../models/Ticket.js");
    TicketType = await import("../../models/TicketType.js");
    Event = await import("../../models/Event.js");
    User = await import("../../models/User.js");
    Purchase = await import("../../models/Purchase.js");
    QRCode = await import("qrcode");
    emailService = await import("../../utils/emailService.js");
    const { PaymentService: PaymentServiceClass } = await import(
      "../../services/PaymentService.js"
    );
    PaymentService = PaymentServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService();
  });

  describe("processPayment", () => {
    it("should process payment with card successfully", async () => {
      const userId = 1;
      const paymentData = {
        amount: 100,
        currency: "USD",
        tickets: [{ ticketTypeId: 1, quantity: 2, price: 50, eventId: 1 }],
        paymentMethod: "card",
        savedCardId: 1,
      };

      const mockPayment = {
        id: 1,
        user_id: userId,
        amount: 100,
        status: "succeeded",
      };
      const mockTicketType = { id: 1, name: "General", available_quantity: 10 };
      const mockEvent = {
        id: 1,
        name: "Test Event",
        date: "2024-12-25",
        venue: "Test Venue",
      };
      const mockTicket = { id: 1, event_id: 1, user_id: userId };
      const mockPurchase = { id: 1, user_id: userId, order_id: "ORD-12345" };

      Payment.create.mockResolvedValue(mockPayment);
      TicketType.findById.mockResolvedValue(mockTicketType);
      Event.findById.mockResolvedValue(mockEvent);
      Ticket.createPurchased.mockResolvedValue(mockTicket);
      Ticket.generateTicketHash.mockReturnValue("mock-hash");
      QRCode.default.toDataURL.mockResolvedValue("mock-qr-code");
      Payment.linkTicketToPayment.mockResolvedValue();
      TicketType.updateAvailability.mockResolvedValue();
      Purchase.createPurchase.mockResolvedValue(mockPurchase);

      // Mock transaction
      paymentService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({
              rows: [{ id: 1, card_type: "Visa", last_four: "1234" }],
            }) // Saved card query
            .mockResolvedValue({
              rows: [
                {
                  ...mockTicket,
                  qr_code: "mock-qr-code",
                  ticket_type_id: 1,
                  event_id: 1,
                  user_id: userId,
                  price: 50,
                },
              ],
            }), // Update ticket query - this was missing the proper structure
        };
        return callback(mockClient);
      });

      const result = await paymentService.processPayment(userId, paymentData);

      expect(Payment.create).toHaveBeenCalled();
      expect(Ticket.createPurchased).toHaveBeenCalledTimes(2); // 2 tickets
      expect(Purchase.createPurchase).toHaveBeenCalled();
      expect(result).toHaveProperty("payment");
      expect(result).toHaveProperty("purchase");
      expect(result).toHaveProperty("createdTickets");
      expect(result.paymentMethod).toBe("card");
      expect(result.createdTickets).toHaveLength(2);
    });

    it("should process payment with credits successfully", async () => {
      const userId = 1;
      const paymentData = {
        amount: 50,
        tickets: [{ ticketTypeId: 1, quantity: 1, price: 50, eventId: 1 }],
        useCredits: true,
      };

      const mockPayment = {
        id: 1,
        user_id: userId,
        amount: 50,
        payment_method: "credits",
      };
      const mockTicketType = { id: 1, name: "General", available_quantity: 10 };
      const mockEvent = { id: 1, name: "Test Event" };
      const mockTicket = { id: 1 };
      const mockPurchase = { id: 1 };

      User.getCreditBalance.mockResolvedValue(100); // User has enough credits
      User.addCredits.mockResolvedValue();
      Payment.create.mockResolvedValue(mockPayment);
      TicketType.findById.mockResolvedValue(mockTicketType);
      Event.findById.mockResolvedValue(mockEvent);
      Ticket.createPurchased.mockResolvedValue(mockTicket);
      Ticket.generateTicketHash.mockReturnValue("mock-hash");
      QRCode.default.toDataURL.mockResolvedValue("mock-qr-code");
      Payment.linkTicketToPayment.mockResolvedValue();
      TicketType.updateAvailability.mockResolvedValue();
      Purchase.createPurchase.mockResolvedValue(mockPurchase);

      // Mock transaction
      paymentService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({
              rows: [{ ...mockTicket, qr_code: "mock-qr-code" }],
            }) // Update ticket
            .mockResolvedValueOnce({}) // Link ticket to purchase
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Recent credit transaction
            .mockResolvedValueOnce({}), // Update credit transaction
        };
        return callback(mockClient);
      });

      const result = await paymentService.processPayment(userId, paymentData);

      expect(User.getCreditBalance).toHaveBeenCalledWith(userId);
      expect(User.addCredits).toHaveBeenCalledWith(
        userId,
        -50,
        "purchase",
        "Purchase of tickets",
        null,
        "payment"
      );
      expect(result.paymentMethod).toBe("credits");
      expect(result.currentCredits).toBe(100);
    });

    it("should throw error for insufficient credits", async () => {
      const userId = 1;
      const paymentData = {
        amount: 100,
        tickets: [{ ticketTypeId: 1, quantity: 1, price: 100, eventId: 1 }],
        useCredits: true,
      };

      User.getCreditBalance.mockResolvedValue(50); // Not enough credits

      paymentService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      await expect(
        paymentService.processPayment(userId, paymentData)
      ).rejects.toThrow("Insufficient credits");
    });

    it("should throw error for invalid payment amount", async () => {
      const paymentData = {
        amount: 0,
        tickets: [],
      };

      await expect(
        paymentService.processPayment(1, paymentData)
      ).rejects.toThrow("Invalid payment amount");
    });

    it("should throw error for no tickets", async () => {
      const paymentData = {
        amount: 100,
        tickets: [],
      };

      await expect(
        paymentService.processPayment(1, paymentData)
      ).rejects.toThrow("No tickets provided");
    });

    it("should throw error for ticket type not found", async () => {
      const paymentData = {
        amount: 50,
        tickets: [{ ticketTypeId: 999, quantity: 1, price: 50, eventId: 1 }],
        paymentMethod: "card",
        savedCardId: 1,
      };

      TicketType.findById.mockResolvedValue(null);

      paymentService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValue({ rows: [{ id: 1, card_type: "Visa" }] }),
        };
        return callback(mockClient);
      });

      await expect(
        paymentService.processPayment(1, paymentData)
      ).rejects.toThrow("Ticket type with ID 999 not found");
    });

    it("should throw error for insufficient ticket availability", async () => {
      const paymentData = {
        amount: 100,
        tickets: [{ ticketTypeId: 1, quantity: 5, price: 50, eventId: 1 }],
        paymentMethod: "card",
        savedCardId: 1,
      };

      const mockTicketType = { id: 1, name: "General", available_quantity: 2 };
      TicketType.findById.mockResolvedValue(mockTicketType);

      paymentService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValue({ rows: [{ id: 1, card_type: "Visa" }] }),
        };
        return callback(mockClient);
      });

      await expect(
        paymentService.processPayment(1, paymentData)
      ).rejects.toThrow("Not enough tickets available for General");
    });

    it("should throw error for saved card not found", async () => {
      const paymentData = {
        amount: 50,
        tickets: [{ ticketTypeId: 1, quantity: 1, price: 50, eventId: 1 }],
        paymentMethod: "card",
        savedCardId: 999,
      };

      const mockTicketType = { id: 1, name: "General", available_quantity: 10 };
      TicketType.findById.mockResolvedValue(mockTicketType);

      paymentService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [] }), // No saved card found
        };
        return callback(mockClient);
      });

      await expect(
        paymentService.processPayment(1, paymentData)
      ).rejects.toThrow("Saved card not found");
    });

    it("should save new card during checkout", async () => {
      const paymentData = {
        amount: 50,
        tickets: [{ ticketTypeId: 1, quantity: 1, price: 50, eventId: 1 }],
        paymentMethod: "card",
        saveCard: true,
        cardDetails: {
          cardNumber: "4111111111111111",
          cardHolderName: "John Doe",
          expiryDate: "12/25",
          isDefault: true,
        },
      };

      const mockTicketType = { id: 1, name: "General", available_quantity: 10 };
      const mockEvent = { id: 1, name: "Test Event" };
      const mockTicket = { id: 1 };
      const mockPayment = { id: 1 };
      const mockPurchase = { id: 1 };

      TicketType.findById.mockResolvedValue(mockTicketType);
      Event.findById.mockResolvedValue(mockEvent);
      Ticket.createPurchased.mockResolvedValue(mockTicket);
      Ticket.generateTicketHash.mockReturnValue("mock-hash");
      QRCode.default.toDataURL.mockResolvedValue("mock-qr-code");
      Payment.create.mockResolvedValue(mockPayment);
      Payment.linkTicketToPayment.mockResolvedValue();
      TicketType.updateAvailability.mockResolvedValue();
      Purchase.createPurchase.mockResolvedValue(mockPurchase);

      paymentService.executeInTransaction = jest.fn(async (callback) => {
        const mockClient = {
          query: jest
            .fn()
            .mockResolvedValueOnce({}) // Unset existing default cards
            .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Create new card
            .mockResolvedValueOnce({
              rows: [{ ...mockTicket, qr_code: "mock-qr-code" }],
            }) // Update ticket
            .mockResolvedValueOnce({}), // Link ticket to purchase
        };
        return callback(mockClient);
      });

      const result = await paymentService.processPayment(1, paymentData);

      expect(result.savedCardId).toBe(2);
      expect(result.paymentMethod).toBe("card");
    });
  });

  describe("getPaymentHistory", () => {
    it("should return payment history for user", async () => {
      const userId = 1;
      const mockPayments = [
        { id: 1, amount: 100, created_at: "2024-01-01" },
        { id: 2, amount: 50, created_at: "2024-01-02" },
      ];

      Payment.findByUserId.mockResolvedValue(mockPayments);

      const result = await paymentService.getPaymentHistory(userId);

      expect(Payment.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockPayments);
    });
  });

  describe("getPaymentDetails", () => {
    it("should return payment details with tickets", async () => {
      const paymentId = 1;
      const userId = 1;
      const mockPayment = { id: paymentId, user_id: userId, amount: 100 };
      const mockTickets = [
        { id: 1, event_name: "Event 1" },
        { id: 2, event_name: "Event 1" },
      ];

      Payment.findById.mockResolvedValue(mockPayment);
      Payment.getPaymentTickets.mockResolvedValue(mockTickets);

      const result = await paymentService.getPaymentDetails(paymentId, userId);

      expect(Payment.findById).toHaveBeenCalledWith(paymentId);
      expect(Payment.getPaymentTickets).toHaveBeenCalledWith(paymentId);
      expect(result).toEqual({ payment: mockPayment, tickets: mockTickets });
    });

    it("should throw error if payment not found", async () => {
      Payment.findById.mockResolvedValue(null);

      await expect(paymentService.getPaymentDetails(999, 1)).rejects.toThrow(
        "Payment not found"
      );
    });

    it("should throw error if payment belongs to different user", async () => {
      const mockPayment = { id: 1, user_id: 2 };
      Payment.findById.mockResolvedValue(mockPayment);

      await expect(paymentService.getPaymentDetails(1, 1)).rejects.toThrow(
        "Unauthorized access to this payment"
      );
    });
  });

  describe("sendTicketEmail", () => {
    it("should send ticket email successfully", async () => {
      const userEmail = "test@example.com";
      const userName = "John Doe";
      const tickets = [{ id: 1, event_name: "Test Event" }];
      const orderNumber = "ORD-12345";

      emailService.sendTicketEmail.mockResolvedValue();

      await paymentService.sendTicketEmail(
        userEmail,
        userName,
        tickets,
        orderNumber
      );

      expect(emailService.sendTicketEmail).toHaveBeenCalledWith(
        userEmail,
        userName,
        tickets,
        orderNumber
      );
    });

    it("should handle email sending errors gracefully", async () => {
      const userEmail = "test@example.com";
      const userName = "John Doe";
      const tickets = [{ id: 1, event_name: "Test Event" }];
      const orderNumber = "ORD-12345";

      emailService.sendTicketEmail.mockRejectedValue(
        new Error("Email service error")
      );

      // Should not throw error
      await expect(
        paymentService.sendTicketEmail(
          userEmail,
          userName,
          tickets,
          orderNumber
        )
      ).resolves.not.toThrow();
    });
  });

  describe("helper methods", () => {
    it("should validate payment request correctly", () => {
      // Valid request
      expect(() =>
        paymentService.validatePaymentRequest(100, [{ id: 1 }])
      ).not.toThrow();

      // Invalid amount
      expect(() =>
        paymentService.validatePaymentRequest(0, [{ id: 1 }])
      ).toThrow("Invalid payment amount");

      // No tickets
      expect(() => paymentService.validatePaymentRequest(100, [])).toThrow(
        "No tickets provided"
      );

      // Null tickets
      expect(() => paymentService.validatePaymentRequest(100, null)).toThrow(
        "No tickets provided"
      );
    });

    it("should detect card types correctly", () => {
      expect(paymentService.getCardType("4111111111111111")).toBe("Visa");
      expect(paymentService.getCardType("5555555555554444")).toBe("Mastercard");
      expect(paymentService.getCardType("378282246310005")).toBe(
        "American Express"
      );
      expect(paymentService.getCardType("6011111111111117")).toBe("Discover");
      expect(paymentService.getCardType("35303030303030309")).toBe("JCB");
      expect(paymentService.getCardType("1234567890123456")).toBe("Unknown");
    });

    it("should generate order number with correct format", () => {
      const orderNumber = paymentService.generateOrderNumber();

      expect(orderNumber).toMatch(/^ORD-\d+-[A-F0-9]{4}$/);
      expect(orderNumber.length).toBeGreaterThan(10);
    });
  });
});
