// backend/utils/sendEmail.js
import nodemailer from 'nodemailer';
import config from '../config/config.js';

const sendEmail = async (options) => {
  // Creează un transporter pentru nodemailer
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure, // true pentru 465, false pentru alte porturi
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });

  // Definește opțiunile email-ului
  const mailOptions = {
    from: `"${config.email.fromName}" <${config.email.user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  // Trimite email-ul
  await transporter.sendMail(mailOptions);
};

export default sendEmail;