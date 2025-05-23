// backend/utils/emailService.js
import nodemailer from "nodemailer";
import config from "../config/config.js";
import * as db from "../config/db.js";

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Format date for display in emails
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format time for display in emails
const formatTime = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

// Send welcome email on registration
export const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: email,
      subject: "Welcome to EventHub!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Welcome to EventHub!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello ${name},</h2>
            <p>Thank you for joining EventHub! We're excited to have you on board.</p>
            <p>With your new account, you can:</p>
            <ul>
              <li>Discover and purchase tickets for amazing events</li>
              <li>Manage your upcoming events</li>
              <li>Receive special offers and updates</li>
            </ul>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${config.cors.origin}/events/search" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore Events</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${email}. If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
};

// Send ticket confirmation email
export const sendTicketEmail = async (email, name, tickets, orderNumber) => {
  try {
    // Group tickets by event
    const ticketsByEvent = {};

    tickets.forEach((ticket) => {
      if (!ticketsByEvent[ticket.event_id]) {
        ticketsByEvent[ticket.event_id] = {
          eventName: ticket.event_name,
          eventDate: ticket.date,
          eventTime: ticket.time,
          eventVenue: ticket.venue,
          tickets: [],
        };
      }

      ticketsByEvent[ticket.event_id].tickets.push(ticket);
    });

    // Create HTML for ticket details
    let ticketsHtml = "";

    Object.values(ticketsByEvent).forEach((eventTickets) => {
      ticketsHtml += `
        <div style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f5f5f5; padding: 15px; border-bottom: 1px solid #ddd;">
            <h3 style="margin: 0; color: #333;">${eventTickets.eventName}</h3>
            <p style="margin: 8px 0 0 0; color: #666;">
              <strong>Date:</strong> ${formatDate(
                eventTickets.eventDate
              )} at ${formatTime(eventTickets.eventTime)}<br>
              <strong>Venue:</strong> ${eventTickets.eventVenue}
            </p>
          </div>
          <div style="padding: 15px;">
            <p><strong>Tickets:</strong></p>
            <ul style="padding-left: 20px;">
      `;

      eventTickets.tickets.forEach((ticket) => {
        ticketsHtml += `
          <li style="margin-bottom: 15px;">
            <strong>ID</strong> - ${ticket.id}<br>
            <strong>${ticket.ticket_type_name}</strong> - $${parseFloat(
          ticket.price
        ).toFixed(2)}
            <div style="margin-top: 10px;">
              <img src="${
                ticket.qr_code
              }" alt="Ticket QR Code" style="max-width: 200px; height: auto;">
            </div>
          </li>
        `;
      });

      ticketsHtml += `
            </ul>
          </div>
        </div>
      `;
    });

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: email,
      subject: "Your EventHub Tickets",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Your Tickets are Ready!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello ${name},</h2>
            <p>Thank you for your purchase. Your tickets are attached below.</p>
            
            <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
              <p style="margin: 10px 0 0 0;"><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="margin-top: 30px;">
              <h3>Your Tickets</h3>
              ${ticketsHtml}
            </div>
            
            <div style="margin-top: 30px;">
              <p>You can also view your tickets in your <a href="${
                config.cors.origin
              }/profile/tickets" style="color: #9333ea; text-decoration: none;">account dashboard</a>.</p>
              <p>Important: Please bring your tickets (printed or on your mobile device) to the event for entry.</p>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${email} regarding your recent purchase on EventHub.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Ticket email sent to ${email}`);
  } catch (error) {
    console.error("Error sending ticket email:", error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Reset Your Password</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello,</h2>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            </div>
            
            <p>If you didn't request a password reset, you can ignore this email.</p>
            <p>This link is valid for one hour.</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${email} regarding your EventHub account.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (
  email,
  name,
  payment,
  tickets,
  orderNumber
) => {
  try {
    const totalAmount = parseFloat(payment.amount).toFixed(2);

    // Format ticket items
    let ticketItems = "";
    tickets.forEach((ticket) => {
      ticketItems += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${
            ticket.event_name
          } - ${ticket.ticket_type_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${parseFloat(
            ticket.price
          ).toFixed(2)}</td>
        </tr>
      `;
    });

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: email,
      subject: "Order Confirmation - EventHub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Order Confirmation</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello ${name},</h2>
            <p>Thank you for your order. We've received your payment and your tickets are now available in your account.</p>
            
            <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
              <p style="margin: 10px 0 0 0;"><strong>Date:</strong> ${new Date(
                payment.created_at
              ).toLocaleDateString()}</p>
              <p style="margin: 10px 0 0 0;"><strong>Payment Method:</strong> ${
                payment.payment_method
              }</p>
            </div>
            
            <div style="margin-top: 30px;">
              <h3>Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
                    <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketItems}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding: 10px; font-weight: bold;">Total</td>
                    <td style="padding: 10px; font-weight: bold; text-align: right;">$${totalAmount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                config.cors.origin
              }/profile/tickets" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Tickets</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${email} regarding your recent purchase on EventHub.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error;
  }
};

