import { jest } from "@jest/globals";

// Mock models using unstable_mockModule
jest.unstable_mockModule("../../models/Category.js", () => ({
  findBySlug: jest.fn(),
  getEvents: jest.fn(),
  getAllWithEventCounts: jest.fn(),
  getTotalEventsCount: jest.fn(),
}));

jest.unstable_mockModule("../../models/Subcategory.js", () => ({
  findBySlug: jest.fn(),
  getEvents: jest.fn(),
  getAllWithEventCounts: jest.fn(),
}));

describe("CategoryService", () => {
  let CategoryService;
  let CategoryModel;
  let SubcategoryModel;
  let categoryService;

  beforeAll(async () => {
    CategoryModel = await import("../../models/Category.js");
    SubcategoryModel = await import("../../models/Subcategory.js");
    const { CategoryService: CategoryServiceClass } = await import(
      "../../services/CategoryService.js"
    );
    CategoryService = CategoryServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    categoryService = new CategoryService();
  });

  describe("getAllCategoriesWithSubcategories", () => {
    it("should return categories with subcategories and event counts", async () => {
      const mockCategories = [
        { id: 1, name: "Music", slug: "music", event_count: 10 },
        { id: 2, name: "Sports", slug: "sports", event_count: 5 },
      ];
      const mockSubcategories = [
        { id: 1, name: "Rock", slug: "rock", event_count: 5 },
        { id: 2, name: "Jazz", slug: "jazz", event_count: 5 },
      ];

      CategoryModel.getAllWithEventCounts.mockResolvedValue(mockCategories);
      CategoryModel.getTotalEventsCount.mockResolvedValue(15);
      SubcategoryModel.getAllWithEventCounts.mockResolvedValue(
        mockSubcategories
      );

      const result = await categoryService.getAllCategoriesWithSubcategories();

      expect(CategoryModel.getAllWithEventCounts).toHaveBeenCalled();
      expect(CategoryModel.getTotalEventsCount).toHaveBeenCalled();
      expect(SubcategoryModel.getAllWithEventCounts).toHaveBeenCalledTimes(2);
      expect(result.totalEvents).toBe(15);
      expect(result.count).toBe(2);
      expect(result.categories[0].subcategories).toEqual(mockSubcategories);
    });
  });

  describe("getEventsByCategory", () => {
    it("should return events for a category", async () => {
      const slug = "music";
      const mockCategory = { id: 1, name: "Music", slug };
      const mockEvents = [
        { id: 1, name: "Concert 1" },
        { id: 2, name: "Concert 2" },
      ];

      CategoryModel.findBySlug.mockResolvedValue(mockCategory);
      CategoryModel.getEvents.mockResolvedValue(mockEvents);

      const result = await categoryService.getEventsByCategory(slug);

      expect(CategoryModel.findBySlug).toHaveBeenCalledWith(slug);
      expect(CategoryModel.getEvents).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual({ category: mockCategory, events: mockEvents });
    });

    it("should throw error if category not found", async () => {
      CategoryModel.findBySlug.mockResolvedValue(null);

      await expect(
        categoryService.getEventsByCategory("invalid")
      ).rejects.toThrow("Category not found");
    });
  });

  describe("getEventsBySubcategory", () => {
    it("should return events for a subcategory", async () => {
      const categorySlug = "music";
      const subcategorySlug = "rock";
      const mockCategory = { id: 1, name: "Music", slug: categorySlug };
      const mockSubcategory = { id: 1, name: "Rock", slug: subcategorySlug };
      const mockEvents = [
        { id: 1, name: "Rock Concert 1" },
        { id: 2, name: "Rock Concert 2" },
      ];

      CategoryModel.findBySlug.mockResolvedValue(mockCategory);
      SubcategoryModel.findBySlug.mockResolvedValue(mockSubcategory);
      SubcategoryModel.getEvents.mockResolvedValue(mockEvents);

      const result = await categoryService.getEventsBySubcategory(
        categorySlug,
        subcategorySlug
      );

      expect(CategoryModel.findBySlug).toHaveBeenCalledWith(categorySlug);
      expect(SubcategoryModel.findBySlug).toHaveBeenCalledWith(
        mockCategory.id,
        subcategorySlug
      );
      expect(SubcategoryModel.getEvents).toHaveBeenCalledWith(
        mockSubcategory.id
      );
      expect(result).toEqual({
        category: mockCategory,
        subcategory: mockSubcategory,
        events: mockEvents,
        totalCount: 2,
      });
    });

    it("should throw error if category not found", async () => {
      CategoryModel.findBySlug.mockResolvedValue(null);

      await expect(
        categoryService.getEventsBySubcategory("invalid", "rock")
      ).rejects.toThrow("Category not found");
    });

    it("should throw error if subcategory not found", async () => {
      const mockCategory = { id: 1, name: "Music", slug: "music" };
      CategoryModel.findBySlug.mockResolvedValue(mockCategory);
      SubcategoryModel.findBySlug.mockResolvedValue(null);

      await expect(
        categoryService.getEventsBySubcategory("music", "invalid")
      ).rejects.toThrow("Subcategory not found");
    });
  });
});
