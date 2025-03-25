export default (req, res, next) => {
  // Check if user is authenticated and has admin role
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Administrator permissions required.' });
  }
};