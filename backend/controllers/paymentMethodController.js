import { PaymentMethodService } from "../services/PaymentMethodService.js";

const paymentMethodService = new PaymentMethodService();

/**
 * GET /api/payment-methods
 * Get all payment methods for a user
 */
export const getPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const paymentMethods = await paymentMethodService.getPaymentMethods(userId);

    res.status(200).json({
      success: true,
      paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: error.message,
    });
  }
};

/**
 * GET /api/payment-methods/:id
 * Get a specific payment method
 */
export const getPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paymentMethod = await paymentMethodService.getPaymentMethod(
      id,
      userId
    );

    res.status(200).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    if (error.message === "Payment method not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Error fetching payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment method",
      error: error.message,
    });
  }
};

/**
 * POST /api/payment-methods
 * Add a new payment method
 */
export const addPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const paymentMethodData = req.body;

    const paymentMethod = await paymentMethodService.addPaymentMethod(
      userId,
      paymentMethodData
    );

    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      paymentMethod,
    });
  } catch (error) {
    if (
      error.message === "Missing required fields" ||
      error.message === "Invalid card number" ||
      error.message === "Invalid card holder name" ||
      error.message === "Invalid expiry date format. Use MM/YY" ||
      error.message === "Invalid expiry month" ||
      error.message === "Card has expired"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Error adding payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add payment method",
      error: error.message,
    });
  }
};

/**
 * PUT /api/payment-methods/:id
 * Update a payment method
 */
export const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const paymentMethod = await paymentMethodService.updatePaymentMethod(
      id,
      userId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      data: paymentMethod,
    });
  } catch (error) {
    if (error.message === "Payment method not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "Missing required fields" ||
      error.message === "Invalid expiry month" ||
      error.message === "Card has expired"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Error updating payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment method",
      error: error.message,
    });
  }
};

/**
 * PUT /api/payment-methods/:id/default
 * Set a payment method as default
 */
export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paymentMethod = await paymentMethodService.setDefaultPaymentMethod(
      id,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Default payment method updated successfully",
      data: paymentMethod,
    });
  } catch (error) {
    if (error.message === "Payment method not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Error setting default payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set default payment method",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/payment-methods/:id
 * Delete a payment method
 */
export const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paymentMethod = await paymentMethodService.deletePaymentMethod(
      id,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
      data: { id: paymentMethod.id },
    });
  } catch (error) {
    if (error.message === "Payment method not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Error deleting payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment method",
      error: error.message,
    });
  }
};

/**
 * GET /api/payment-methods/default
 * Get the default payment method for a user
 */
export const getDefaultPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const defaultPaymentMethod =
      await paymentMethodService.getDefaultPaymentMethod(userId);

    res.status(200).json({
      success: true,
      data: defaultPaymentMethod,
    });
  } catch (error) {
    console.error("Error fetching default payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch default payment method",
      error: error.message,
    });
  }
};
