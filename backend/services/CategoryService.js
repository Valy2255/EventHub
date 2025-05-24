// backend/services/CategoryService.js
import { BaseService } from "./BaseService.js";
import * as CategoryModel from "../models/Category.js";
import * as SubcategoryModel from "../models/Subcategory.js";

export class CategoryService extends BaseService {
  async getAllCategories() {
    return CategoryModel.getAll();
  }

  async getCategoryById(id) {
    return CategoryModel.findById(id);
  }

  async createCategory(categoryData) {
    return this.executeInTransaction(async (client) => {
      return CategoryModel.create(categoryData, client);
    });
  }

  async updateCategory(id, categoryData) {
    return this.executeInTransaction(async (client) => {
      return CategoryModel.update(id, categoryData, client);
    });
  }

  async deleteCategory(id) {
    return this.executeInTransaction(async (client) => {
      return CategoryModel.remove(id, client);
    });
  }

  async getAllCategoriesWithSubcategories() {
    // Get categories with event counts
    const categories = await CategoryModel.getAllWithEventCounts();

    // Get total events count
    const totalEvents = await CategoryModel.getTotalEventsCount();

    // For each category, get subcategories with event counts
    const categoriesWithSubcategories = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await SubcategoryModel.getAllWithEventCounts(
          category.id
        );
        return {
          ...category,
          subcategories,
        };
      })
    );

    return {
      categories: categoriesWithSubcategories,
      totalEvents,
      count: categories.length,
    };
  }

  async getEventsByCategory(slug) {
    // Find category by slug
    const category = await CategoryModel.findBySlug(slug);

    if (!category) {
      throw new Error("Category not found");
    }

    // Get all events from this category
    const events = await CategoryModel.getEvents(category.id);

    return {
      category,
      events,
    };
  }

  async getEventsBySubcategory(categorySlug, subcategorySlug) {
    // Find category by slug
    const category = await CategoryModel.findBySlug(categorySlug);

    if (!category) {
      throw new Error("Category not found");
    }

    // Find subcategory by slug and category_id
    const subcategory = await SubcategoryModel.findBySlug(
      category.id,
      subcategorySlug
    );

    if (!subcategory) {
      throw new Error("Subcategory not found");
    }

    // Get all events from this subcategory
    const events = await SubcategoryModel.getEvents(subcategory.id);
    const totalCount = events.length;

    return {
      category,
      subcategory,
      events,
      totalCount,
    };
  }

  async getCategoryBySlug(slug) {
    const category = await CategoryModel.findBySlug(slug);
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  }

  async getFeaturedEventsByCategory(slug) {
    const category = await CategoryModel.findBySlug(slug);
    if (!category) {
      throw new Error("Category not found");
    }
    const events = await CategoryModel.getFeaturedEvents(category.id);
    return { events };
  }

  async getEventsByCategoryPaginated(slug, page = 1, limit = 20) {
    const category = await CategoryModel.findBySlug(slug);
    if (!category) {
      throw new Error("Category not found");
    }

    const offset = (page - 1) * limit;
    const { events, totalCount } = await CategoryModel.getEventsPaginated(
      category.id,
      limit,
      offset
    );
    const totalPages = Math.ceil(totalCount / limit);

    return {
      events,
      totalPages,
      totalCount,
    };
  }

  async getSubcategoriesForCategory(slug) {
    // Check if category exists
    const category = await CategoryModel.findBySlug(slug);
    if (!category) {
      throw new Error("Category not found");
    }

    // Fetch subcategories for this category
    const subcategories = await SubcategoryModel.getAll(category.id);

    return { subcategories };
  }

  async getUpcomingEvents(limit = 6) {
    const events = await CategoryModel.getUpcomingEvents(limit);

    return {
      events,
      count: events.length,
    };
  }
}
