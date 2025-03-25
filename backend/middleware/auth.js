import passport from 'passport';

export default (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Access denied. Missing or invalid token.' });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};