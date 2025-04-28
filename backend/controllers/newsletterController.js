// backend/controllers/newsletterController.js
import sendEmail from '../utils/sendEmail.js';
import config from '../config/config.js';

/**
 * Subscribe a user to the newsletter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Here you would typically add the email to your newsletter database
    // For this example, we'll just send a confirmation email

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Newsletter Subscription Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #9333ea; padding: 20px; text-align: center; color: white;">
            <h1>Welcome to EventHub Newsletter!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Thank You for Subscribing</h2>
            <p>You're now subscribed to our newsletter and will be the first to know about upcoming events, exclusive pre-sales, and special promotions.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${config.cors.origin}/events" style="background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore Events</a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This email was sent to ${email}. If you didn't subscribe to our newsletter, please ignore this email.</p>
            <p>You can unsubscribe at any time by clicking <a href="${config.cors.origin}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9333ea;">here</a>.</p>
          </div>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to newsletter'
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to subscribe to newsletter',
      error: error.message
    });
  }
};