import express from 'express';
import cors from 'cors';
import passport from 'passport';
import config from './config/config.js';
import './config/passport.js';
import pg from 'pg';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import categoryRoutes from './routes/categoryRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import checkInRoutes from './routes/checkInRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import legalDocumentRoutes from './routes/legalDocumentRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import * as scheduledTasks from './utils/scheduledTasks.js';
import cron from 'node-cron';

const app = express();

const initScheduledTasks = () => {
  console.log('Initializing scheduled tasks...');
  
  // Schedule automatic refund processing to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await scheduledTasks.processRefunds();
    } catch (error) {
      console.error('Error running scheduled refund task:', error);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      await scheduledTasks.cleanupPastEvents();
    } catch (error) {
      console.error('Error running scheduled cleanup task:', error);
    }
  });
  
  console.log('Scheduled tasks initialized');
};



// Create a global database connection pool
global.pool = new pg.Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/check-in', checkInRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/legal', legalDocumentRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/purchases', purchaseRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Log successful database connection
  global.pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Database connected successfully');
    }
    // Initialize scheduled tasks
    initScheduledTasks();
  });
});