import { BaseService } from './BaseService.js';
import { EventService } from './EventService.js';
import * as User from '../models/User.js';
import * as Ticket from '../models/Ticket.js';
import * as Event from '../models/Event.js';
import * as db from '../config/db.js';

export class AdminService extends BaseService {
  constructor() {
    super();
    this.eventService = new EventService();
  }

  // Get all users (admin only)
  async getAllUsers() {
    const query = {
      text: "SELECT id, name, email, role, profile_image, created_at FROM users ORDER BY created_at DESC",
    };

    const result = await db.query(query);
    return result.rows;
  }

  // Get user by ID (admin only)
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Update user role (admin only)
  async updateUserRole(userId, role) {
    if (!role || !["user", "admin"].includes(role)) {
      throw new Error('Role must be "user" or "admin"');
    }

    const query = {
      text: "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
      values: [role, userId],
    };

    const result = await db.query(query);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  // Delete user (admin only)
  async deleteUser(userId, currentUserId) {
    // Don't allow deleting your own account
    if (userId === currentUserId) {
      throw new Error('You cannot delete your own account');
    }

    const query = {
      text: "DELETE FROM users WHERE id = $1 RETURNING id",
      values: [userId],
    };

    const result = await db.query(query);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return { message: "User deleted successfully" };
  }

  // Dashboard stats (admin only)
  async getDashboardStats() {
    // Total number of users
    const usersQuery = {
      text: "SELECT COUNT(*) FROM users",
    };

    // Total number of events
    const eventsQuery = {
      text: "SELECT COUNT(*) FROM events",
    };

    // Total number of tickets sold
    const ticketsQuery = {
      text: "SELECT COUNT(*) FROM tickets WHERE status = 'purchased'",
    };

    // Number of categories
    const categoriesQuery = {
      text: "SELECT COUNT(*) FROM categories",
    };

    // Number of pending refunds
    const pendingRefundsQuery = {
      text: `SELECT COUNT(*) FROM tickets 
             WHERE status = 'cancelled' 
             AND (refund_status = 'requested' OR refund_status IS NULL)`,
    };

    const [
      usersResult,
      eventsResult,
      ticketsResult,
      categoriesResult,
      pendingRefundsResult,
    ] = await Promise.all([
      db.query(usersQuery),
      db.query(eventsQuery),
      db.query(ticketsQuery),
      db.query(categoriesQuery),
      db.query(pendingRefundsQuery),
    ]);

    return {
      users: parseInt(usersResult.rows[0].count),
      events: parseInt(eventsResult.rows[0].count),
      tickets: parseInt(ticketsResult.rows[0].count),
      categories: parseInt(categoriesResult.rows[0].count),
      pendingRefunds: parseInt(pendingRefundsResult.rows[0].count),
    };
  }

  // Get all pending refund requests
  async getPendingRefunds() {
    const refunds = await Ticket.findPendingRefunds();
    return {
      count: refunds.length,
      data: refunds,
    };
  }

  // Approve a refund request
  async approveRefund(ticketId, status) {
    if (!status || !["processing", "completed", "failed", "denied"].includes(status)) {
      throw new Error("Invalid status. Status must be one of: processing, completed, failed, denied");
    }

    return this.executeInTransaction(async (client) => {
      // Get the ticket with event and purchase details
      const ticketResult = await client.query(
        `SELECT t.*, e.name as event_name, e.id as event_id, 
                p.id as purchase_id, p.user_id, tt.price 
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         JOIN purchases p ON t.purchase_id = p.id
         JOIN ticket_types tt ON t.ticket_type_id = tt.id
         WHERE t.id = $1`,
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketResult.rows[0];

      // Update ticket refund status
      await client.query(
        `UPDATE tickets SET refund_status = $1 WHERE id = $2`,
        [status, ticketId]
      );

      // If completing the refund, do full refund processing
      if (status === "completed") {
        // Update ticket status to 'refunded'
        await client.query(
          `UPDATE tickets SET status = 'refunded' WHERE id = $1`,
          [ticketId]
        );

        // Get payment information
        const paymentResult = await client.query(
          `SELECT p.* FROM payments p
           JOIN payment_tickets pt ON pt.payment_id = p.id
           WHERE pt.ticket_id = $1 LIMIT 1`,
          [ticketId]
        );

        // If no direct payment association found, try to find through purchase
        let payment = null;
        if (paymentResult.rows.length > 0) {
          payment = paymentResult.rows[0];
        } else {
          // Try to find through purchase
          const purchasePaymentResult = await client.query(
            `SELECT p.* FROM payments p
             WHERE p.purchase_id = $1 LIMIT 1`,
            [ticket.purchase_id]
          );

          if (purchasePaymentResult.rows.length > 0) {
            payment = purchasePaymentResult.rows[0];
          }
        }

        // If payment found, create refund record
        if (payment) {
          const refundAmount = parseFloat(ticket.price || 0);

          // Get payment method if available (for card payments)
          let paymentMethodId = null;

          if (payment.payment_method === "card") {
            const paymentMethodResult = await client.query(
              `SELECT id FROM payment_methods 
               WHERE user_id = $1 AND is_default = true 
               ORDER BY created_at DESC LIMIT 1`,
              [ticket.user_id]
            );

            if (paymentMethodResult.rows.length > 0) {
              paymentMethodId = paymentMethodResult.rows[0].id;
            }
          }

          // Create refund record
          const refundData = {
            purchase_id: ticket.purchase_id,
            payment_id: payment.id,
            payment_method_id: paymentMethodId,
            payment_method_type: payment.payment_method || "card",
            amount: refundAmount,
            status: "completed",
            reference_id: `ref_${Date.now()}_${ticket.id}`,
            notes: `Refund for ticket ID: ${ticket.id} to event: ${ticket.event_name}`,
          };

          const insertResult = await client.query(
            `INSERT INTO refunds
             (purchase_id, payment_id, payment_method_id, payment_method_type, amount, status, reference_id, notes, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             RETURNING id`,
            [
              refundData.purchase_id,
              refundData.payment_id,
              refundData.payment_method_id,
              refundData.payment_method_type,
              refundData.amount,
              refundData.status,
              refundData.reference_id,
              refundData.notes,
            ]
          );

          const refundId = insertResult.rows[0].id;

          // Process refund based on payment method
          if (payment.payment_method === "credits") {
            // Use User.addCredits function for credit refunds
            await User.addCredits(
              ticket.user_id,
              refundAmount,
              "refund",
              `Refund for ticket to: ${ticket.event_name}`,
              refundId,
              "refund"
            );
          } else if (payment.payment_method === "card") {
            // For card payments, refund as credits using User.addCredits
            await User.addCredits(
              ticket.user_id,
              refundAmount,
              "refund",
              `Card refund converted to credits for ticket to: ${ticket.event_name}`,
              refundId,
              "refund"
            );

            console.log(
              `Card payment refunded as credits: $${refundAmount} for ticket ${ticket.id}`
            );
          }

          console.log(`Refund record created with ID: ${refundId}`);
        } else {
          console.warn(
            `No payment found for ticket ${ticketId}, skipping refund record creation`
          );
        }
      }

      // Get updated ticket data for response
      const updatedTicketResult = await client.query(
        `SELECT t.*, e.name as event_name 
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         WHERE t.id = $1`,
        [ticketId]
      );

      const updatedTicket = updatedTicketResult.rows[0];

      return {
        data: updatedTicket,
        message: `Refund status updated to ${status}`,
      };
    });
  }

  // Get all refunds (including all statuses)
  async getAllRefunds() {
    const refunds = await Ticket.getAllRefunds();

    // Count pending refunds (those with status 'requested' or null)
    const pendingCount = refunds.filter(
      (refund) =>
        refund.refund_status === "requested" || refund.refund_status === null
    ).length;

    // Process any automatic completions for tickets in 'processing' status for more than 5 days
    const autoCompletedRefunds = await Ticket.processAutomaticRefundCompletion();

    // If any refunds were automatically completed, refresh the list
    let finalRefunds = refunds;
    if (autoCompletedRefunds.length > 0) {
      console.log(
        `Automatically completed ${autoCompletedRefunds.length} refunds that were processing for more than 5 days`
      );
      finalRefunds = await Ticket.getAllRefunds();
    }

    return {
      count: pendingCount,
      total: finalRefunds.length,
      data: finalRefunds,
    };
  }

  // Get all events (admin)
  async getAllEvents(queryParams) {
    const { sort = "newest", status, search, page = 1, limit = 10 } = queryParams;

    let query = `
      SELECT e.*, 
             c.name as category_name,
             s.name as subcategory_name,
             COUNT(t.id) as tickets_sold
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN tickets t ON e.id = t.event_id AND t.status = 'purchased'
    `;

    // Build where clause
    const whereConditions = [];
    const queryParamsArray = [];

    // Status filter
    if (status && status !== "all") {
      whereConditions.push(`e.status = $${queryParamsArray.length + 1}`);
      queryParamsArray.push(status);
    }

    // Search filter
    if (search) {
      whereConditions.push(`(
        e.name ILIKE $${queryParamsArray.length + 1} OR
        e.description ILIKE $${queryParamsArray.length + 1} OR
        e.venue ILIKE $${queryParamsArray.length + 1}
      )`);
      queryParamsArray.push(`%${search}%`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    // Group by event fields
    query += ` GROUP BY e.id, c.name, s.name`;

    // Order by
    if (sort === "newest") {
      query += ` ORDER BY e.created_at DESC`;
    } else if (sort === "oldest") {
      query += ` ORDER BY e.created_at ASC`;
    } else if (sort === "name_asc") {
      query += ` ORDER BY e.name ASC`;
    } else if (sort === "name_desc") {
      query += ` ORDER BY e.name DESC`;
    } else if (sort === "date_asc") {
      query += ` ORDER BY e.date ASC, e.time ASC`;
    } else if (sort === "date_desc") {
      query += ` ORDER BY e.date DESC, e.time DESC`;
    } else if (sort === "popular") {
      query += ` ORDER BY tickets_sold DESC, e.views DESC`;
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParamsArray.length + 1} OFFSET $${queryParamsArray.length + 2}`;
    queryParamsArray.push(limit, offset);

    // Count total events for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
    `;

    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    const [eventsResult, countResult] = await Promise.all([
      db.query(query, queryParamsArray),
      db.query(countQuery, queryParamsArray.slice(0, whereConditions.length)),
    ]);

    const totalEvents = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalEvents / limit);

    return {
      count: eventsResult.rows.length,
      total: totalEvents,
      pagination: {
        current: parseInt(page),
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
      data: eventsResult.rows,
    };
  }

  // Get event by ID (admin)
  async getEventById(eventId) {
    console.log("Fetching event with ID:", eventId);

    // Updated query to match new schema (removed organizer references)
    const eventQuery = {
      text: `
        SELECT e.*, 
               c.name as category_name, c.slug as category_slug,
               s.name as subcategory_name, s.slug as subcategory_slug
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN subcategories s ON e.subcategory_id = s.id
        WHERE e.id = $1
      `,
      values: [parseInt(eventId)],
    };

    const eventResult = await db.query(eventQuery);
    const event = eventResult.rows[0];

    if (!event) {
      throw new Error('Event not found');
    }

    // Get ticket types
    const ticketTypesQuery = {
      text: `
        SELECT * FROM ticket_types
        WHERE event_id = $1
        ORDER BY price ASC
      `,
      values: [eventId],
    };

    const ticketTypesResult = await db.query(ticketTypesQuery);
    const ticketTypes = ticketTypesResult.rows;

    // Get tickets sold
    const ticketsSoldQuery = {
      text: `
        SELECT COUNT(*) as tickets_sold
        FROM tickets
        WHERE event_id = $1 AND status = 'purchased'
      `,
      values: [eventId],
    };

    const ticketsSoldResult = await db.query(ticketsSoldQuery);
    const ticketsSold = parseInt(ticketsSoldResult.rows[0].tickets_sold);

    return {
      event,
      ticketTypes,
      ticketsSold,
    };
  }

  // Create new event (admin)
  async createEvent(eventData) {
    console.log("Creating event with data:", eventData);

    // Validate required fields
    const requiredFields = [
      "name",
      "slug",
      "description",
      "date",
      "venue",
      "address",
      "city",
      "category_id",
    ];
    const missingFields = requiredFields.filter((field) => !eventData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Filter out any fields that shouldn't be directly inserted
    const allowedFields = [
      "name",
      "slug",
      "description",
      "date",
      "time",
      "end_time",
      "venue",
      "address",
      "city",
      "latitude",
      "longitude",
      "image_url",
      "category_id",
      "subcategory_id",
      "min_price",
      "max_price",
      "status",
      "cancellation_policy",
      "featured",
      "status_change_reason",
    ];

    const fieldsToInsert = {};

    // Process each field, ensuring the correct data type
    Object.keys(eventData).forEach((key) => {
      if (allowedFields.includes(key)) {
        const value = eventData[key];

        // Skip undefined values
        if (value === undefined) return;

        // Skip empty strings for numeric fields (they'll be NULL in the database)
        if (
          [
            "category_id",
            "subcategory_id",
            "organizer_id",
            "min_price",
            "max_price",
          ].includes(key)
        ) {
          if (value === null || value === "") {
            // Don't include this field, it will be NULL by default
            return;
          }
        }

        // Handle boolean fields
        if (key === "featured") {
          fieldsToInsert[key] = value === true || value === "true";
        }
        // Handle other fields
        else {
          fieldsToInsert[key] = value;
        }
      }
    });

    // Create a query to insert the event
    const fields = Object.keys(fieldsToInsert);
    const placeholders = fields.map((_, index) => `$${index + 1}`);
    const values = Object.values(fieldsToInsert);

    if (fields.length === 0) {
      throw new Error("No valid fields to insert");
    }

    const createQuery = {
      text: `
        INSERT INTO events(${fields.join(", ")})
        VALUES(${placeholders.join(", ")})
        RETURNING *
      `,
      values,
    };

    console.log("Insert query:", createQuery.text);
    console.log("Insert values:", values);

    const result = await db.query(createQuery);
    const newEvent = result.rows[0];

    console.log("Event created successfully:", newEvent.id);

    return newEvent;
  }

  // Update event (admin)
  async updateEvent(eventId, eventData) {
    console.log("Updating event with ID:", eventId);
    console.log("Event data received:", eventData);

    // First, get the current event to check its status
    const currentEventQuery = {
      text: "SELECT * FROM events WHERE id = $1",
      values: [eventId],
    };

    const currentEventResult = await db.query(currentEventQuery);

    if (currentEventResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    const currentEvent = currentEventResult.rows[0];

    // Check if event exists using direct query
    const checkQuery = {
      text: "SELECT id FROM events WHERE id = $1",
      values: [eventId],
    };

    const checkResult = await db.query(checkQuery);

    if (checkResult.rows.length === 0) {
      throw new Error('Event not found');
    }

    // Filter out any fields that shouldn't be directly updated
    const allowedFields = [
      "name",
      "slug",
      "description",
      "date",
      "time",
      "end_time",
      "venue",
      "address",
      "city",
      "latitude",
      "longitude",
      "image_url",
      "category_id",
      "subcategory_id",
      "min_price",
      "max_price",
      "status",
      "cancellation_policy",
      "featured",
      "status_change_reason",
    ];

    // Construct the update query with only allowed fields
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Track if we're updating the status_change_reason
    let isUpdatingReason = false;
    let isChangingStatus = false;

    // Process each field, ensuring the correct data type
    Object.keys(eventData).forEach((key) => {
      if (allowedFields.includes(key)) {
        const value = eventData[key];

        // Skip undefined values
        if (value === undefined) return;

        // Track if we're updating status_change_reason
        if (
          key === "status_change_reason" &&
          value !== currentEvent.status_change_reason
        ) {
          isUpdatingReason = true;
        }

        // Track if we're changing status
        if (key === "status" && value !== currentEvent.status) {
          isChangingStatus = true;
        }

        // Handle numeric fields - nullify empty strings
        if (
          [
            "category_id",
            "subcategory_id",
            "organizer_id",
            "min_price",
            "max_price",
          ].includes(key)
        ) {
          if (value === null || value === "") {
            updates.push(`${key} = NULL`);
          } else {
            updates.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        // Handle boolean fields
        else if (key === "featured") {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value === true || value === "true");
          paramIndex++;
        }
        // Handle other fields
        else {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
    });

    // Special case: If we're updating the status to 'rescheduled' for the first time
    if (
      eventData.status === "rescheduled" &&
      currentEvent.status !== "rescheduled"
    ) {
      // Store original date/time if not already set
      if (!currentEvent.original_date) {
        updates.push(`original_date = $${paramIndex}`);
        values.push(currentEvent.date);
        paramIndex++;
      }

      if (!currentEvent.original_time) {
        updates.push(`original_time = $${paramIndex}`);
        values.push(currentEvent.time);
        paramIndex++;
      }
    }

    // Set notification_status to 'pending' if:
    // 1. Status is changing to canceled or rescheduled
    // 2. We're updating the reason for an already canceled or rescheduled event
    if (
      (isChangingStatus &&
        ["canceled", "rescheduled"].includes(eventData.status)) ||
      (isUpdatingReason &&
        ["canceled", "rescheduled"].includes(currentEvent.status))
    ) {
      updates.push(`notification_status = 'pending'`);
      updates.push(`status_changed_at = CURRENT_TIMESTAMP`);
      console.log("Setting notification status to pending for re-notification");
    }

    // If there are no fields to update, return early
    if (updates.length === 0) {
      throw new Error("No valid fields to update");
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add event ID as the last parameter
    values.push(eventId);

    const updateQuery = {
      text: `
        UPDATE events
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values,
    };

    console.log("Update query:", updateQuery.text);
    console.log("Update values:", values);

    const result = await db.query(updateQuery);

    if (result.rows.length === 0) {
      throw new Error("Failed to update event");
    }

    const updatedEvent = result.rows[0];

    console.log("Event updated successfully:", updatedEvent.id);
    console.log("Notification status:", updatedEvent.notification_status);

    return updatedEvent;
  }

  // Delete event (admin)
  async deleteEvent(eventId) {
    // Check if event exists
    const existingEvent = await Event.findById(eventId);

    if (!existingEvent) {
      throw new Error('Event not found');
    }

    // Check if tickets have been sold
    const ticketsQuery = {
      text: `
        SELECT COUNT(*) as count
        FROM tickets
        WHERE event_id = $1 AND status = 'purchased'
      `,
      values: [eventId],
    };

    const ticketsResult = await db.query(ticketsQuery);
    const ticketsSold = parseInt(ticketsResult.rows[0].count);

    if (ticketsSold > 0) {
      // Don't delete, just set status to cancelled
      await Event.update(eventId, { status: "cancelled" });

      return {
        id: eventId,
        message: "Event has been cancelled since tickets have been sold",
      };
    }

    // Delete event
    await Event.deleteEvent(eventId);

    return {
      id: eventId,
      message: "Event deleted successfully",
    };
  }

  // Manual trigger for processing pending refunds (admin only)
  async triggerRefundProcessing(daysThreshold) {
    // Use default of 5 days if not specified
    const threshold = parseInt(daysThreshold ?? 5, 10);

    if (isNaN(threshold) || threshold < 0) {
      throw new Error("Days threshold must be a positive number");
    }

    // Import the Ticket model for refund processing
    const TicketModel = await import("../models/Ticket.js");

    // Process refunds that have been in 'processing' status for more than the threshold days
    const processedRefunds = await TicketModel.processAutomaticRefundCompletion(threshold);

    return {
      message: `Successfully processed ${processedRefunds.length} pending refunds`,
      count: processedRefunds.length,
      refunds: processedRefunds,
    };
  }

  // Cancel an event
  async cancelEvent(eventId, cancelReason, userId) {
    // Check if user has permission
    const hasPermission = await this.eventService.checkEventPermission(eventId, userId);

    if (!hasPermission) {
      throw new Error('You do not have permission to cancel this event');
    }

    return this.executeInTransaction(async (client) => {
      // Get current event details
      const eventResult = await client.query(
        "SELECT * FROM events WHERE id = $1",
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      const event = eventResult.rows[0];

      if (event.status === "canceled") {
        throw new Error('Event is already canceled');
      }

      // Update event status
      await client.query(
        `
        UPDATE events 
        SET status = 'canceled', 
            status_change_reason = $1, 
            status_changed_at = CURRENT_TIMESTAMP,
            notification_status = 'pending'
        WHERE id = $2
      `,
        [cancelReason || "Event canceled by organizer", eventId]
      );

      return {
        message: "Event canceled successfully. Refunds will be processed automatically.",
      };
    });
  }

  // Reschedule an event
  async rescheduleEvent(eventId, newDate, newTime, rescheduleReason, userId) {
    // Validate new date and time
    if (!newDate || !newTime) {
      throw new Error('New date and time are required');
    }

    // Check if user has permission
    const hasPermission = await this.eventService.checkEventPermission(eventId, userId);

    if (!hasPermission) {
      throw new Error('You do not have permission to reschedule this event');
    }

    return this.executeInTransaction(async (client) => {
      // Get current event details
      const eventResult = await client.query(
        "SELECT * FROM events WHERE id = $1",
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      const event = eventResult.rows[0];

      if (event.status === "canceled") {
        throw new Error('Cannot reschedule a canceled event');
      }

      // Update event with new date and time
      await client.query(
        `
        UPDATE events 
        SET date = $1, 
            time = $2, 
            original_date = COALESCE(original_date, date),
            original_time = COALESCE(original_time, time),
            status = 'rescheduled', 
            status_change_reason = $3,
            status_changed_at = CURRENT_TIMESTAMP,
            notification_status = 'pending'
        WHERE id = $4
      `,
        [
          newDate,
          newTime,
          rescheduleReason || "Event rescheduled by organizer",
          eventId,
        ]
      );

      return {
        message: "Event rescheduled successfully. Attendees will be notified automatically.",
      };
    });
  }
}