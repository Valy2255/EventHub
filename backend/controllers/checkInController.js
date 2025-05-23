// backend/controllers/checkInController.js
import { CheckInService } from '../services/CheckInService.js';

const checkInService = new CheckInService();

// Find ticket by QR code or ID - EXACT same route and functionality
export const findTicketByQr = async (req, res, next) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: "Ticket data is required"
      });
    }
    
    const result = await checkInService.findTicketByQr(qrData);
    
    // Return success - same format as original
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error finding ticket:", error);
    
    // Handle already checked in error - same as original
    if (error.isAlreadyCheckedIn) {
      return res.status(400).json({
        success: false,
        error: error.message,
        data: {
          ticket: error.ticketData
        }
      });
    }
    
    // Handle other errors - same as original
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Check in a ticket - EXACT same route and functionality
export const checkInTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    
    const result = await checkInService.checkInTicket(parseInt(ticketId));
    
    // Return success - same format as original
    res.status(200).json({
      success: true,
      message: "Ticket checked in successfully",
      data: result
    });
  } catch (error) {
    console.error("Error checking in ticket:", error);
    
    // Handle already checked in error - same as original
    if (error.isAlreadyCheckedIn) {
      return res.status(400).json({
        success: false,
        error: error.message,
        data: {
          ticket: error.ticketData
        }
      });
    }
    
    // Handle ticket not found - same as original
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    // Handle other errors - same as original
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get check-in stats for an event - EXACT same route and functionality
export const getEventCheckInStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const result = await checkInService.getEventCheckInStats(parseInt(eventId));
    
    // Return success - same format as original
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error getting check-in stats:", error);
    
    // Handle event not found - same as original
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    // Handle other errors - same as original
    res.status(500).json({
      success: false,
      error: "Failed to get check-in statistics"
    });
  }
};