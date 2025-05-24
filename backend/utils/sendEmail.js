// backend/utils/sendEmail.js
import nodemailer from 'nodemailer';
import config from '../config/config.js';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure, 
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });

  const mailOptions = {
    from: `"${config.email.fromName}" <${config.email.user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;