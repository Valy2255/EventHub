// backend/services/LegalDocumentService.js
import { BaseService } from './BaseService.js';
import * as legalDocumentModel from '../models/LegalDocument.js';

export class LegalDocumentService extends BaseService {
  async getActiveDocument(documentType) {
    return legalDocumentModel.getActiveDocument(documentType);
  }

  async getAllVersions(documentType) {
    return legalDocumentModel.getAllVersions(documentType);
  }

  async getDocumentById(id) {
    return legalDocumentModel.getDocumentById(id);
  }

  async createDocument(documentData) {
    return this.executeInTransaction(async (client) => {
      return legalDocumentModel.createDocument(documentData, client);
    });
  }

  async updateDocument(id, updateData) {
    return this.executeInTransaction(async (client) => {
      return legalDocumentModel.updateDocument(id, updateData, client);
    });
  }

  async deleteDocument(id) {
    return this.executeInTransaction(async (client) => {
      return legalDocumentModel.deleteDocument(id, client);
    });
  }
}
