// backend/controllers/authController.js
import { AuthService } from '../services/AuthService.js';
const authService = new AuthService();

export const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.message.includes('exists')) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
};

export const login = async (req, res) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.status(200).json({ user, token });
  } catch {
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({user});
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

export const socialLoginCallback = (req, res) => {
  try {
    const redirectURL = authService.socialLoginCallback(req.user.id);
    res.redirect(redirectURL);
  } catch (err) {
    console.error('Social callback error:', err);
    res.redirect('/login?error=auth-failed');
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const payload = await authService.forgotPassword(req.body.email);
    res.status(200).json(payload);
  } catch (err) {
    if (err.message.includes('No user exists')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
};

export const verifyResetToken = async (req, res) => {
  try {
    const payload = await authService.verifyResetToken(req.params.token);
    res.status(200).json(payload);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const payload = await authService.resetPassword(req.params.token, req.body.password);
    res.status(200).json(payload);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};