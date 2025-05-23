// routes/legalDocumentRoutes.js
import express from 'express';
import * as legalDocumentController from '../controllers/legalDocumentController.js';

const router = express.Router();

// Public routes
router.get('/:documentType', legalDocumentController.getActiveDocument);

export default router;