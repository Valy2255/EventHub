export default (err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'A apărut o eroare pe server';
    
    res.status(statusCode).json({
      error: message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  };