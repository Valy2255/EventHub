// backend/controllers/checkInController.js
import * as Ticket from "../models/Ticket.js";
import * as Event from "../models/Event.js";
import * as db from '../config/db.js';

// Find ticket by QR code or ID
export const findTicketByQr = async (req, res, next) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: "Ticket data is required"
      });
    }
    
    let ticketId;
    let isManualEntry = false;
    
    // Handle different input formats:
    // 1. JSON object with id and hash (from QR scanner)
    // 2. Plain number (from manual entry)
    // 3. String that can be parsed as JSON
    // 4. String that represents a number
    
    if (typeof qrData === 'object') {
      // Direct object from request body
      if (qrData.id) {
        ticketId = qrData.id;
        // if hash is "manual-entry", it's manual and we skip hash verification
        isManualEntry = qrData.hash === "manual-entry";
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid ticket data: missing ID"
        });
      }
    } else if (typeof qrData === 'number') {
      // Direct number
      ticketId = qrData;
      isManualEntry = true;
    } else if (typeof qrData === 'string') {
      // Try parsing as number first
      if (/^\d+$/.test(qrData.trim())) {
        ticketId = parseInt(qrData.trim());
        isManualEntry = true;
      } else {
        // Try parsing as JSON
        try {
          const parsedData = JSON.parse(qrData);
          if (parsedData.id) {
            ticketId = parsedData.id;
            isManualEntry = parsedData.hash === "manual-entry";
          } else {
            return res.status(400).json({
              success: false,
              error: "Invalid ticket data: missing ID"
            });
          }
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            error: "Invalid ticket data format"
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid ticket data type"
      });
    }
    
    // Find the ticket in database
    const query = {
      text: `
        SELECT t.*, 
               e.name as event_name, e.date, e.time, e.venue,
               tt.name as ticket_type_name,
               u.name as user_name, u.email as user_email
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.status = 'purchased'
      `,
      values: [ticketId]
    };
    
    const result = await db.query(query);
    const ticket = result.rows[0];
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found or has been cancelled"
      });
    }
    
    // Verify hash if not manual entry and hash is provided
    if (!isManualEntry && qrData.hash) {
      const expectedHash = Ticket.generateTicketHash(ticket.id, ticket.event_id, ticket.user_id);
      if (expectedHash !== qrData.hash) {
        return res.status(403).json({
          success: false,
          error: "Invalid ticket signature - possible forgery attempt"
        });
      }
    }
    
    // If ticket is already checked in
    if (ticket.checked_in) {
      return res.status(400).json({
        success: false,
        error: "This ticket has already been used",
        data: {
          ticket: {
            id: ticket.id,
            event_name: ticket.event_name,
            user_name: ticket.user_name,
            ticket_type_name: ticket.ticket_type_name,
            checked_in_at: ticket.checked_in_at
          }
        }
      });
    }
    
    // Check if the ticket is for a future event
    const eventDate = new Date(ticket.date);
    eventDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let status = "PAST_EVENT";
    if (eventDate > now) {
      status = "FUTURE_EVENT";
    } else if (eventDate.getTime() === now.getTime()) {
      status = "VALID_TODAY";
    }
    
    // Return the ticket details
    res.status(200).json({
      success: true,
      data: {
        ticket: {
          id: ticket.id,
          event_id: ticket.event_id,
          event_name: ticket.event_name,
          event_date: ticket.date,
          event_time: ticket.time,
          ticket_type_name: ticket.ticket_type_name,
          user_name: ticket.user_name,
          user_email: ticket.user_email,
          status: ticket.status,
          checked_in: ticket.checked_in,
          venue: ticket.venue
        },
        status
      }
    });
  } catch (error) {
    console.error("Error finding ticket:", error);
    next(error);
  }
};

// Check in a ticket
export const checkInTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const adminId = req.user.id;
    
    // Find the ticket
    const query = {
      text: `
        SELECT t.*, 
               e.name as event_name, e.date, e.time, e.venue,
               tt.name as ticket_type_name,
               u.name as user_name
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.status = 'purchased'
      `,
      values: [ticketId]
    };
    
    const result = await db.query(query);
    const ticket = result.rows[0];
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found or has been cancelled"
      });
    }
    
    // If ticket is already checked in
    if (ticket.checked_in) {
      return res.status(400).json({
        success: false,
        error: "This ticket has already been used",
        data: {
          ticket: {
            id: ticket.id,
            event_name: ticket.event_name,
            user_name: ticket.user_name,
            ticket_type: ticket.ticket_type_name,
            checked_in_at: ticket.checked_in_at
          }
        }
      });
    }
    
    // Update check-in status
    const updateQuery = {
      text: `
        UPDATE tickets
        SET checked_in = true,
            checked_in_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      values: [ticketId]
    };
    
    const updateResult = await db.query(updateQuery);
    const updatedTicket = updateResult.rows[0];
    
    // Return success
    res.status(200).json({
      success: true,
      message: "Ticket checked in successfully",
      data: {
        ticket: {
          id: updatedTicket.id,
          event_name: ticket.event_name,
          user_name: ticket.user_name,
          ticket_type_name: ticket.ticket_type_name,
          checked_in_at: updatedTicket.checked_in_at
        }
      }
    });
  } catch (error) {
    console.error("Error checking in ticket:", error);
    next(error);
  }
};

// Get check-in stats for an event
export const getEventCheckInStats = async (req, res, next) => {
    try {
      const { eventId } = req.params;
      
      // Get event details
      const eventQuery = {
        text: `SELECT * FROM events WHERE id = $1`,
        values: [eventId]
      };
      
      const eventResult = await db.query(eventQuery);
      const event = eventResult.rows[0];
      
      if (!event) {
        return res.status(404).json({
          success: false,
          error: "Event not found"
        });
      }
      
      // Get stats
      const statsQuery = {
        text: `
          SELECT 
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status = 'purchased' THEN 1 ELSE 0 END) as valid_tickets,
            SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as checked_in_count
          FROM tickets
          WHERE event_id = $1
        `,
        values: [eventId]
      };
      
      const statsResult = await db.query(statsQuery);
      const stats = statsResult.rows[0];
      
      // Get recent check-ins (removed checked_in_by column that doesn't exist)
      const recentQuery = {
        text: `
          SELECT t.id, t.checked_in_at, 
                 tt.name as ticket_type,
                 u.name as user_name
          FROM tickets t
          JOIN ticket_types tt ON t.ticket_type_id = tt.id
          JOIN users u ON t.user_id = u.id
          WHERE t.event_id = $1 AND t.checked_in = true
          ORDER BY t.checked_in_at DESC
          LIMIT 10
        `,
        values: [eventId]
      };
      
      const recentResult = await db.query(recentQuery);
      
      // Calculate check-in percentage
      const validTickets = parseInt(stats.valid_tickets) || 0;
      const checkedInCount = parseInt(stats.checked_in_count) || 0;
      const checkInPercentage = validTickets > 0 
        ? Math.round((checkedInCount / validTickets) * 100) 
        : 0;
      
      res.status(200).json({
        success: true,
        data: {
          event: {
            id: event.id,
            name: event.name,
            date: event.date,
            time: event.time,
            venue: event.venue
          },
          stats: {
            totalTickets: parseInt(stats.total_tickets) || 0,
            validTickets,
            checkedInCount,
            checkInPercentage,
            remaining: validTickets - checkedInCount
          },
          recentCheckIns: recentResult.rows
        }
      });
    } catch (error) {
      console.error("Error getting check-in stats:", error);
      next(error);
    }
  };