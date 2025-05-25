// tests/services/FaqService.test.js
import { jest } from "@jest/globals";

// Mock models using unstable_mockModule
jest.unstable_mockModule("../../models/Faq.js", () => ({
  getAllFAQs: jest.fn(),
  createFAQ: jest.fn(),
  updateFAQ: jest.fn(),
  deleteFAQ: jest.fn(),
  getFAQById: jest.fn(),
  updateOrder: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule("../../services/BaseService.js", () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  },
}));

describe("FaqService", () => {
  let FaqService;
  let FaqModel;
  let faqService;

  beforeAll(async () => {
    FaqModel = await import("../../models/Faq.js");
    const { FaqService: FaqServiceClass } = await import(
      "../../services/FaqService.js"
    );
    FaqService = FaqServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    faqService = new FaqService();
  });

  describe("getAllFAQs", () => {
    it("should return all FAQs", async () => {
      const mockFaqs = [
        {
          id: 1,
          question: "What is this?",
          answer: "This is a test",
          category: "general",
        },
        {
          id: 2,
          question: "How to register?",
          answer: "Click sign up",
          category: "account",
        },
      ];

      FaqModel.getAllFAQs.mockResolvedValue(mockFaqs);

      const result = await faqService.getAllFAQs();

      expect(FaqModel.getAllFAQs).toHaveBeenCalledWith();
      expect(result).toEqual(mockFaqs);
    });

    it("should return empty array when no FAQs exist", async () => {
      FaqModel.getAllFAQs.mockResolvedValue([]);

      const result = await faqService.getAllFAQs();

      expect(result).toEqual([]);
    });
  });

  describe("getFAQById", () => {
    it("should return FAQ by ID", async () => {
      const mockFaq = {
        id: 1,
        question: "Test question?",
        answer: "Test answer",
      };

      FaqModel.getFAQById.mockResolvedValue(mockFaq);

      const result = await faqService.getFAQById(1);

      expect(FaqModel.getFAQById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFaq);
    });

    it("should return null if FAQ not found", async () => {
      FaqModel.getFAQById.mockResolvedValue(null);

      const result = await faqService.getFAQById(999);

      expect(FaqModel.getFAQById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe("createFAQ", () => {
    it("should create FAQ successfully", async () => {
      const faqData = {
        question: "New question?",
        answer: "New answer",
        category: "general",
        order_index: 1,
      };
      const createdFaq = { id: 1, ...faqData };

      FaqModel.createFAQ.mockResolvedValue(createdFaq);

      const result = await faqService.createFAQ(faqData);

      expect(FaqModel.createFAQ).toHaveBeenCalledWith(faqData, undefined);
      expect(result).toEqual(createdFaq);
    });

    it("should handle database errors during creation", async () => {
      const faqData = { question: "Test?", answer: "Test answer" };

      FaqModel.createFAQ.mockRejectedValue(new Error("Database error"));

      await expect(faqService.createFAQ(faqData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("updateFAQ", () => {
    it("should update FAQ successfully", async () => {
      const faqId = 1;
      const updateData = {
        question: "Updated question?",
        answer: "Updated answer",
      };
      const updatedFaq = { id: faqId, ...updateData };

      FaqModel.updateFAQ.mockResolvedValue(updatedFaq);

      const result = await faqService.updateFAQ(faqId, updateData);

      expect(FaqModel.updateFAQ).toHaveBeenCalledWith(
        faqId,
        updateData,
        undefined
      );
      expect(result).toEqual(updatedFaq);
    });

    it("should return null if FAQ not found for update", async () => {
      FaqModel.updateFAQ.mockResolvedValue(null);

      const result = await faqService.updateFAQ(999, {});

      expect(FaqModel.updateFAQ).toHaveBeenCalledWith(999, {}, undefined);
      expect(result).toBeNull();
    });

    it("should handle database errors during update", async () => {
      FaqModel.updateFAQ.mockRejectedValue(new Error("Update failed"));

      await expect(faqService.updateFAQ(1, {})).rejects.toThrow(
        "Update failed"
      );
    });
  });

  describe("deleteFAQ", () => {
    it("should delete FAQ successfully", async () => {
      const faqId = 1;
      const deleteResult = { id: faqId };

      FaqModel.deleteFAQ.mockResolvedValue(deleteResult);

      const result = await faqService.deleteFAQ(faqId);

      expect(FaqModel.deleteFAQ).toHaveBeenCalledWith(faqId, undefined);
      expect(result).toEqual(deleteResult);
    });

    it("should return null if FAQ not found for deletion", async () => {
      FaqModel.deleteFAQ.mockResolvedValue(null);

      const result = await faqService.deleteFAQ(999);

      expect(FaqModel.deleteFAQ).toHaveBeenCalledWith(999, undefined);
      expect(result).toBeNull();
    });

    it("should handle database errors during deletion", async () => {
      FaqModel.deleteFAQ.mockRejectedValue(new Error("Delete failed"));

      await expect(faqService.deleteFAQ(1)).rejects.toThrow("Delete failed");
    });
  });

  describe("updateFAQOrder", () => {
    it("should update FAQ order successfully", async () => {
      const orderData = [
        { id: 1, order_index: 1 },
        { id: 2, order_index: 2 },
      ];
      const updateResult = { success: true };

      FaqModel.updateOrder.mockResolvedValue(updateResult);

      const result = await faqService.updateFAQOrder(orderData);

      expect(FaqModel.updateOrder).toHaveBeenCalledWith(orderData, undefined);
      expect(result).toEqual(updateResult);
    });

    it("should handle errors during order update", async () => {
      const orderData = [{ id: 1, order_index: 1 }];

      FaqModel.updateOrder.mockRejectedValue(new Error("Order update failed"));

      await expect(faqService.updateFAQOrder(orderData)).rejects.toThrow(
        "Order update failed"
      );
    });
  });
});