// Send event canceled notification with refund info
export const sendEventCanceledEmail = async (user, event, purchaseInfo, refundInfo) => {
  try {
    const { getEmailTemplate } = await import('./emailTemplates.js');
    
    const template = getEmailTemplate('eventCanceled', {
      userName: user.name,
      userEmail: user.email,
      eventName: event.name,
      eventDate: event.date,
      refundAmount: refundInfo.amount,
      refundMethod: refundInfo.paymentMethod === 'credits' ? 'Account Credits' : 'Original Payment Method',
      estimatedRefundTime: '5-10 business days',
      orderReference: purchaseInfo.order_id
    });
    
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: user.email,
      subject: `Event Canceled: ${event.name} - Refund Processing`,
      html: template.html,
      text: template.text
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Event cancellation email sent to ${user.email}`);
    
    // Log the notification
    await logNotification(user.id, event.id, 'event_canceled', user.email, template.text);
    
    return true;
  } catch (error) {
    console.error("Error sending event cancellation email:", error);
    throw error;
  }
};

// Send event rescheduled notification
export const sendEventRescheduledEmail = async (user, event) => {
  try {
    const { getEmailTemplate } = await import('./emailTemplates.js');
    
    const template = getEmailTemplate('eventRescheduled', {
      userName: user.name,
      userEmail: user.email,
      eventName: event.name,
      originalDate: event.original_date,
      originalTime: event.original_time,
      newDate: event.date,
      newTime: event.time,
      venue: event.venue
    });
    
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: user.email,
      subject: `Event Rescheduled: ${event.name}`,
      html: template.html,
      text: template.text
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Event rescheduling email sent to ${user.email}`);
    
    // Log the notification
    await logNotification(user.id, event.id, 'event_rescheduled', user.email, template.text);
    
    return true;
  } catch (error) {
    console.error("Error sending event rescheduling email:", error);
    throw error;
  }
};

// Send event reminder (1 week before)
export const sendEventReminderEmail = async (user, event) => {
  try {
    const { getEmailTemplate } = await import('./emailTemplates.js');
    
    const template = getEmailTemplate('eventReminder', {
      userName: user.name,
      userEmail: user.email,
      eventName: event.name,
      eventDate: event.date,
      eventTime: event.time,
      venue: event.venue,
      city: event.city
    });
    
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: user.email,
      subject: `Reminder: ${event.name} is Coming Up!`,
      html: template.html,
      text: template.text
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Event reminder email sent to ${user.email}`);
    
    // Log the notification
    await logNotification(user.id, event.id, 'event_reminder', user.email, template.text);
    
    return true;
  } catch (error) {
    console.error("Error sending event reminder email:", error);
    throw error;
  }
};

// Log notification to database
const logNotification = async (userId, eventId, notificationType, emailAddress, messageContent = '') => {
  try {
    const query = {
      text: `INSERT INTO notification_history 
             (user_id, event_id, notification_type, email_address, message_content, created_at) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      values: [userId, eventId, notificationType, emailAddress, messageContent]
    };
    
    await db.query(query);
    console.log(`Notification logged for user ${userId}, event ${eventId}, type ${notificationType}`);
  } catch (error) {
    console.error('Error logging notification:', error);
  }
};