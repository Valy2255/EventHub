import { jest } from '@jest/globals';

// Mock models using unstable_mockModule
jest.unstable_mockModule('../../models/LegalDocument.js', () => ({
  getActiveDocument: jest.fn(),
  getAllVersions: jest.fn(),
  getDocumentById: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
}));

// Mock BaseService to avoid database connection issues
jest.unstable_mockModule('../../services/BaseService.js', () => ({
  BaseService: class MockBaseService {
    async executeInTransaction(callback) {
      return callback();
    }
  }
}));

describe('LegalDocumentService', () => {
  let LegalDocumentService;
  let legalDocumentModel;
  let legalDocumentService;

  beforeAll(async () => {
    legalDocumentModel = await import('../../models/LegalDocument.js');
    const { LegalDocumentService: LegalDocumentServiceClass } = await import('../../services/LegalDocumentService.js');
    LegalDocumentService = LegalDocumentServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    legalDocumentService = new LegalDocumentService();
  });

  describe('getActiveDocument', () => {
    it('should return active document by type', async () => {
      const mockDocument = { 
        id: 1, 
        type: 'privacy', 
        content: 'Privacy policy content',
        version: '1.0',
        is_active: true
      };

      legalDocumentModel.getActiveDocument.mockResolvedValue(mockDocument);

      const result = await legalDocumentService.getActiveDocument('privacy');

      expect(legalDocumentModel.getActiveDocument).toHaveBeenCalledWith('privacy');
      expect(result).toEqual(mockDocument);
    });

    it('should return null if no active document exists', async () => {
      legalDocumentModel.getActiveDocument.mockResolvedValue(null);

      const result = await legalDocumentService.getActiveDocument('nonexistent');

      expect(legalDocumentModel.getActiveDocument).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAllVersions', () => {
    it('should return all versions of a document type', async () => {
      const mockVersions = [
        { id: 1, type: 'terms', version: '1.0', is_active: false },
        { id: 2, type: 'terms', version: '1.1', is_active: true }
      ];

      legalDocumentModel.getAllVersions.mockResolvedValue(mockVersions);

      const result = await legalDocumentService.getAllVersions('terms');

      expect(legalDocumentModel.getAllVersions).toHaveBeenCalledWith('terms');
      expect(result).toEqual(mockVersions);
    });

    it('should return empty array if no versions exist', async () => {
      legalDocumentModel.getAllVersions.mockResolvedValue([]);

      const result = await legalDocumentService.getAllVersions('terms');

      expect(result).toEqual([]);
    });
  });

  describe('getDocumentById', () => {
    it('should return document by ID', async () => {
      const mockDocument = { 
        id: 1, 
        type: 'privacy', 
        content: 'Privacy content',
        version: '1.0'
      };

      legalDocumentModel.getDocumentById.mockResolvedValue(mockDocument);

      const result = await legalDocumentService.getDocumentById(1);

      expect(legalDocumentModel.getDocumentById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDocument);
    });

    it('should return null if document not found', async () => {
      legalDocumentModel.getDocumentById.mockResolvedValue(null);

      const result = await legalDocumentService.getDocumentById(999);

      expect(legalDocumentModel.getDocumentById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('createDocument', () => {
    it('should create document successfully', async () => {
      const documentData = { 
        type: 'terms', 
        content: 'Terms and conditions content',
        version: '1.0'
      };
      const createdDocument = { id: 1, ...documentData };

      legalDocumentModel.createDocument.mockResolvedValue(createdDocument);

      const result = await legalDocumentService.createDocument(documentData);

      expect(legalDocumentModel.createDocument).toHaveBeenCalledWith(documentData, undefined);
      expect(result).toEqual(createdDocument);
    });

    it('should handle database errors during creation', async () => {
      const documentData = { type: 'privacy', content: 'Privacy content' };

      legalDocumentModel.createDocument.mockRejectedValue(new Error('Database error'));

      await expect(legalDocumentService.createDocument(documentData))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      const documentId = 1;
      const updateData = { 
        content: 'Updated privacy policy content',
        version: '1.1'
      };
      const updatedDocument = { id: documentId, ...updateData };

      legalDocumentModel.updateDocument.mockResolvedValue(updatedDocument);

      const result = await legalDocumentService.updateDocument(documentId, updateData);

      expect(legalDocumentModel.updateDocument).toHaveBeenCalledWith(documentId, updateData, undefined);
      expect(result).toEqual(updatedDocument);
    });

    it('should return null if document not found for update', async () => {
      legalDocumentModel.updateDocument.mockResolvedValue(null);

      const result = await legalDocumentService.updateDocument(999, {});

      expect(legalDocumentModel.updateDocument).toHaveBeenCalledWith(999, {}, undefined);
      expect(result).toBeNull();
    });

    it('should handle database errors during update', async () => {
      legalDocumentModel.updateDocument.mockRejectedValue(new Error('Update failed'));

      await expect(legalDocumentService.updateDocument(1, {}))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const documentId = 1;
      const deleteResult = { id: documentId, deleted: true };

      legalDocumentModel.deleteDocument.mockResolvedValue(deleteResult);

      const result = await legalDocumentService.deleteDocument(documentId);

      expect(legalDocumentModel.deleteDocument).toHaveBeenCalledWith(documentId, undefined);
      expect(result).toEqual(deleteResult);
    });

    it('should return null if document not found for deletion', async () => {
      legalDocumentModel.deleteDocument.mockResolvedValue(null);

      const result = await legalDocumentService.deleteDocument(999);

      expect(legalDocumentModel.deleteDocument).toHaveBeenCalledWith(999, undefined);
      expect(result).toBeNull();
    });

    it('should handle database errors during deletion', async () => {
      legalDocumentModel.deleteDocument.mockRejectedValue(new Error('Delete failed'));

      await expect(legalDocumentService.deleteDocument(1))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('transaction handling', () => {
    it('should handle transaction client in createDocument', async () => {
      const documentData = { type: 'terms', content: 'Terms content' };
      const createdDocument = { id: 1, ...documentData };
      const mockClient = { query: jest.fn() };

      legalDocumentModel.createDocument.mockResolvedValue(createdDocument);
      
      // Mock executeInTransaction to pass client
      legalDocumentService.executeInTransaction = jest.fn(async (callback) => callback(mockClient));

      const result = await legalDocumentService.createDocument(documentData);

      expect(legalDocumentModel.createDocument).toHaveBeenCalledWith(documentData, mockClient);
      expect(result).toEqual(createdDocument);
    });

    it('should handle transaction client in updateDocument', async () => {
      const documentId = 1;
      const updateData = { content: 'Updated content' };
      const updatedDocument = { id: documentId, ...updateData };
      const mockClient = { query: jest.fn() };

      legalDocumentModel.updateDocument.mockResolvedValue(updatedDocument);
      
      // Mock executeInTransaction to pass client
      legalDocumentService.executeInTransaction = jest.fn(async (callback) => callback(mockClient));

      const result = await legalDocumentService.updateDocument(documentId, updateData);

      expect(legalDocumentModel.updateDocument).toHaveBeenCalledWith(documentId, updateData, mockClient);
      expect(result).toEqual(updatedDocument);
    });

    it('should handle transaction client in deleteDocument', async () => {
      const documentId = 1;
      const deleteResult = { id: documentId, deleted: true };
      const mockClient = { query: jest.fn() };

      legalDocumentModel.deleteDocument.mockResolvedValue(deleteResult);
      
      // Mock executeInTransaction to pass client
      legalDocumentService.executeInTransaction = jest.fn(async (callback) => callback(mockClient));

      const result = await legalDocumentService.deleteDocument(documentId);

      expect(legalDocumentModel.deleteDocument).toHaveBeenCalledWith(documentId, mockClient);
      expect(result).toEqual(deleteResult);
    });
  });
});