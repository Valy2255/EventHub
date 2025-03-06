export default (req, res, next) => {
    // Verifică dacă utilizatorul este autentificat și are rolul admin
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ error: 'Acces interzis. Necesită permisiuni de administrator.' });
    }
  };