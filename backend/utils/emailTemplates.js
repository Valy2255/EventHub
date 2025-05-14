// backend/utils/emailTemplates.js
import config from "../config/config.js";

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

// Get email template by name with data
export const getEmailTemplate = (templateName, data) => {
  const templates = {
    eventCanceled: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Event Canceled: ${data.eventName}</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello ${data.userName},</h2>
            <p>We regret to inform you that the event "${
              data.eventName
            }" scheduled for ${formatDate(
        data.eventDate
      )} has been canceled.</p>
            
            <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Refund Information</h3>
              <p><strong>Amount:</strong> $${parseFloat(
                data.refundAmount
              ).toFixed(2)}</p>
              <p><strong>Refund Method:</strong> ${data.refundMethod}</p>
              <p><strong>Expected Processing Time:</strong> ${
                data.estimatedRefundTime
              }</p>
              <p><strong>Order Reference:</strong> ${data.orderReference}</p>
            </div>
            
            <p>You don't need to take any action. The refund will be automatically processed to your original payment method.</p>
            <p>We apologize for any inconvenience this may have caused. If you have any questions about the refund, please contact our support team.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                config.cors.origin
              }/profile/purchases" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Purchases</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${
              data.userEmail
            } regarding your purchase on EventHub.</p>
          </div>
        </div>
      `,
      text: `
Event Canceled: ${data.eventName}

Hello ${data.userName},

We regret to inform you that the event "${
        data.eventName
      }" scheduled for ${formatDate(data.eventDate)} has been canceled.

Refund Information:
- Amount: $${parseFloat(data.refundAmount).toFixed(2)}
- Refund Method: ${data.refundMethod}
- Expected Processing Time: ${data.estimatedRefundTime}
- Order Reference: ${data.orderReference}

You don't need to take any action. The refund will be automatically processed to your original payment method.

We apologize for any inconvenience this may have caused. If you have any questions about the refund, please contact our support team.

View Your Purchases: ${config.cors.origin}/profile/purchases

This email was sent to ${data.userEmail} regarding your purchase on EventHub.
      `,
    },

    eventRescheduled: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Event Rescheduled: ${data.eventName}</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello ${data.userName},</h2>
            <p>We're writing to inform you that the event "${
              data.eventName
            }" has been rescheduled.</p>
            
            <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p><strong>Original Date:</strong> ${formatDate(
                data.originalDate
              )} at ${formatTime(data.originalTime)}</p>
              <p><strong>New Date:</strong> ${formatDate(
                data.newDate
              )} at ${formatTime(data.newTime)}</p>
              <p><strong>Location:</strong> ${data.venue}</p>
              ${
                data.status_change_reason
                  ? `<p><strong>Reason:</strong> ${data.status_change_reason}</p>`
                  : ""
              }
            </div>
            
            <p>Your tickets will remain valid for the new date. No action is required from you.</p>
            <p>If you're unable to attend on the new date, please contact our support team to discuss your options.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                config.cors.origin
              }/profile/tickets" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Tickets</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${
              data.userEmail
            } regarding your tickets on EventHub.</p>
          </div>
        </div>
      `,
      text: `
Event Rescheduled: ${data.eventName}

Hello ${data.userName},

We're writing to inform you that the event "${
        data.eventName
      }" has been rescheduled. 
      
Original Date: ${formatDate(data.originalDate)} at ${formatTime(
        data.originalTime
      )}
New Date: ${formatDate(data.newDate)} at ${formatTime(data.newTime)}
Location: ${data.venue}

Your tickets will remain valid for the new date. No action is required from you.

If you're unable to attend on the new date, please contact our support team to discuss your options.

View Your Tickets: ${config.cors.origin}/profile/tickets

This email was sent to ${data.userEmail} regarding your tickets on EventHub.
      `,
    },

    eventReminder: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Your Event is Coming Up!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Hello ${data.userName},</h2>
            <p>This is a friendly reminder that you have tickets to "${
              data.eventName
            }" happening in one week.</p>
            
            <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${data.eventName}</h3>
              <p><strong>Date:</strong> ${formatDate(data.eventDate)}</p>
              <p><strong>Time:</strong> ${formatTime(data.eventTime)}</p>
              <p><strong>Location:</strong> ${data.venue}, ${data.city}</p>
            </div>
            
            <p>We look forward to seeing you there!</p>
            <p>Remember to bring your tickets (printed or on your mobile device) to the event for entry.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                config.cors.origin
              }/profile/tickets" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Tickets</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${
              data.userEmail
            } regarding your upcoming event on EventHub.</p>
          </div>
        </div>
      `,
      text: `
Your Event is Coming Up!

Hello ${data.userName},

This is a friendly reminder that you have tickets to "${
        data.eventName
      }" happening in one week.

Event Details:
- ${data.eventName}
- Date: ${formatDate(data.eventDate)}
- Time: ${formatTime(data.eventTime)}
- Location: ${data.venue}, ${data.city}

We look forward to seeing you there!

Remember to bring your tickets (printed or on your mobile device) to the event for entry.

View Your Tickets: ${config.cors.origin}/profile/tickets

This email was sent to ${
        data.userEmail
      } regarding your upcoming event on EventHub.
      `,
    },
  };

  return (
    templates[templateName] || {
      html: "<p>Email template not found</p>",
      text: "Email template not found",
    }
  );
};

export default { getEmailTemplate, formatDate, formatTime };
