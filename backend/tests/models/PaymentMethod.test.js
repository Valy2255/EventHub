// backend/tests/models/PaymentMethod.test.js
import { jest } from "@jest/globals";

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule("../../config/db.js", () => ({
  query: mockDbQuery,
}));

describe("PaymentMethod Model", () => {
  let PaymentMethod;
  let consoleSpy, consoleErrorSpy;

  beforeAll(async () => {
    PaymentMethod = await import("../../models/PaymentMethod.js");
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

  describe("findAllByUserId", () => {
    it("should find all payment methods for a user", async () => {
      const mockPaymentMethods = [
        {
          id: 1,
          user_id: 1,
          card_type: "visa",
          last_four: "1234",
          is_default: true,
          created_at: "2024-03-15T10:00:00Z",
        },
        {
          id: 2,
          user_id: 1,
          card_type: "mastercard",
          last_four: "5678",
          is_default: false,
          created_at: "2024-03-14T10:00:00Z",
        },
      ];

      mockDbQuery.mockResolvedValue({ rows: mockPaymentMethods });

      const result = await PaymentMethod.findAllByUserId(1);

      expect(mockDbQuery).toHaveBeenCalledWith(
        "SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
        [1]
      );
      expect(result).toEqual(mockPaymentMethods);
    });

    it("should return empty array for user with no payment methods", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PaymentMethod.findAllByUserId(999);

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      await expect(PaymentMethod.findAllByUserId(1)).rejects.toThrow(
        "Database error"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching payment methods:",
        error
      );
    });

    it("should order by is_default DESC, then created_at DESC", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await PaymentMethod.findAllByUserId(1);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY is_default DESC, created_at DESC"),
        [1]
      );
    });
  });

  describe("findById", () => {
    it("should find payment method by ID and user ID", async () => {
      const mockPaymentMethod = {
        id: 1,
        user_id: 1,
        card_type: "visa",
        last_four: "1234",
        is_default: true,
      };

      mockDbQuery.mockResolvedValue({ rows: [mockPaymentMethod] });

      const result = await PaymentMethod.findById(1, 1);

      expect(mockDbQuery).toHaveBeenCalledWith(
        "SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2",
        [1, 1]
      );
      expect(result).toEqual(mockPaymentMethod);
    });

    it("should return null for non-existent payment method", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PaymentMethod.findById(999, 1);

      expect(result).toBeNull();
    });

    it("should return null for payment method belonging to different user", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PaymentMethod.findById(1, 999);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      await expect(PaymentMethod.findById(1, 1)).rejects.toThrow(
        "Database error"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching payment method:",
        error
      );
    });
  });

  describe("create", () => {
    const mockPaymentMethodData = {
      userId: 1,
      cardType: "visa",
      lastFour: "1234",
      cardHolderName: "John Doe",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      token: "tok_123456",
    };

    it("should create a new payment method", async () => {
      const mockCreated = {
        id: 1,
        user_id: 1,
        card_type: "visa",
        last_four: "1234",
        card_holder_name: "John Doe",
        expiry_month: 12,
        expiry_year: 2025,
        is_default: true,
        token: "tok_123456",
      };

      mockDbQuery
        .mockResolvedValueOnce({}) // UPDATE existing defaults
        .mockResolvedValueOnce({ rows: [mockCreated] }); // INSERT new payment method

      const result = await PaymentMethod.create(mockPaymentMethodData);

      expect(mockDbQuery).toHaveBeenNthCalledWith(
        1, 
        "UPDATE payment_methods SET is_default = false WHERE user_id = $1",
        [1]
      );
      expect(mockDbQuery).toHaveBeenNthCalledWith(
        2, 
        "INSERT INTO payment_methods \n       (user_id, card_type, last_four, card_holder_name, expiry_month, expiry_year, is_default, token)\n       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n       RETURNING *",
        [1, "visa", "1234", "John Doe", 12, 2025, true, "tok_123456"]
      );
      expect(result).toEqual(mockCreated);
    });

    it("should not update existing defaults when isDefault is false", async () => {
      const nonDefaultData = { ...mockPaymentMethodData, isDefault: false };
      const mockCreated = { id: 1, is_default: false };

      mockDbQuery.mockResolvedValue({ rows: [mockCreated] });

      const result = await PaymentMethod.create(nonDefaultData);

      expect(mockDbQuery).toHaveBeenCalledTimes(1); // Only the INSERT, no UPDATE
      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO payment_methods"),
        expect.arrayContaining([
          1,
          "visa",
          "1234",
          "John Doe",
          12,
          2025,
          false,
          "tok_123456",
        ])
      );
      expect(result).toEqual(mockCreated);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockDbQuery.mockRejectedValue(error);

      await expect(PaymentMethod.create(mockPaymentMethodData)).rejects.toThrow(
        "Database error"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating payment method:",
        error
      );
    });
  });

  describe("update", () => {
    const mockUpdateData = {
      cardHolderName: "John Smith",
      expiryMonth: 11,
      expiryYear: 2026,
      isDefault: true,
    };

    it("should update a payment method", async () => {
      const mockUpdated = {
        id: 1,
        user_id: 1,
        card_holder_name: "John Smith",
        expiry_month: 11,
        expiry_year: 2026,
        is_default: true,
      };

      mockDbQuery
        .mockResolvedValueOnce({}) // UPDATE existing defaults
        .mockResolvedValueOnce({ rows: [mockUpdated] }); // UPDATE payment method

      const result = await PaymentMethod.update(1, 1, mockUpdateData);

      expect(mockDbQuery).toHaveBeenNthCalledWith(
        1, 
        "UPDATE payment_methods SET is_default = false WHERE user_id = $1",
        [1]
      );
      expect(mockDbQuery).toHaveBeenNthCalledWith(
        2, 
        "UPDATE payment_methods \n       SET card_holder_name = $1, \n           expiry_month = $2, \n           expiry_year = $3, \n           is_default = $4,\n           updated_at = CURRENT_TIMESTAMP\n       WHERE id = $5 AND user_id = $6\n       RETURNING *",
        ["John Smith", 11, 2026, true, 1, 1]
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should not update existing defaults when isDefault is false", async () => {
      const nonDefaultData = { ...mockUpdateData, isDefault: false };
      const mockUpdated = { id: 1, is_default: false };

      mockDbQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await PaymentMethod.update(1, 1, nonDefaultData);

      expect(mockDbQuery).toHaveBeenCalledTimes(1); // Only the UPDATE, no default reset
      expect(result).toEqual(mockUpdated);
    });

    it("should handle database errors", async () => {
      const error = new Error("Update failed");
      mockDbQuery.mockRejectedValue(error);

      await expect(PaymentMethod.update(1, 1, mockUpdateData)).rejects.toThrow(
        "Update failed"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error updating payment method:",
        error
      );
    });

    it("should return undefined when payment method not found", async () => {
      mockDbQuery
        .mockResolvedValueOnce({}) // UPDATE existing defaults succeeds
        .mockResolvedValueOnce({ rows: [] }); // UPDATE payment method returns no rows

      const result = await PaymentMethod.update(999, 1, mockUpdateData);

      expect(result).toBeUndefined();
    });
  });

  describe("setDefault", () => {
    it("should set payment method as default", async () => {
      const mockUpdated = {
        id: 1,
        user_id: 1,
        is_default: true,
      };

      mockDbQuery
        .mockResolvedValueOnce({}) // Unset all defaults
        .mockResolvedValueOnce({ rows: [mockUpdated] }); // Set new default

      const result = await PaymentMethod.setDefault(1, 1);

      expect(mockDbQuery).toHaveBeenCalledWith(
        "UPDATE payment_methods SET is_default = false WHERE user_id = $1",
        [1]
      );
      expect(mockDbQuery).toHaveBeenCalledWith(
        "UPDATE payment_methods SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *",
        [1, 1]
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should handle database errors", async () => {
      const error = new Error("Set default failed");
      mockDbQuery.mockRejectedValue(error);

      await expect(PaymentMethod.setDefault(1, 1)).rejects.toThrow(
        "Set default failed"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error setting default payment method:",
        error
      );
    });

    it("should return undefined when payment method not found", async () => {
      mockDbQuery
        .mockResolvedValueOnce({}) // Unset all defaults succeeds
        .mockResolvedValueOnce({ rows: [] }); // Set default returns no rows

      const result = await PaymentMethod.setDefault(999, 1);

      expect(result).toBeUndefined();
    });
  });

  describe("remove", () => {
    it("should remove a payment method", async () => {
      const mockRemoved = {
        id: 1,
        user_id: 1,
        card_type: "visa",
        last_four: "1234",
      };

      mockDbQuery.mockResolvedValue({ rows: [mockRemoved] });

      const result = await PaymentMethod.remove(1, 1);

      expect(mockDbQuery).toHaveBeenCalledWith(
        "DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING *",
        [1, 1]
      );
      expect(result).toEqual(mockRemoved);
    });

    it("should return undefined when payment method not found", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PaymentMethod.remove(999, 1);

      expect(result).toBeUndefined();
    });

    it("should not allow removing payment method belonging to another user", async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PaymentMethod.remove(1, 999);

      expect(result).toBeUndefined();
    });

    it("should handle database errors", async () => {
      const error = new Error("Delete failed");
      mockDbQuery.mockRejectedValue(error);

      await expect(PaymentMethod.remove(1, 1)).rejects.toThrow("Delete failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting payment method:",
        error
      );
    });
  });
});
