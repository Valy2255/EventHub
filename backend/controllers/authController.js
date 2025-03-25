import config from '../config/config.js';
import * as User from '../models/User.js';
import jwtGenerator from '../utils/jwtGenerator.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    
    // Create new user
    const newUser = await User.create({ name, email, password });
    
    // Generate token
    const token = jwtGenerator(newUser.id);
    
    return res.status(201).json({
      user: newUser,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await User.comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwtGenerator(user.id);
    
    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const socialLoginCallback = (req, res) => {
  try {
    // req.user is the user authenticated through Passport
    const token = jwtGenerator(req.user.id);
    
    // Use config.cors.origin instead of process.env.CLIENT_URL
    const redirectURL = `${config.cors.origin}/social-auth-callback?token=${token}`;
    
    // Log the redirect for debugging
    console.log(`Redirecting to: ${redirectURL}`);
    
    // Redirect to frontend with token
    res.redirect(redirectURL);
  } catch (error) {
    console.error('Error in social login callback:', error);
    res.redirect(`${config.cors.origin}/login?error=auth-failed`);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No user exists with this email address' });
    }

    // Generate unique token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = Date.now() + 3600000; // 1 hour

    // Save token to database
    await User.updateResetToken(user.id, resetToken, resetTokenExpire);

    // Create reset link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    const message = `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link is valid for one hour. If you did not request a password reset, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'EventHub Password Reset',
        html: message
      });

      res.status(200).json({ message: 'Email has been sent' });
    } catch (error) {
      // Delete token if email cannot be sent
      await User.updateResetToken(user.id, null, null);
      return res.status(500).json({ error: 'Email could not be sent' });
    }
  } catch (error) {
    next(error);
  }
};

// Verify reset token
export const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const user = await User.findByResetToken(token);
    if (!user || user.reset_token_expire < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.status(200).json({ message: 'Valid token' });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findByResetToken(token);
    if (!user || user.reset_token_expire < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update password and delete reset token
    await User.updatePassword(user.id, password);

    res.status(200).json({ message: 'Password has been updated successfully' });
  } catch (error) {
    next(error);
  }
};