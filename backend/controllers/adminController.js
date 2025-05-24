import { AdminService } from '../services/AdminService.js';

const adminService = new AdminService();

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (admin only)
export const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.json({ user });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await adminService.updateUserRole(req.params.id, role);
    res.json({ user });
  } catch (error) {
    if (error.message === 'Role must be "user" or "admin"') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'You cannot delete your own account' ||
        error.message === 'User not found') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Dashboard stats (admin only)
export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

// Get all pending refund requests
export const getPendingRefunds = async (req, res, next) => {
  try {
    const result = await adminService.getPendingRefunds();
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching pending refunds:", error);
    next(error);
  }
};

// Approve a refund request
export const approveRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await adminService.approveRefund(id, status);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.message.includes('Invalid status') ||
        error.message === 'Ticket not found') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    console.error("Error updating refund status:", error);
    next(error);
  }
};

// Get all refunds (including all statuses)
export const getAllRefunds = async (req, res, next) => {
  try {
    const result = await adminService.getAllRefunds();
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching all refunds:", error);
    next(error);
  }
};

// Get all events (admin)
export const getAllEvents = async (req, res, next) => {
  try {
    const result = await adminService.getAllEvents(req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    next(error);
  }
};

// Get event by ID (admin)
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.getEventById(id);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error("Error fetching event details:", error);
    next(error);
  }
};

// Create new event (admin)
export const createEvent = async (req, res, next) => {
  try {
    const eventData = req.body;
    const newEvent = await adminService.createEvent(eventData);
    
    res.status(201).json({
      success: true,
      data: newEvent,
    });
  } catch (error) {
    if (error.message.includes('Missing required fields') ||
        error.message === 'No valid fields to insert') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      error: "Server error creating event",
      details: error.message,
    });
  }
};

// Update event (admin)
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    
    const updatedEvent = await adminService.updateEvent(id, eventData);
    
    res.status(200).json({
      success: true,
      data: updatedEvent,
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === 'No valid fields to update' ||
        error.message === 'Failed to update event') {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      error: "Server error updating event",
      details: error.message,
    });
  }
};

// Delete event (admin)
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.deleteEvent(id);
    
    res.status(200).json({
      success: true,
      data: { id: result.id },
      message: result.message,
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error("Error deleting event:", error);
    next(error);
  }
};

// Manual trigger for processing pending refunds (admin only)
export const triggerRefundProcessing = async (req, res, next) => {
  try {
    const { daysThreshold } = req.body;
    const result = await adminService.triggerRefundProcessing(daysThreshold);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.message === 'Days threshold must be a positive number') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    console.error("Error triggering refund processing:", error);
    next(error);
  }
};

// Cancel an event
export const cancelEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    
    const result = await adminService.cancelEvent(id, cancelReason, req.user.id);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.message === 'You do not have permission to cancel this event' ||
        error.message === 'Event not found' ||
        error.message === 'Event is already canceled') {
      return res.status(403).json({ error: error.message });
    }
    console.error("Error canceling event:", error);
    next(error);
  }
};

// Reschedule an event
export const rescheduleEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, rescheduleReason } = req.body;
    
    const result = await adminService.rescheduleEvent(
      id, 
      newDate, 
      newTime, 
      rescheduleReason, 
      req.user.id
    );
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.message === 'New date and time are required') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'You do not have permission to reschedule this event' ||
        error.message === 'Event not found' ||
        error.message === 'Cannot reschedule a canceled event') {
      return res.status(403).json({ error: error.message });
    }
    console.error("Error rescheduling event:", error);
    next(error);
  }
};