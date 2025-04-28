// controllers/faqController.js
import * as faqModel from '../models/Faq.js';

// Get all FAQs
export const getAllFAQs = async (req, res, next) => {
  try {
    const faqs = await faqModel.getAllFAQs();
    res.status(200).json({ success: true, faqs });
  } catch (error) {
    next(error);
  }
};

// Get a single FAQ by ID
export const getFAQById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await faqModel.getFAQById(id);
    
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.status(200).json({ success: true, faq });
  } catch (error) {
    next(error);
  }
};

// Create a new FAQ (admin only)
export const createFAQ = async (req, res, next) => {
  try {
    const { question, answer, display_order } = req.body;
    
    // Basic validation
    if (!question || !answer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question and answer are required fields' 
      });
    }
    
    const newFAQ = await faqModel.createFAQ({ question, answer, display_order });
    res.status(201).json({ success: true, faq: newFAQ });
  } catch (error) {
    next(error);
  }
};

// Update an existing FAQ (admin only)
export const updateFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, display_order, is_active } = req.body;
    
    const updatedFAQ = await faqModel.updateFAQ(id, { 
      question, 
      answer, 
      display_order, 
      is_active 
    });
    
    if (!updatedFAQ) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.status(200).json({ success: true, faq: updatedFAQ });
  } catch (error) {
    next(error);
  }
};

// Delete a FAQ (admin only)
export const deleteFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await faqModel.deleteFAQ(id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Update display order of multiple FAQs (admin only)
// in your Express controller
export const updateFAQOrder = async (req, res) => {
    try {
      const { order } = req.body;
      if (!Array.isArray(order)) {
        return res.status(400).json({
          success: false,
          message: 'Order must be an array of {id, display_order} objects'
        });
      }
      await faqModel.updateOrder(order);
      res.status(200).json({ success: true, message: 'FAQ order updated successfully' });
    } catch (error) {
      console.error('updateFAQOrder failed:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  