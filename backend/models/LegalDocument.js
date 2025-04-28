// models/legalDocumentModel.js
import * as db from '../config/db.js';

/**
 * Get the latest active version of a specific legal document
 * @param {string} documentType - Type of document ('privacy_policy' or 'terms_conditions')
 * @returns {Promise<Object>} Document object
 */
export const getActiveDocument = async (documentType) => {
  try {
    const result = await db.query(
      `SELECT id, document_type, title, content, version, published_at 
       FROM legal_documents 
       WHERE document_type = $1 AND is_active = true 
       ORDER BY version DESC LIMIT 1`,
      [documentType]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching legal document: ${error.message}`);
  }
};

/**
 * Get all versions of a specific legal document type
 * @param {string} documentType - Type of document ('privacy_policy' or 'terms_conditions')
 * @returns {Promise<Array>} Array of document objects
 */
export const getAllVersions = async (documentType) => {
  try {
    const result = await db.query(
      `SELECT id, document_type, title, content, version, is_active, published_at, updated_at 
       FROM legal_documents 
       WHERE document_type = $1 
       ORDER BY version DESC`,
      [documentType]
    );
    
    return result.rows;
  } catch (error) {
    throw new Error(`Error fetching legal document versions: ${error.message}`);
  }
};

/**
 * Get a legal document by ID
 * @param {number} id - Document ID
 * @returns {Promise<Object>} Document object
 */
export const getDocumentById = async (id) => {
  try {
    const result = await db.query(
      `SELECT id, document_type, title, content, version, is_active, published_at 
       FROM legal_documents 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error fetching legal document: ${error.message}`);
  }
};

/**
 * Create a new version of a legal document
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} Created document object
 */
export const createDocument = async (documentData) => {
  const { document_type, title, content } = documentData;
  
  try {
    // Find the latest version of this document type
    const latestVersionResult = await db.query(
      'SELECT MAX(version) as max_version FROM legal_documents WHERE document_type = $1',
      [document_type]
    );
    
    const nextVersion = latestVersionResult.rows[0].max_version ? 
      parseInt(latestVersionResult.rows[0].max_version) + 1 : 1;
    
    // Set all previous versions to inactive
    await db.query(
      'UPDATE legal_documents SET is_active = false WHERE document_type = $1',
      [document_type]
    );
    
    // Insert new version
    const result = await db.query(
      `INSERT INTO legal_documents (document_type, title, content, version, is_active, published_at) 
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP) 
       RETURNING id, document_type, title, content, version, is_active, published_at`,
      [document_type, title, content, nextVersion]
    );
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating legal document: ${error.message}`);
  }
};

/**
 * Update an existing legal document
 * @param {number} id - Document ID
 * @param {Object} documentData - Updated document data
 * @returns {Promise<Object>} Updated document object
 */
export const updateDocument = async (id, documentData) => {
  const { title, content, is_active } = documentData;
  
  try {
    // Build the query dynamically based on provided fields
    let query = 'UPDATE legal_documents SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      query += `, title = $${paramCount}`;
      values.push(title);
      paramCount++;
    }
    
    if (content !== undefined) {
      query += `, content = $${paramCount}`;
      values.push(content);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      query += `, is_active = $${paramCount}`;
      values.push(is_active);
      paramCount++;
    }
    
    query += ` WHERE id = $${paramCount} RETURNING id, document_type, title, content, version, is_active, published_at, updated_at`;
    values.push(id);
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // If setting this document as active, set all others of same type to inactive
    if (is_active === true) {
      const docType = result.rows[0].document_type;
      await db.query(
        'UPDATE legal_documents SET is_active = false WHERE document_type = $1 AND id != $2',
        [docType, id]
      );
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating legal document: ${error.message}`);
  }
};

/**
 * Delete a legal document by ID
 * @param {number} id - Document ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteDocument = async (id) => {
  try {
    // First check if this is the only document of its type
    const document = await getDocumentById(id);
    if (!document) {
      return false;
    }
    
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM legal_documents WHERE document_type = $1',
      [document.document_type]
    );
    
    // Don't allow deletion if it's the only document of its type
    if (parseInt(countResult.rows[0].count) <= 1) {
      throw new Error('Cannot delete the only version of a legal document');
    }
    
    // If we're deleting an active document, activate the next most recent version
    if (document.is_active) {
      await db.query(
        `UPDATE legal_documents 
         SET is_active = true 
         WHERE document_type = $1 AND id != $2 
         ORDER BY version DESC LIMIT 1`,
        [document.document_type, id]
      );
    }
    
    const result = await db.query('DELETE FROM legal_documents WHERE id = $1 RETURNING id', [id]);
    
    return result.rows.length > 0;
  } catch (error) {
    throw new Error(`Error deleting legal document: ${error.message}`);
  }
};