// backend/tests/models/LegalDocument.test.js
import { jest } from '@jest/globals';

// Mock database
const mockDbQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
  query: mockDbQuery
}));

describe('LegalDocument Model', () => {
  let LegalDocument;

  beforeAll(async () => {
    LegalDocument = await import('../../models/LegalDocument.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveDocument', () => {
    it('should get the latest active version of a document', async () => {
      const mockDocument = {
        id: 1,
        document_type: 'privacy_policy',
        title: 'Privacy Policy',
        content: 'Privacy policy content...',
        version: 2,
        published_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockDocument] });

      const result = await LegalDocument.getActiveDocument('privacy_policy');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id, document_type, title, content, version, published_at\s+FROM legal_documents\s+WHERE document_type = \$1 AND is_active = true\s+ORDER BY version DESC LIMIT 1/s),
        ['privacy_policy']
      );
      expect(result).toEqual(mockDocument);
    });

    it('should return null when no active document found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await LegalDocument.getActiveDocument('terms_conditions');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(LegalDocument.getActiveDocument('privacy_policy'))
        .rejects.toThrow('Error fetching legal document: Database error');
    });
  });

  describe('getAllVersions', () => {
    it('should get all versions of a document type', async () => {
      const mockVersions = [
        {
          id: 2,
          document_type: 'privacy_policy',
          title: 'Privacy Policy v2',
          version: 2,
          is_active: true
        },
        {
          id: 1,
          document_type: 'privacy_policy',
          title: 'Privacy Policy v1',
          version: 1,
          is_active: false
        }
      ];

      mockDbQuery.mockResolvedValue({ rows: mockVersions });

      const result = await LegalDocument.getAllVersions('privacy_policy');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id, document_type, title, content, version, is_active, published_at, updated_at\s+FROM legal_documents\s+WHERE document_type = \$1\s+ORDER BY version DESC/s),
        ['privacy_policy']
      );
      expect(result).toEqual(mockVersions);
    });

    it('should return empty array when no versions found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await LegalDocument.getAllVersions('non_existent');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(LegalDocument.getAllVersions('privacy_policy'))
        .rejects.toThrow('Error fetching legal document versions: Database error');
    });
  });

  describe('getDocumentById', () => {
    it('should get document by ID', async () => {
      const mockDocument = {
        id: 1,
        document_type: 'privacy_policy',
        title: 'Privacy Policy',
        content: 'Content...',
        version: 1,
        is_active: true,
        published_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery.mockResolvedValue({ rows: [mockDocument] });

      const result = await LegalDocument.getDocumentById(1);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id, document_type, title, content, version, is_active, published_at\s+FROM legal_documents\s+WHERE id = \$1/s),
        [1]
      );
      expect(result).toEqual(mockDocument);
    });

    it('should return null when document not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await LegalDocument.getDocumentById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(LegalDocument.getDocumentById(1))
        .rejects.toThrow('Error fetching legal document: Database error');
    });
  });

  describe('createDocument', () => {
    const mockDocumentData = {
      document_type: 'privacy_policy',
      title: 'New Privacy Policy',
      content: 'New privacy policy content...'
    };

    it('should create a new document version (first version)', async () => {
      const mockCreated = {
        id: 1,
        ...mockDocumentData,
        version: 1,
        is_active: true,
        published_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ max_version: null }] }) // No previous versions
        .mockResolvedValueOnce({}) // UPDATE previous versions (no effect)
        .mockResolvedValueOnce({ rows: [mockCreated] }); // INSERT new version

      const result = await LegalDocument.createDocument(mockDocumentData);

      expect(mockDbQuery).toHaveBeenNthCalledWith(1,
        'SELECT MAX(version) as max_version FROM legal_documents WHERE document_type = $1',
        ['privacy_policy']
      );
      expect(mockDbQuery).toHaveBeenNthCalledWith(2,
        'UPDATE legal_documents SET is_active = false WHERE document_type = $1',
        ['privacy_policy']
      );
      expect(mockDbQuery).toHaveBeenNthCalledWith(3,
        expect.stringMatching(/INSERT INTO legal_documents \(document_type, title, content, version, is_active, published_at\)\s+VALUES \(\$1, \$2, \$3, \$4, true, CURRENT_TIMESTAMP\)\s+RETURNING id, document_type, title, content, version, is_active, published_at/s),
        ['privacy_policy', 'New Privacy Policy', 'New privacy policy content...', 1]
      );
      expect(result).toEqual(mockCreated);
    });

    it('should create a new document version (increment existing)', async () => {
      const mockCreated = {
        id: 2,
        ...mockDocumentData,
        version: 3,
        is_active: true,
        published_at: '2024-03-15T10:00:00Z'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ max_version: '2' }] }) // Previous version exists
        .mockResolvedValueOnce({}) // UPDATE previous versions
        .mockResolvedValueOnce({ rows: [mockCreated] }); // INSERT new version

      const result = await LegalDocument.createDocument(mockDocumentData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['privacy_policy', 'New Privacy Policy', 'New privacy policy content...', 3]
      );
      expect(result).toEqual(mockCreated);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDbQuery.mockRejectedValue(error);

      await expect(LegalDocument.createDocument(mockDocumentData))
        .rejects.toThrow('Error creating legal document: Database error');
    });
  });

  describe('updateDocument', () => {
    const mockUpdateData = {
      title: 'Updated Title',
      content: 'Updated content',
      is_active: true
    };

    it('should update document with all fields', async () => {
      const mockUpdated = {
        id: 1,
        document_type: 'privacy_policy',
        ...mockUpdateData,
        version: 1,
        published_at: '2024-03-15T10:00:00Z',
        updated_at: '2024-03-15T11:00:00Z'
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockUpdated] }) // UPDATE query
        .mockResolvedValueOnce({}); // UPDATE other documents to inactive

      const result = await LegalDocument.updateDocument(1, mockUpdateData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE legal_documents SET updated_at = CURRENT_TIMESTAMP, title = \$1, content = \$2, is_active = \$3 WHERE id = \$4/),
        ['Updated Title', 'Updated content', true, 1]
      );
      expect(mockDbQuery).toHaveBeenCalledWith(
        'UPDATE legal_documents SET is_active = false WHERE document_type = $1 AND id != $2',
        ['privacy_policy', 1]
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should update document with partial data', async () => {
      const partialData = { title: 'Updated Title Only' };
      const mockUpdated = {
        id: 1,
        document_type: 'privacy_policy',
        title: 'Updated Title Only',
        is_active: false
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await LegalDocument.updateDocument(1, partialData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE legal_documents SET updated_at = CURRENT_TIMESTAMP, title = \$1 WHERE id = \$2/),
        ['Updated Title Only', 1]
      );
      // Should not call the second UPDATE since is_active wasn't set to true
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUpdated);
    });

    it('should return null when document not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await LegalDocument.updateDocument(999, mockUpdateData);

      expect(result).toBeNull();
    });

    it('should handle undefined values gracefully', async () => {
      const dataWithUndefined = {
        title: 'Updated Title',
        content: undefined,
        is_active: true
      };
      const mockUpdated = {
        id: 1,
        document_type: 'privacy_policy',
        title: 'Updated Title',
        is_active: true
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockUpdated] })
        .mockResolvedValueOnce({});

      const result = await LegalDocument.updateDocument(1, dataWithUndefined);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE legal_documents SET updated_at = CURRENT_TIMESTAMP, title = \$1, is_active = \$2 WHERE id = \$3/),
        ['Updated Title', true, 1]
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should handle database errors', async () => {
      const error = new Error('Update failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(LegalDocument.updateDocument(1, mockUpdateData))
        .rejects.toThrow('Error updating legal document: Update failed');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document when multiple versions exist', async () => {
      const mockDocument = {
        id: 2,
        document_type: 'privacy_policy',
        is_active: true
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockDocument] }) // getDocumentById
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // Count documents
        .mockResolvedValueOnce({}) // Activate next version
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }); // DELETE

      const result = await LegalDocument.deleteDocument(2);

      expect(mockDbQuery).toHaveBeenNthCalledWith(2,
        'SELECT COUNT(*) as count FROM legal_documents WHERE document_type = $1',
        ['privacy_policy']
      );
      expect(mockDbQuery).toHaveBeenNthCalledWith(3,
        expect.stringMatching(/UPDATE legal_documents\s+SET is_active = true\s+WHERE document_type = \$1 AND id != \$2\s+ORDER BY version DESC LIMIT 1/s),
        ['privacy_policy', 2]
      );
      expect(mockDbQuery).toHaveBeenNthCalledWith(4,
        'DELETE FROM legal_documents WHERE id = $1 RETURNING id',
        [2]
      );
      expect(result).toBe(true);
    });

    it('should not delete when it is the only version', async () => {
      const mockDocument = {
        id: 1,
        document_type: 'privacy_policy',
        is_active: true
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockDocument] }) // getDocumentById
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // Count documents

      await expect(LegalDocument.deleteDocument(1))
        .rejects.toThrow('Cannot delete the only version of a legal document');
    });

    it('should return false when document not found', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] }); // getDocumentById returns null

      const result = await LegalDocument.deleteDocument(999);

      expect(result).toBe(false);
    });

    it('should not activate next version when deleting inactive document', async () => {
      const mockDocument = {
        id: 2,
        document_type: 'privacy_policy',
        is_active: false
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockDocument] }) // getDocumentById
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // Count documents
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }); // DELETE (no activation step)

      const result = await LegalDocument.deleteDocument(2);

      expect(mockDbQuery).toHaveBeenCalledTimes(3); // Should skip the activation step
      expect(result).toBe(true);
    });

    it('should handle database errors', async () => {
      const error = new Error('Delete failed');
      mockDbQuery.mockRejectedValue(error);

      await expect(LegalDocument.deleteDocument(1))
        .rejects.toThrow('Error deleting legal document: Error fetching legal document: Delete failed');
    });

    it('should handle custom error messages', async () => {
      const mockDocument = {
        id: 1,
        document_type: 'privacy_policy',
        is_active: true
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockDocument] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const error = await LegalDocument.deleteDocument(1).catch(e => e);

      expect(error.message).toBe('Error deleting legal document: Cannot delete the only version of a legal document');
    });
  });
});