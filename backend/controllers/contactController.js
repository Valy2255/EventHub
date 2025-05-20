// backend/controllers/contactController.js
import sendEmail from '../utils/sendEmail.js';

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate inputs
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide all required fields' 
      });
    }
    
    // Prepare email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    `;
    
    // Send email
    await sendEmail({
      to: 'braconieruvalica99@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: htmlContent
    });
    
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ success: false, error: 'Email could not be sent' });
  }
};