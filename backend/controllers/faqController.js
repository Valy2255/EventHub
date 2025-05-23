// controllers/faqController.js
import { FaqService } from '../services/FaqService.js';

const faqService = new FaqService();

export const getAllFAQs = async (req, res, next) => {
  try {
    const faqs = await faqService.getAllFAQs();
    res.status(200).json({ success: true, faqs });
  } catch (error) {
    next(error);
  }
};

export const createFAQ = async (req, res, next) => {
  try {
    const { question, answer, display_order } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question and answer are required fields' 
      });
    }
    
    const newFAQ = await faqService.createFAQ({ question, answer, display_order });
    res.status(201).json({ success: true, faq: newFAQ });
  } catch (error) {
    next(error);
  }
};

export const updateFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, display_order, is_active } = req.body;
    
    const updatedFAQ = await faqService.updateFAQ(id, { 
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

export const deleteFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await faqService.deleteFAQ(id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateFAQOrder = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be an array of {id, display_order} objects'
      });
    }
    await faqService.updateFAQOrder(order);
    res.status(200).json({ success: true, message: 'FAQ order updated successfully' });
  } catch (error) {
    console.error('updateFAQOrder failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};