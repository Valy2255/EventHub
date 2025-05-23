import express from "express";
import auth from "../../middleware/auth.js";
import admin from "../../middleware/admin.js";
import * as categoryController from "../../controllers/categoryController.js";
import * as adminController from "../../controllers/adminController.js";
import * as subcategoryController from "../../controllers/subcategoryController.js";
import * as checkInController from "../../controllers/checkInController.js";
import * as faqController from "../../controllers/faqController.js";
import * as legalDocumentController from "../../controllers/legalDocumentController.js";
const router = express.Router();

router.use(auth, admin);

// Category management
router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:id", categoryController.getCategoryById);
router.post("/categories", categoryController.createCategory);
router.put("/categories/:id", categoryController.updateCategory);
router.delete("/categories/:id", categoryController.deleteCategory);

// Subcategory management
router.get("/subcategories", subcategoryController.getAllSubcategories);
router.get("/subcategories/:id", subcategoryController.getSubcategoryById);
router.post("/subcategories", subcategoryController.createSubcategory);
router.put("/subcategories/:id", subcategoryController.updateSubcategory);
router.delete("/subcategories/:id", subcategoryController.deleteSubcategory);

// Event management
router.get("/events", adminController.getAllEvents);
router.get("/events/:id", adminController.getEventById);
router.post("/events", adminController.createEvent);
router.put("/events/:id", adminController.updateEvent);
router.delete("/events/:id", adminController.deleteEvent);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

// Dashboard stats
router.get("/dashboard/stats", adminController.getDashboardStats);

// Refund processing
router.get("/refunds", adminController.getAllRefunds);
router.put("/refunds/:id", adminController.approveRefund);
router.post("/refunds/process", adminController.triggerRefundProcessing);

// Check-in operations
router.post("/check-in/validate", checkInController.findTicketByQr);
router.post("/check-in/:ticketId/confirm", checkInController.checkInTicket);
router.get("/check-in/stats/:eventId", checkInController.getEventCheckInStats);

// FAQ management
router.post("/faqs", faqController.createFAQ);
router.put("/faqs/:id", faqController.updateFAQ);
router.delete("/faqs/:id", faqController.deleteFAQ);
router.post("/faqs/order", faqController.updateFAQOrder);

// Legal document management
router.get("/legal/:documentType/versions", legalDocumentController.getAllVersions);
router.get("/legal/:id", legalDocumentController.getDocumentById);
router.post("/legal", legalDocumentController.createDocument);
router.put("/legal/:id", legalDocumentController.updateDocument);
router.delete("/legal/:id", legalDocumentController.deleteDocument);

export default router;
