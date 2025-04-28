// routes/legalDocumentRoutes.js
import express from 'express';
import * as legalDocumentController from '../controllers/legalDocumentController.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();

// Public routes
router.get('/:documentType', legalDocumentController.getActiveDocument);

// Admin only routes
router.get('/admin/:documentType/versions', auth, admin, legalDocumentController.getAllVersions);
router.get('/admin/:id', auth, admin, legalDocumentController.getDocumentById);
router.post('/admin', auth, admin, legalDocumentController.createDocument);
router.put('/admin/:id', auth, admin, legalDocumentController.updateDocument);
router.delete('/admin/:id', auth, admin, legalDocumentController.deleteDocument);

export default router;