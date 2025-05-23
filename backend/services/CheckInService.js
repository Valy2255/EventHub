// backend/services/CheckInService.js
import { BaseService } from './BaseService.js';
import * as CheckInModel from '../models/CheckIn.js';
import * as Ticket from '../models/Ticket.js';

export class CheckInService extends BaseService {
  /**
   * Find and validate ticket by QR data - exact same logic as original
   */
  async findTicketByQr(qrData) {
    let ticketId;
    let isManualEntry = false;
    
    // Handle different input formats (same as original)
    if (typeof qrData === 'object') {
      if (qrData.id) {
        ticketId = qrData.id;
        isManualEntry = qrData.hash === "manual-entry";
      } else {
        throw new Error('Invalid ticket data: missing ID');
      }
    } else if (typeof qrData === 'number') {
      ticketId = qrData;
      isManualEntry = true;
    } else if (typeof qrData === 'string') {
      if (/^\d+$/.test(qrData.trim())) {
        ticketId = parseInt(qrData.trim());
        isManualEntry = true;
      } else {
        try {
          const parsedData = JSON.parse(qrData);
          if (parsedData.id) {
            ticketId = parsedData.id;
            isManualEntry = parsedData.hash === "manual-entry";
          } else {
            throw new Error('Invalid ticket data: missing ID');
          }
        } catch (parseError) {
          throw new Error('Invalid ticket data format');
        }
      }
    } else {
      throw new Error('Invalid ticket data type');
    }
    
    // Find the ticket in database (same as original)
    const ticket = await CheckInModel.findTicketById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found or has been cancelled');
    }
    
    // Verify hash if not manual entry and hash is provided (same as original)
    if (!isManualEntry && qrData.hash) {
      const expectedHash = Ticket.generateTicketHash(ticket.id, ticket.event_id, ticket.user_id);
      if (expectedHash !== qrData.hash) {
        throw new Error('Invalid ticket signature - possible forgery attempt');
      }
    }
    
    // If ticket is already checked in (same as original)
    if (ticket.checked_in) {
      const error = new Error('This ticket has already been used');
      error.isAlreadyCheckedIn = true;
      error.ticketData = {
        id: ticket.id,
        event_name: ticket.event_name,
        user_name: ticket.user_name,
        ticket_type_name: ticket.ticket_type_name,
        checked_in_at: ticket.checked_in_at
      };
      throw error;
    }
    
    // Check if the ticket is for a future event (same as original)
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
    
    // Return the ticket details (same format as original)
    return {
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
    };
  }
  
  /**
   * Check in a ticket - exact same logic as original
   */
  async checkInTicket(ticketId) {
    // Find the ticket (same as original)
    const ticket = await CheckInModel.findTicketById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found or has been cancelled');
    }
    
    // If ticket is already checked in (same as original)
    if (ticket.checked_in) {
      const error = new Error('This ticket has already been used');
      error.isAlreadyCheckedIn = true;
      error.ticketData = {
        id: ticket.id,
        event_name: ticket.event_name,
        user_name: ticket.user_name,
        ticket_type: ticket.ticket_type_name,
        checked_in_at: ticket.checked_in_at
      };
      throw error;
    }
    
    // Update check-in status (same as original)
    const updatedTicket = await CheckInModel.updateCheckInStatus(ticketId);
    
    // Return success (same format as original)
    return {
      ticket: {
        id: updatedTicket.id,
        event_name: ticket.event_name,
        user_name: ticket.user_name,
        ticket_type_name: ticket.ticket_type_name,
        checked_in_at: updatedTicket.checked_in_at
      }
    };
  }
  
  /**
   * Get event check-in stats - exact same logic as original
   */
  async getEventCheckInStats(eventId) {
    // Get event details (same as original)
    const event = await CheckInModel.findEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Get stats (same as original)
    const stats = await CheckInModel.getEventStats(eventId);
    
    // Get recent check-ins (same as original)
    const recentCheckIns = await CheckInModel.getRecentCheckIns(eventId);
    
    // Calculate check-in percentage (same as original)
    const validTickets = parseInt(stats.valid_tickets) || 0;
    const checkedInCount = parseInt(stats.checked_in_count) || 0;
    const checkInPercentage = validTickets > 0 
      ? Math.round((checkedInCount / validTickets) * 100) 
      : 0;
    
    return {
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
      recentCheckIns
    };
  }
}