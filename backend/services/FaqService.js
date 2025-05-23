// backend/services/FaqService.js
import { BaseService } from './BaseService.js';
import * as FaqModel from '../models/Faq.js';

export class FaqService extends BaseService {
  async getAllFAQs() {
    return FaqModel.getAllFAQs();
  }

  async getFAQById(id) {
    return FaqModel.getFAQById(id);
  }

  async createFAQ(faqData) {
    return this.executeInTransaction(async (client) => {
      return FaqModel.createFAQ(faqData, client);
    });
  }

  async updateFAQ(id, faqData) {
    return this.executeInTransaction(async (client) => {
      return FaqModel.updateFAQ(id, faqData, client);
    });
  }

  async deleteFAQ(id) {
    return this.executeInTransaction(async (client) => {
      return FaqModel.deleteFAQ(id, client);
    });
  }

  async updateFAQOrder(orderData) {
    return this.executeInTransaction(async (client) => {
      return FaqModel.updateOrder(orderData, client);
    });
  }
}