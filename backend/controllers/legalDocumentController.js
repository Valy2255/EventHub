// controllers/legalDocumentController.js
import * as legalDocumentModel from '../models/LegalDocument.js';

/**
 * Get active version of a specific legal document
 */
export const getActiveDocument = async (req, res) => {
  try {
    const { documentType } = req.params;
    
    if (!['privacy_policy', 'terms_conditions'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be "privacy_policy" or "terms_conditions"'
      });
    }
    
    const document = await legalDocumentModel.getActiveDocument(documentType);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: `No active ${documentType.replace('_', ' ')} document found`
      });
    }
    
    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.documentType}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all versions of a specific legal document type (admin only)
 */
export const getAllVersions = async (req, res) => {
  try {
    const { documentType } = req.params;
    
    if (!['privacy_policy', 'terms_conditions'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be "privacy_policy" or "terms_conditions"'
      });
    }
    
    const documents = await legalDocumentModel.getAllVersions(documentType);
    
    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.documentType} versions:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a legal document by ID (admin only)
 */
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await legalDocumentModel.getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create a new version of a legal document (admin only)
 */
export const createDocument = async (req, res) => {
  try {
    const { document_type, title, content } = req.body;
    
    if (!document_type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: document_type, title, content'
      });
    }
    
    if (!['privacy_policy', 'terms_conditions'].includes(document_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be "privacy_policy" or "terms_conditions"'
      });
    }
    
    const document = await legalDocumentModel.createDocument({
      document_type,
      title,
      content
    });
    
    res.status(201).json({
      success: true,
      message: 'New document version created successfully',
      document
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update an existing legal document (admin only)
 */
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_active } = req.body;
    
    if (!title && content === undefined && is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update provided'
      });
    }
    
    const document = await legalDocumentModel.updateDocument(id, {
      title,
      content,
      is_active
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete a legal document (admin only)
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await legalDocumentModel.deleteDocument(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or could not be deleted'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};