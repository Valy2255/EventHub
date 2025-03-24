import config from '../config/config.js';
import * as User from '../models/User.js';
import jwtGenerator from '../utils/jwtGenerator.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Verifică dacă utilizatorul există deja
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Există deja un utilizator cu acest email' });
    }
    
    // Creare utilizator nou
    const newUser = await User.create({ name, email, password });
    
    // Generare token
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
    
    // Verifică dacă utilizatorul există
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }
    
    // Verifică parola
    const validPassword = await User.comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }
    
    // Generare token
    const token = jwtGenerator(user.id);
    
    // Exclude parola din răspuns
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
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const socialLoginCallback = (req, res) => {
  try {
    // req.user este utilizatorul autentificat prin Passport
    const token = jwtGenerator(req.user.id);
    
    // Use config.cors.origin instead of process.env.CLIENT_URL
    const redirectURL = `${config.cors.origin}/social-auth-callback?token=${token}`;
    
    // Log the redirect for debugging
    console.log(`Redirecting to: ${redirectURL}`);
    
    // Redirecționează către frontend cu tokenul
    res.redirect(redirectURL);
  } catch (error) {
    console.error('Error in social login callback:', error);
    res.redirect(`${config.cors.origin}/login?error=auth-failed`);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Verifică dacă utilizatorul există
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Nu există un utilizator cu această adresă de email' });
    }

    // Generează token unic
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = Date.now() + 3600000; // 1 oră

    // Salvează token-ul în baza de date
    await User.updateResetToken(user.id, resetToken, resetTokenExpire);

    // Creează link-ul de resetare
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Trimite email-ul
    const message = `
      <h1>Resetare parolă</h1>
      <p>Ai solicitat resetarea parolei. Accesează link-ul de mai jos pentru a-ți seta o nouă parolă:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Resetează parola</a>
      <p>Link-ul este valabil timp de o oră. Dacă nu ai solicitat resetarea parolei, ignoră acest email.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Resetare parolă EventHub',
        html: message
      });

      res.status(200).json({ message: 'Email-ul a fost trimis' });
    } catch (error) {
      // Șterge token-ul dacă email-ul nu poate fi trimis
      await User.updateResetToken(user.id, null, null);
      return res.status(500).json({ error: 'Email-ul nu a putut fi trimis' });
    }
  } catch (error) {
    next(error);
  }
};

// Verifică token-ul de resetare
export const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const user = await User.findByResetToken(token);
    if (!user || user.reset_token_expire < Date.now()) {
      return res.status(400).json({ error: 'Token invalid sau expirat' });
    }

    res.status(200).json({ message: 'Token valid' });
  } catch (error) {
    next(error);
  }
};

// Resetează parola
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findByResetToken(token);
    if (!user || user.reset_token_expire < Date.now()) {
      return res.status(400).json({ error: 'Token invalid sau expirat' });
    }

    // Actualizează parola și șterge token-ul de resetare
    await User.updatePassword(user.id, password);

    res.status(200).json({ message: 'Parola a fost actualizată cu succes' });
  } catch (error) {
    next(error);
  }
};