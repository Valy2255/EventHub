import * as User from '../models/User.js';
import jwtGenerator from '../utils/jwtGenerator.js';

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
    
    // Redirecționează către frontend cu tokenul
    res.redirect(`${process.env.CLIENT_URL}/social-auth-callback?token=${token}`);
  } catch (error) {
    console.error('Error in social login callback:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth-failed`);
  }
};