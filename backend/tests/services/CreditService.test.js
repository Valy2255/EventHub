import { jest } from "@jest/globals";

// Mock models
jest.unstable_mockModule("../../models/User.js", () => ({
  getCreditBalance: jest.fn(),
  getCreditTransactions: jest.fn(),
}));

jest.unstable_mockModule("../../models/Purchase.js", () => ({
  findByPaymentId: jest.fn(),
}));

jest.unstable_mockModule("../../config/db.js", () => ({
  query: jest.fn(),
}));

describe("CreditService", () => {
  let CreditService;
  let UserModel;
  let PurchaseModel;
  let db;
  let creditService;

  beforeAll(async () => {
    UserModel = await import("../../models/User.js");
    PurchaseModel = await import("../../models/Purchase.js");
    db = await import("../../config/db.js");
    const { CreditService: CreditServiceClass } = await import(
      "../../services/CreditService.js"
    );
    CreditService = CreditServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    creditService = new CreditService();
  });

  describe("getCreditBalance", () => {
    it("should return user credit balance", async () => {
      const userId = 1;
      const mockBalance = 100.5;

      UserModel.getCreditBalance.mockResolvedValue(mockBalance);

      const result = await creditService.getCreditBalance(userId);

      expect(UserModel.getCreditBalance).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockBalance);
    });

    it("should return 0 for null balance", async () => {
      const userId = 1;

      UserModel.getCreditBalance.mockResolvedValue(null);

      const result = await creditService.getCreditBalance(userId);

      expect(result).toBe(null);
    });
  });

  describe("getCreditHistory", () => {
    it("should return formatted credit history with pagination", async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;

      const mockTransactions = [
        {
          id: 1,
          amount: "-25.00", // Changed to negative for purchase (credits deducted)
          type: "purchase",
          created_at: "2024-01-01T10:00:00Z",
          reference_type: "payment",
          reference_id: "pay_123",
        },
        {
          id: 2,
          amount: "50.00", // Positive for refund (credits added)
          type: "refund",
          created_at: "2024-01-02T14:30:00Z",
          reference_type: "refund",
          reference_id: "ref_456",
        },
      ];

      const mockPurchase = { id: 1 };

      UserModel.getCreditTransactions.mockResolvedValue(mockTransactions);
      PurchaseModel.findByPaymentId.mockResolvedValue(mockPurchase);
      db.query.mockResolvedValue({ rows: [{ count: "2" }] });

      const result = await creditService.getCreditHistory(userId, page, limit);

      expect(UserModel.getCreditTransactions).toHaveBeenCalledWith(
        userId,
        10,
        0
      );
      expect(db.query).toHaveBeenCalledWith({
        text: "SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1",
        values: [userId],
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]).toMatchObject({
        id: 1,
        amount: -25.0, // Updated expected amount
        typeLabel: "Purchase",
        actionText: "Credits used for purchase",
        isAddition: false, // Now correctly false for negative amount
      });
      expect(result.transactions[1]).toMatchObject({
        id: 2,
        amount: 50.0,
        typeLabel: "Refund",
        actionText: "Credits received from refund",
        isAddition: true,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasMore: false,
      });
    });

    it("should handle invalid pagination parameters", async () => {
      const userId = 1;
      const page = "invalid";
      const limit = "invalid";

      UserModel.getCreditTransactions.mockResolvedValue([]);
      db.query.mockResolvedValue({ rows: [{ count: "0" }] });

      const result = await creditService.getCreditHistory(userId, page, limit);

      // Should default to page=1, limit=10
      expect(UserModel.getCreditTransactions).toHaveBeenCalledWith(
        userId,
        10,
        0
      );
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it("should format different transaction types correctly", async () => {
      const userId = 1;
      const mockTransactions = [
        {
          id: 1,
          amount: "-25.00",
          type: "exchange_payment",
          created_at: "2024-01-01T10:00:00Z",
          reference_type: "exchange",
          reference_id: "ex_123",
        },
        {
          id: 2,
          amount: "100.00",
          type: "admin_adjustment",
          created_at: "2024-01-02T14:30:00Z",
          reference_type: "admin",
          reference_id: null,
        },
        {
          id: 3,
          amount: "50.00",
          type: "exchange_refund",
          created_at: "2024-01-03T16:00:00Z",
          reference_type: "exchange",
          reference_id: "ex_456",
        },
      ];

      UserModel.getCreditTransactions.mockResolvedValue(mockTransactions);
      db.query.mockResolvedValue({ rows: [{ count: "3" }] });

      const result = await creditService.getCreditHistory(userId, 1, 10);

      expect(result.transactions[0]).toMatchObject({
        typeLabel: "Ticket Upgrade",
        actionText: "Credits used for ticket upgrade",
        isAddition: false,
      });
      expect(result.transactions[1]).toMatchObject({
        typeLabel: "Admin Adjustment",
        actionText: "Credits added by administrator",
        isAddition: true,
      });
      expect(result.transactions[2]).toMatchObject({
        typeLabel: "Exchange Refund",
        actionText: "Credits received from ticket exchange",
        isAddition: true,
      });
    });

    it("should handle pagination with multiple pages", async () => {
      const userId = 1;
      const page = 2;
      const limit = 5;

      const mockTransactions = [
        {
          id: 6,
          amount: "30.00",
          type: "bonus",
          created_at: "2024-01-06T10:00:00Z",
          reference_type: "bonus",
          reference_id: null,
        },
      ];

      UserModel.getCreditTransactions.mockResolvedValue(mockTransactions);
      db.query.mockResolvedValue({ rows: [{ count: "12" }] });

      const result = await creditService.getCreditHistory(userId, page, limit);

      expect(UserModel.getCreditTransactions).toHaveBeenCalledWith(
        userId,
        5,
        5
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        totalPages: 3,
        hasMore: false,
      });
    });

    it("should handle error when finding purchase by payment ID", async () => {
      const userId = 1;
      const mockTransactions = [
        {
          id: 1,
          amount: "25.00",
          type: "purchase",
          created_at: "2024-01-01T10:00:00Z",
          reference_type: "payment",
          reference_id: "pay_123",
        },
      ];

      UserModel.getCreditTransactions.mockResolvedValue(mockTransactions);
      PurchaseModel.findByPaymentId.mockRejectedValue(
        new Error("Database error")
      );
      db.query.mockResolvedValue({ rows: [{ count: "1" }] });

      const result = await creditService.getCreditHistory(userId, 1, 10);

      expect(result.transactions[0]).not.toHaveProperty("purchase_id");
      expect(result.transactions[0].typeLabel).toBe("Purchase");
    });
  });

  describe("getCreditTransactionCount", () => {
    it("should return total count of credit transactions", async () => {
      const userId = 1;
      const expectedCount = 15;

      db.query.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
      });

      const result = await creditService.getCreditTransactionCount(userId);

      expect(db.query).toHaveBeenCalledWith({
        text: "SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1",
        values: [userId],
      });
      expect(result).toBe(expectedCount);
    });
  });
});
