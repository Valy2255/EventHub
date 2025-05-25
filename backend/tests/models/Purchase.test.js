// backend/tests/models/Purchase.test.js
import { jest } from "@jest/globals";

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule("../../config/db.js", () => ({
  query: mockDbQuery,
}));

describe("Purchase Model", () => {
  let Purchase;
  let consoleSpy, consoleErrorSpy;
  let mockGlobalPool;

  beforeAll(async () => {
    // Mock global.pool before importing
    mockGlobalPool = {
      connect: jest.fn(),
      query: jest.fn(),
    };
    global.pool = mockGlobalPool;

    Purchase = await import("../../models/Purchase.js");
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

  afterAll(() => {
    delete global.pool;
  });

  describe("findByUser", () => {
    it("should find purchases by user with pagination", async () => {
      const mockPurchases = [
        {
          id: 1,
          user_id: 1,
          total: 99.99,
          event_name: "Concert Night",
          event_image: "concert.jpg",
          total_count: "2",
          created_at: "2024-03-15T10:00:00Z",
        },
        {
          id: 2,
          user_id: 1,
          total: 49.99,
          event_name: "Sports Event",
          event_image: "sports.jpg",
          total_count: "2",
          created_at: "2024-03-14T10:00:00Z",
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockPurchases });

      const result = await Purchase.findByUser(1, 1, 10);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /SELECT p\.\*.*FROM purchases p.*WHERE p\.user_id = \$1.*ORDER BY p\.created_at DESC.*LIMIT \$2 OFFSET \$3/s
        ),
        values: [1, 10, 0],
      });

      expect(result).toEqual({
        purchases: [
          {
            id: 1,
            user_id: 1,
            total: 99.99,
            event_name: "Concert Night",
            event_image: "concert.jpg",
            created_at: "2024-03-15T10:00:00Z",
          },
          {
            id: 2,
            user_id: 1,
            total: 49.99,
            event_name: "Sports Event",
            event_image: "sports.jpg",
            created_at: "2024-03-14T10:00:00Z",
          },
        ],
        pagination: {
          total: 2,
          totalPages: 1,
          currentPage: 1,
          hasMore: false,
        },
      });
    });

    it("should handle pagination with multiple pages", async () => {
      const mockPurchases = [{ id: 1, user_id: 1, total_count: "25" }];

      mockDbQuery.mockResolvedValue({ rows: mockPurchases });

      const result = await Purchase.findByUser(1, 2, 10);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: [1, 10, 10], // page 2, offset = (2-1) * 10 = 10
      });

      expect(result.pagination).toEqual({
        total: 25,
        totalPages: 3,
        currentPage: 2,
        hasMore: true,
      });
    });

    it("should return empty result for user with no purchases", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Purchase.findByUser(999);

      expect(result).toEqual({
        purchases: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: 1,
          hasMore: false,
        },
      });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      await expect(Purchase.findByUser(1)).rejects.toThrow("Database error");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error finding purchases by user ID:",
        error
      );
    });

    it("should use default pagination parameters", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await Purchase.findByUser(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: [1, 10, 0], // default page=1, limit=10
      });
    });
  });

  describe("findById", () => {
    it("should find purchase by ID", async () => {
      const mockPurchase = {
        id: 1,
        user_id: 1,
        total: 99.99,
        order_id: "ORD-123",
      };

      mockDbQuery.mockResolvedValue({ rows: [mockPurchase] });

      const result = await Purchase.findById(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /SELECT\s+\*\s+FROM\s+purchases\s+WHERE\s+id\s*=\s*\$1/
        ),
        values: [1],
      });

      expect(result).toEqual(mockPurchase);
    });

    it("should return null for null or undefined ID", async () => {
      const result1 = await Purchase.findById(null);
      const result2 = await Purchase.findById(undefined);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Purchase ID is null or undefined"
      );
    });

    it("should return null for invalid ID", async () => {
      const result = await Purchase.findById("invalid");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Invalid purchase ID: invalid");
    });

    it("should convert string ID to integer", async () => {
      const mockPurchase = { id: 123 };
      mockDbQuery.mockResolvedValue({ rows: [mockPurchase] });

      const result = await Purchase.findById("123");

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /SELECT\s+\*\s+FROM\s+purchases\s+WHERE\s+id\s*=\s*\$1/
        ),
        values: [123],
      });

      expect(result).toEqual(mockPurchase);
    });

    it("should return null when purchase not found", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Purchase.findById(999);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      await expect(Purchase.findById(1)).rejects.toThrow("Database error");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in Purchase.findById:",
        error
      );
    });
  });

  describe("getItemsByPurchaseId", () => {
    it("should get items by purchase ID", async () => {
      const mockItems = [
        {
          id: 1,
          purchase_id: 1,
          ticket_type_id: 1,
          quantity: 2,
          price: 50.0,
          ticket_type_name: "VIP",
          event_id: 1,
        },
        {
          id: 2,
          purchase_id: 1,
          ticket_type_id: 2,
          quantity: 1,
          price: 25.0,
          ticket_type_name: "General",
          event_id: 1,
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockItems });

      const result = await Purchase.getItemsByPurchaseId(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /SELECT pi\.\*.*FROM purchase_items pi.*WHERE pi\.purchase_id = \$1/s
        ),
        values: [1],
      });
      expect(result).toEqual(mockItems);
    });

    it("should return empty array for purchase with no items", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Purchase.getItemsByPurchaseId(999);

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      await expect(Purchase.getItemsByPurchaseId(1)).rejects.toThrow(
        "Database error"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error getting purchase items:",
        error
      );
    });
  });

  describe("createPurchase", () => {
    const mockPurchaseData = {
      user_id: 1,
      order_id: "ORD-123",
      total: 125.0,
      subtotal: 100.0,
      discounts: 0,
      payment_method: "credit",
      payment_status: "completed",
    };

    const mockItems = [
      { ticket_type_id: 1, quantity: 2, price: 50.0 },
      { ticket_type_id: 2, quantity: 1, price: 25.0 },
    ];

    it("should create purchase with items using provided client", async () => {
      const mockClient = {
        query: jest.fn(),
      };
      const mockCreated = { id: 1, ...mockPurchaseData };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockCreated] }) // INSERT purchase
        .mockResolvedValueOnce({}) // INSERT item 1
        .mockResolvedValueOnce({}); // INSERT item 2

      const result = await Purchase.createPurchase(
        mockClient,
        mockPurchaseData,
        mockItems
      );

      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /INSERT INTO purchases.*VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9\).*RETURNING \*/s
        ),
        values: [
          1,
          "ORD-123",
          125.0,
          100.0,
          0,
          "credit",
          "completed",
          expect.any(Date),
          expect.any(String),
        ],
      });

      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /INSERT INTO purchase_items.*VALUES \(\$1, \$2, \$3, \$4\)/s
        ),
        values: [1, 1, 2, 50.0],
      });

      expect(result).toEqual(mockCreated);
    });

    it("should create purchase without client (manage own connection)", async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      const mockCreated = { id: 1, ...mockPurchaseData };

      mockGlobalPool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockCreated] }) // INSERT purchase
        .mockResolvedValueOnce({}) // INSERT first item
        .mockResolvedValueOnce({}) // INSERT second item
        .mockResolvedValueOnce({}); // COMMIT

      const result = await Purchase.createPurchase(
        null,
        mockPurchaseData,
        mockItems
      );

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it("should generate default order_id when not provided", async () => {
      const mockClient = { query: jest.fn() };
      const dataWithoutOrderId = { ...mockPurchaseData };
      delete dataWithoutOrderId.order_id;

      const mockCreated = { id: 1, order_id: "ORDER-1234567890" };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      await Purchase.createPurchase(mockClient, dataWithoutOrderId, mockItems);

      const callArgs = mockClient.query.mock.calls[0][0].values;
      expect(callArgs[1]).toMatch(/^ORDER-\d+$/);
    });

    it("should rollback on error when managing own connection", async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      const error = new Error("Insert failed");

      mockGlobalPool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(error) // INSERT purchase fails
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(
        Purchase.createPurchase(null, mockPurchaseData, mockItems)
      ).rejects.toThrow("Insert failed");

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating purchase:",
        error
      );
    });

    it("should use default values for optional fields", async () => {
      const mockClient = { query: jest.fn() };
      const minimalData = {
        user_id: 1,
        total: 100.0,
        subtotal: 100.0,
      };
      const mockCreated = { id: 1, ...minimalData };
      mockClient.query.mockResolvedValue({ rows: [mockCreated] });

      await Purchase.createPurchase(mockClient, minimalData, []);

      const callArgs = mockClient.query.mock.calls[0][0].values;
      expect(callArgs[4]).toBe(0); // discounts default
      expect(callArgs[5]).toBe("credit"); // payment_method default
      expect(callArgs[6]).toBe("completed"); // payment_status default
    });
  });

  describe("findTicketsByPurchaseId", () => {
    it("should find tickets by purchase ID", async () => {
      const mockTickets = [
        {
          id: 1,
          purchase_id: 1,
          ticket_type_name: "VIP",
          status: "purchased",
        },
        {
          id: 2,
          purchase_id: 1,
          ticket_type_name: "General",
          status: "purchased",
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockTickets });

      const result = await Purchase.findTicketsByPurchaseId(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /SELECT t\.\*.*FROM tickets t.*WHERE t\.purchase_id = \$1/s
        ),
        values: [1],
      });
      expect(result).toEqual(mockTickets);
    });

    it("should return empty array for purchase with no tickets", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Purchase.findTicketsByPurchaseId(999);

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      await expect(Purchase.findTicketsByPurchaseId(1)).rejects.toThrow(
        "Database error"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error finding tickets by purchase ID:",
        error
      );
    });
  });

  describe("findByPaymentId", () => {
    it("should find purchase by payment ID", async () => {
      const mockPurchase = {
        id: 1,
        user_id: 1,
        total: 99.99,
        order_id: "ORD-123",
      };

      mockDbQuery.mockResolvedValue({ rows: [mockPurchase] });

      const result = await Purchase.findByPaymentId(1);

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.stringMatching(
          /SELECT DISTINCT p\.\*.*FROM purchases p.*JOIN tickets t ON t\.purchase_id = p\.id.*JOIN payment_tickets pt ON pt\.ticket_id = t\.id.*WHERE pt\.payment_id = \$1/s
        ),
        values: [1],
      });
      expect(result).toEqual(mockPurchase);
    });

    it("should return null for null or undefined payment ID", async () => {
      const result1 = await Purchase.findByPaymentId(null);
      const result2 = await Purchase.findByPaymentId(undefined);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Payment ID is null or undefined"
      );
    });

    it("should return null for invalid payment ID", async () => {
      const result = await Purchase.findByPaymentId("invalid");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Invalid payment ID: invalid");
    });

    it("should convert string payment ID to integer", async () => {
      const mockPurchase = { id: 1 };
      mockDbQuery.mockResolvedValue({ rows: [mockPurchase] });

      const result = await Purchase.findByPaymentId("123");

      expect(mockDbQuery).toHaveBeenCalledWith({
        text: expect.any(String),
        values: [123],
      });
      expect(result).toEqual(mockPurchase);
    });

    it("should return null when no purchase found", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await Purchase.findByPaymentId(999);

      expect(result).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      const result = await Purchase.findByPaymentId(1);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in Purchase.findByPaymentId:",
        error
      );
    });
  });
});
