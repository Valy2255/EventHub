import { jest } from '@jest/globals';

// Test utilities
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { id: 1, email: 'user@example.com', name: 'Test User', role: 'user' },
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

// Mock the LegalDocumentService
const mockLegalDocumentService = {
  getActiveDocument: jest.fn(),
  getAllVersions: jest.fn(),
  getDocumentById: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn()
};

jest.unstable_mockModule('../../services/LegalDocumentService.js', () => ({
  LegalDocumentService: jest.fn().mockImplementation(() => mockLegalDocumentService)
}));

const { 
  getActiveDocument,
  getAllVersions,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
} = await import('../../controllers/legalDocumentController.js');

describe('LegalDocumentController', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
    
    Object.values(mockLegalDocumentService).forEach(mock => mock.mockReset());
  });

  describe('getActiveDocument', () => {
    it('should get active privacy policy successfully', async () => {
      const mockDocument = {
        id: 1,
        document_type: 'privacy_policy',
        title: 'Privacy Policy',
        content: 'Privacy policy content...',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      };
      req.params = { documentType: 'privacy_policy' };
      mockLegalDocumentService.getActiveDocument.mockResolvedValue(mockDocument);

      await getActiveDocument(req, res, next);

      expect(mockLegalDocumentService.getActiveDocument).toHaveBeenCalledWith('privacy_policy');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ document: mockDocument });
    });

    it('should get active terms and conditions successfully', async () => {
      const mockDocument = {
        id: 2,
        document_type: 'terms_conditions',
        title: 'Terms and Conditions',
        content: 'Terms and conditions content...',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      };
      req.params = { documentType: 'terms_conditions' };
      mockLegalDocumentService.getActiveDocument.mockResolvedValue(mockDocument);

      await getActiveDocument(req, res, next);

      expect(mockLegalDocumentService.getActiveDocument).toHaveBeenCalledWith('terms_conditions');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ document: mockDocument });
    });

    it('should handle invalid document type', async () => {
      req.params = { documentType: 'invalid_type' };

      await getActiveDocument(req, res, next);

      expect(mockLegalDocumentService.getActiveDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid document type' });
    });

    it('should handle document not found', async () => {
      req.params = { documentType: 'privacy_policy' };
      mockLegalDocumentService.getActiveDocument.mockResolvedValue(null);

      await getActiveDocument(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Active document not found' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      req.params = { documentType: 'privacy_policy' };
      mockLegalDocumentService.getActiveDocument.mockRejectedValue(error);

      await getActiveDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllVersions', () => {
    it('should get all versions successfully', async () => {
      const mockDocuments = [
        {
          id: 1,
          document_type: 'privacy_policy',
          title: 'Privacy Policy v1',
          is_active: false,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          document_type: 'privacy_policy',
          title: 'Privacy Policy v2',
          is_active: true,
          created_at: '2024-02-01T00:00:00Z'
        }
      ];
      req.params = { documentType: 'privacy_policy' };
      mockLegalDocumentService.getAllVersions.mockResolvedValue(mockDocuments);

      await getAllVersions(req, res, next);

      expect(mockLegalDocumentService.getAllVersions).toHaveBeenCalledWith('privacy_policy');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ documents: mockDocuments });
    });

    it('should handle invalid document type', async () => {
      req.params = { documentType: 'invalid_type' };

      await getAllVersions(req, res, next);

      expect(mockLegalDocumentService.getAllVersions).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid document type' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database connection failed');
      req.params = { documentType: 'terms_conditions' };
      mockLegalDocumentService.getAllVersions.mockRejectedValue(error);

      await getAllVersions(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getDocumentById', () => {
    it('should get document by ID successfully', async () => {
      const mockDocument = {
        id: 1,
        document_type: 'privacy_policy',
        title: 'Privacy Policy',
        content: 'Privacy policy content...',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      };
      req.params = { id: '1' };
      mockLegalDocumentService.getDocumentById.mockResolvedValue(mockDocument);

      await getDocumentById(req, res, next);

      expect(mockLegalDocumentService.getDocumentById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDocument);
    });

    it('should handle document not found', async () => {
      req.params = { id: '999' };
      mockLegalDocumentService.getDocumentById.mockResolvedValue(null);

      await getDocumentById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      req.params = { id: '1' };
      mockLegalDocumentService.getDocumentById.mockRejectedValue(error);

      await getDocumentById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createDocument', () => {
    it('should create document successfully', async () => {
      const documentData = {
        document_type: 'privacy_policy',
        title: 'New Privacy Policy',
        content: 'New privacy policy content...'
      };
      const mockDocument = { id: 1, ...documentData, is_active: false };
      req.body = documentData;
      mockLegalDocumentService.createDocument.mockResolvedValue(mockDocument);

      await createDocument(req, res, next);

      expect(mockLegalDocumentService.createDocument).toHaveBeenCalledWith(documentData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockDocument);
    });

    it('should handle missing document_type', async () => {
      req.body = { title: 'New Policy', content: 'Content...' };

      await createDocument(req, res, next);

      expect(mockLegalDocumentService.createDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should handle missing title', async () => {
      req.body = { document_type: 'privacy_policy', content: 'Content...' };

      await createDocument(req, res, next);

      expect(mockLegalDocumentService.createDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should handle missing content', async () => {
      req.body = { document_type: 'privacy_policy', title: 'New Policy' };

      await createDocument(req, res, next);

      expect(mockLegalDocumentService.createDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database constraint violation');
      req.body = {
        document_type: 'privacy_policy',
        title: 'New Policy',
        content: 'Content...'
      };
      mockLegalDocumentService.createDocument.mockRejectedValue(error);

      await createDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      const updateData = { title: 'Updated Title', content: 'Updated content...' };
      const mockDocument = { id: 1, ...updateData, document_type: 'privacy_policy' };
      req.params = { id: '1' };
      req.body = updateData;
      mockLegalDocumentService.updateDocument.mockResolvedValue(mockDocument);

      await updateDocument(req, res, next);

      expect(mockLegalDocumentService.updateDocument).toHaveBeenCalledWith('1', updateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDocument);
    });

    it('should update only is_active field', async () => {
      const updateData = { is_active: true };
      const mockDocument = { id: 1, is_active: true, document_type: 'privacy_policy' };
      req.params = { id: '1' };
      req.body = updateData;
      mockLegalDocumentService.updateDocument.mockResolvedValue(mockDocument);

      await updateDocument(req, res, next);

      expect(mockLegalDocumentService.updateDocument).toHaveBeenCalledWith('1', updateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDocument);
    });

    it('should handle no update fields provided', async () => {
      req.params = { id: '1' };
      req.body = {};

      await updateDocument(req, res, next);

      expect(mockLegalDocumentService.updateDocument).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No update fields provided' });
    });

    it('should handle document not found', async () => {
      req.params = { id: '999' };
      req.body = { title: 'Updated Title' };
      mockLegalDocumentService.updateDocument.mockResolvedValue(null);

      await updateDocument(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Document not found' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database update failed');
      req.params = { id: '1' };
      req.body = { title: 'Updated Title' };
      mockLegalDocumentService.updateDocument.mockRejectedValue(error);

      await updateDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      req.params = { id: '1' };
      mockLegalDocumentService.deleteDocument.mockResolvedValue(true);

      await deleteDocument(req, res, next);

      expect(mockLegalDocumentService.deleteDocument).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Document deleted successfully' });
    });

    it('should handle document not found', async () => {
      req.params = { id: '999' };
      mockLegalDocumentService.deleteDocument.mockResolvedValue(false);

      await deleteDocument(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Document not found or could not be deleted' });
    });

    it('should handle service error', async () => {
      const error = new Error('Database deletion failed');
      req.params = { id: '1' };
      mockLegalDocumentService.deleteDocument.mockRejectedValue(error);

      await deleteDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});