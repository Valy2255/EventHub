// backend/controllers/legalDocumentController.js
import { LegalDocumentService } from '../services/LegalDocumentService.js';

const legalDocumentService = new LegalDocumentService();

/**
 * Public: GET /api/legal/:documentType
 * Returns { document } so that React can do response.data.document
 */
export const getActiveDocument = async (req, res, next) => {
  try {
    const { documentType } = req.params;
    if (!['privacy_policy', 'terms_conditions'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }
    const document = await legalDocumentService.getActiveDocument(documentType);
    if (!document) {
      return res.status(404).json({ error: 'Active document not found' });
    }
    res.status(200).json({ document });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: GET /api/admin/legal/:documentType/versions
 */
export const getAllVersions = async (req, res, next) => {
  try {
    const { documentType } = req.params;
    if (!['privacy_policy', 'terms_conditions'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }
    const documents = await legalDocumentService.getAllVersions(documentType);
    res.status(200).json({ documents });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: GET /api/admin/legal/:id
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await legalDocumentService.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json(document);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: POST /api/admin/legal
 */
export const createDocument = async (req, res, next) => {
  try {
    const { document_type, title, content } = req.body;
    if (!document_type || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newDoc = await legalDocumentService.createDocument({ document_type, title, content });
    res.status(201).json(newDoc);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: PUT /api/admin/legal/:id
 */
export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, is_active } = req.body;
    if (title === undefined && content === undefined && is_active === undefined) {
      return res.status(400).json({ error: 'No update fields provided' });
    }
    const updated = await legalDocumentService.updateDocument(id, { title, content, is_active });
    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: DELETE /api/admin/legal/:id
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await legalDocumentService.deleteDocument(id);
    if (!success) {
      return res.status(404).json({ error: 'Document not found or could not be deleted' });
    }
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
};
