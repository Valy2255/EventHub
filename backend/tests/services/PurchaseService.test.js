// backend/tests/services/PurchaseService.test.js
import { jest } from "@jest/globals";

// Mock models
jest.unstable_mockModule("../../models/Purchase.js", () => ({
  findByUser: jest.fn(),
  findById: jest.fn(),
  getItemsByPurchaseId: jest.fn(),
  findTicketsByPurchaseId: jest.fn(),
}));

jest.unstable_mockModule("../../models/Event.js", () => ({
  findById: jest.fn(),
}));

describe("PurchaseService", () => {
  let PurchaseService;
  let PurchaseModel;
  let EventModel;
  let purchaseService;

  beforeAll(async () => {
    PurchaseModel = await import("../../models/Purchase.js");
    EventModel = await import("../../models/Event.js");
    const { PurchaseService: PurchaseServiceClass } = await import(
      "../../services/PurchaseService.js"
    );
    PurchaseService = PurchaseServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    purchaseService = new PurchaseService();
  });

  describe("getPurchaseHistory", () => {
    it("should return paginated purchase history for user", async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;

      const mockPurchases = {
        purchases: [
          {
            id: 1,
            user_id: userId,
            order_number: "ORD-123456",
            total_amount: 100,
            status: "completed",
            created_at: "2025-05-20T10:00:00Z",
          },
          {
            id: 2,
            user_id: userId,
            order_number: "ORD-789012",
            total_amount: 75,
            status: "completed",
            created_at: "2025-05-19T15:30:00Z",
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          hasNextPage: true,
          hasPrevPage: false,
        },
      };

      PurchaseModel.findByUser.mockResolvedValue(mockPurchases);

      const result = await purchaseService.getPurchaseHistory(
        userId,
        page,
        limit
      );

      expect(PurchaseModel.findByUser).toHaveBeenCalledWith(userId, 1, 10);
      expect(result).toEqual(mockPurchases);
    });

    it("should handle invalid pagination parameters", async () => {
      const userId = 1;
      const page = "invalid";
      const limit = "invalid";

      const mockPurchases = {
        purchases: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      PurchaseModel.findByUser.mockResolvedValue(mockPurchases);

      const result = await purchaseService.getPurchaseHistory(
        userId,
        page,
        limit
      );

      // Should default to page=1, limit=10
      expect(PurchaseModel.findByUser).toHaveBeenCalledWith(userId, 1, 10);
    });
  });

  describe("getPurchaseById", () => {
    it("should return complete purchase details for authorized user", async () => {
      const purchaseId = 1;
      const userId = 1;
      const userRole = "user";

      const mockPurchase = {
        id: 1,
        user_id: userId,
        order_number: "ORD-123456",
        total_amount: 100,
        status: "completed",
      };

      const mockItems = [
        {
          id: 1,
          purchase_id: 1,
          event_id: 1,
          ticket_type_id: 1,
          quantity: 2,
          unit_price: 50,
        },
      ];

      const mockEvent = {
        id: 1,
        title: "Test Event",
        date: "2025-06-01",
        location: "Test Location",
      };

      const mockTickets = [
        {
          id: 1,
          purchase_id: 1,
          event_id: 1,
          status: "active",
        },
        {
          id: 2,
          purchase_id: 1,
          event_id: 1,
          status: "active",
        },
      ];

      PurchaseModel.findById.mockResolvedValue(mockPurchase);
      PurchaseModel.getItemsByPurchaseId.mockResolvedValue(mockItems);
      EventModel.findById.mockResolvedValue(mockEvent);
      PurchaseModel.findTicketsByPurchaseId.mockResolvedValue(mockTickets);

      const result = await purchaseService.getPurchaseById(
        purchaseId,
        userId,
        userRole
      );

      expect(PurchaseModel.findById).toHaveBeenCalledWith(purchaseId);
      expect(PurchaseModel.getItemsByPurchaseId).toHaveBeenCalledWith(
        purchaseId
      );
      expect(EventModel.findById).toHaveBeenCalledWith(1);
      expect(PurchaseModel.findTicketsByPurchaseId).toHaveBeenCalledWith(
        purchaseId
      );

      expect(result).toEqual({
        purchase: mockPurchase,
        items: mockItems,
        event: mockEvent,
        tickets: mockTickets,
      });
    });

    it("should allow admin to access any purchase", async () => {
      const purchaseId = 1;
      const userId = 2;
      const userRole = "admin";

      const mockPurchase = {
        id: 1,
        user_id: 1, // Different user
        order_number: "ORD-123456",
        total_amount: 100,
        status: "completed",
      };

      const mockItems = [];
      const mockTickets = [];

      PurchaseModel.findById.mockResolvedValue(mockPurchase);
      PurchaseModel.getItemsByPurchaseId.mockResolvedValue(mockItems);
      PurchaseModel.findTicketsByPurchaseId.mockResolvedValue(mockTickets);

      const result = await purchaseService.getPurchaseById(
        purchaseId,
        userId,
        userRole
      );

      expect(result).toHaveProperty("purchase", mockPurchase);
      expect(result).toHaveProperty("items", mockItems);
      expect(result).toHaveProperty("tickets", mockTickets);
    });

    it("should throw error for unauthorized access", async () => {
      const purchaseId = 1;
      const userId = 2;
      const userRole = "user";

      const mockPurchase = {
        id: 1,
        user_id: 1, // Different user
        order_number: "ORD-123456",
        total_amount: 100,
        status: "completed",
      };

      PurchaseModel.findById.mockResolvedValue(mockPurchase);

      await expect(
        purchaseService.getPurchaseById(purchaseId, userId, userRole)
      ).rejects.toThrow();
    });

    it("should throw error when purchase not found", async () => {
      const purchaseId = 999;
      const userId = 1;
      const userRole = "user";

      PurchaseModel.findById.mockResolvedValue(null);

      await expect(
        purchaseService.getPurchaseById(purchaseId, userId, userRole)
      ).rejects.toThrow("Purchase not found");
    });

    it("should handle purchase without event details", async () => {
      const purchaseId = 1;
      const userId = 1;
      const userRole = "user";

      const mockPurchase = {
        id: 1,
        user_id: userId,
        order_number: "ORD-123456",
        total_amount: 100,
        status: "completed",
      };

      const mockItems = []; // No items
      const mockTickets = [];

      PurchaseModel.findById.mockResolvedValue(mockPurchase);
      PurchaseModel.getItemsByPurchaseId.mockResolvedValue(mockItems);
      PurchaseModel.findTicketsByPurchaseId.mockResolvedValue(mockTickets);

      const result = await purchaseService.getPurchaseById(
        purchaseId,
        userId,
        userRole
      );

      expect(result).toEqual({
        purchase: mockPurchase,
        items: mockItems,
        event: null,
        tickets: mockTickets,
      });
    });
  });
});
