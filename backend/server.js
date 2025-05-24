import express from "express";
import cors from "cors";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";
import config from "./config/config.js";
import "./config/passport.js";
import pg from "pg";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import statisticsRoutes from "./routes/statisticsRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import creditRoutes from "./routes/creditRoutes.js";
import legalDocumentRoutes from "./routes/legalDocumentRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { initializeScheduledTasks } from "./utils/scheduledTasks.js";
import { setupSocketHandlers } from "./socket/socketHandlers.js";

const app = express();
const httpServer = createServer(app);

// Create a global database connection pool
global.pool = new pg.Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

// Configure Socket.IO with CORS settings aligned with your main app's CORS
const io = new Server(httpServer, {
  cors: {
    // Use the same origin as your main app
    origin: config.cors.origin || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Authorization"],
  },
  transports: ["polling", "websocket"],
});

// Make io instance available to route handlers
app.set("io", io);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/legal", legalDocumentRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Log successful database connection
  global.pool.query("SELECT NOW()", (err, res) => {
    if (err) {
      console.error("Database connection error:", err);
    } else {
      console.log("Database connected successfully");

      // Initialize the enhanced scheduled tasks
      // This uses the new comprehensive implementation from scheduledTasks.js
      initializeScheduledTasks();
      console.log("Enhanced scheduled tasks system initialized");
    }
  });
});
