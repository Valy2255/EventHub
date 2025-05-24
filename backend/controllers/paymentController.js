import { PaymentService } from '../services/PaymentService.js';

const paymentService = new PaymentService();

/**
 * POST /api/payments/process
 * Process payment and create tickets
 */
export const processPayment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const paymentData = req.body;

    // Log the payment request for debugging
    console.log("Payment request:", {
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      useCredits: paymentData.useCredits,
      savedCardId: paymentData.savedCardId,
      saveCard: paymentData.saveCard,
      ticketsCount: paymentData.tickets?.length || 0,
    });

    const result = await paymentService.processPayment(userId, paymentData);

    // Send ticket email
    const user = req.user;
    await paymentService.sendTicketEmail(
      user.email,
      user.name,
      result.createdTickets,
      result.orderNumber
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: "Payment successful",
      paymentId: result.payment.id,
      purchaseId: result.purchase.id,
      tickets: result.createdTickets,
      orderNumber: result.orderNumber,
      paymentMethod: result.paymentMethod,
      savedCardId: result.savedCardId,
      paymentCompleted: true,
      ...(result.currentCredits !== null && {
        currentCredits: result.currentCredits,
      }),
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    
    if (error.message === "Invalid payment amount") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === "No tickets provided") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === "Insufficient credits") {
      return res.status(400).json({
        success: false,
        message: error.message,
        creditsNeeded: error.creditsNeeded,
        currentCredits: error.currentCredits,
      });
    }
    
    if (error.message === "Saved card not found") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === "Missing required card details") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes("Invalid ticket type ID") ||
        error.message.includes("not found") ||
        error.message.includes("Not enough tickets available")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Payment processing failed', 
      error: error.message 
    });
  }
};

/**
 * GET /api/payments/history
 * Get payment history for user
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await paymentService.getPaymentHistory(userId);

    res.status(200).json({ 
      success: true,
      data: payments 
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment history', 
      error: error.message 
    });
  }
};

/**
 * GET /api/payments/:id
 * Get payment details with linked tickets
 */
export const getPaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { payment, tickets } = await paymentService.getPaymentDetails(id, userId);

    res.status(200).json({
      success: true,
      data: {
        payment,
        tickets,
      }
    });
  } catch (error) {
    if (error.message === 'Payment not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Unauthorized access to this payment') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    console.error("Error fetching payment details:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment details', 
      error: error.message 
    });
  }
};