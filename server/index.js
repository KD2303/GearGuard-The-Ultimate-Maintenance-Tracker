require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const crypto = require("crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");

const { globalLimiter } = require("./middleware/rateLimiter");
const { errorMiddleware } = require("./middleware/errorHandler");
const NotificationService = require("./services/notificationService");
const { startOverdueChecker } = require("./jobs/overdueChecker");
const { syncDatabase } = require("./models");
const swaggerSpec = require("./config/swagger");

// Route imports
const authRoutes = require("./routes/auth");
const activitiesRoutes = require("./routes/activities");
const equipmentRoutes = require("./routes/equipment");
const teamRoutes = require("./routes/teams");
const memberRoutes = require("./routes/members");
const requestRoutes = require("./routes/requests");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/uploadRoutes");
const searchRoutes = require("./routes/search");
const inventoryRoutes = require("./routes/inventory");
const analyticsRoutes = require("./routes/analytics");
const predictiveRoutes = require("./routes/predictiveRoutes");
const purchaseOrderRoutes = require("./routes/purchaseOrder");
const auditRoutes = require("./routes/audit");
const mapRoutes = require("./routes/map");
const supplierRoutes = require("./routes/supplierRoutes");
const procurementRoutes = require("./routes/procurementRoutes");

console.log("ENV CHECK");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Not Set");
console.log("SMTP_HOST:", process.env.SMTP_HOST);

const app = express();
const server = http.createServer(app);

// Environment validation
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ Fatal Error: Missing critical environment variables (MONGO_URI or JWT_SECRET).");
  process.exit(1);
}

// Security Headers
app.use(helmet());

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id} (User ID: ${socket.user?.id})`);
  
  if (socket.user?.id) {
    socket.join(socket.user.id);
  }

  // Client sends their userId to join their personal room
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // Ticket Collaboration Events
  socket.on("join_ticket", (ticketId) => {
    socket.join(`ticket_${ticketId}`);
  });

  socket.on("leave_ticket", (ticketId) => {
    socket.leave(`ticket_${ticketId}`);
  });

  socket.on("typing", ({ ticketId, userName }) => {
    socket.to(`ticket_${ticketId}`).emit("user_typing", { userName });
  });

  socket.on("stop_typing", ({ ticketId, userName }) => {
    socket.to(`ticket_${ticketId}`).emit("user_stop_typing", { userName });
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes/controllers
app.set("socketio", io);

// Pass io to notification service
NotificationService.setSocketIO(io);

// Request ID middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Apply global rate limiter to all routes
app.use(globalLimiter);

// Serve uploaded attachments statically
const path = require("path");
const fs = require("fs");
const uploadsPath = fs.existsSync(path.join(__dirname, "../uploads"))
  ? path.join(__dirname, "../uploads")
  : path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
// We define both /api/v1 and /api for backward compatibility during transition
const defineRoutes = (router) => {
  router.use("/auth", authRoutes);
  router.use("/equipment", equipmentRoutes);
  router.use("/teams", teamRoutes);
  router.use("/members", memberRoutes);
  router.use("/requests", requestRoutes);
  router.use("/activities", activitiesRoutes);
  router.use("/notifications", notificationRoutes);
  router.use("/search", searchRoutes);
  router.use("/admin", adminRoutes);
  router.use("/analytics", analyticsRoutes);
  router.use("/predictive", predictiveRoutes);
  router.use("/inventory", inventoryRoutes);
  router.use("/upload", uploadRoutes);
  router.use("/export", require("./routes/export"));
  router.use("/purchase-orders", purchaseOrderRoutes);
  router.use("/audit", auditRoutes);
  router.use("/map", mapRoutes);
  router.use("/suppliers", supplierRoutes);
  router.use("/procurement", procurementRoutes);
};

const v1Router = express.Router();
defineRoutes(v1Router);
app.use("/api/v1", v1Router);
app.use("/api", v1Router); // Backward compatibility

// Health check
app.get("/api/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const statusCode = dbConnected ? 200 : 503;
  
  res.status(statusCode).json({
    status: dbConnected ? "OK" : "ERROR",
    message: "GearGuard API health status",
    database: dbConnected ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Comprehensive error handling middleware (must be AFTER all routes)
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      type: "NOT_FOUND_ERROR",
      message: "The requested resource was not found.",
      timestamp: new Date().toISOString(),
    },
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🔄 Syncing database...");
    // Retry mechanism for database connection
    let retries = 5;
    while (retries > 0) {
      try {
        await syncDatabase();
        console.log("✓ Database synced successfully");
        
        // Start Cron Jobs
        const { scheduleInventoryCron } = require("./cron/inventoryCron");
        scheduleInventoryCron();
        
        const { startProcurementCron } = require("./jobs/procurementCron");
        startProcurementCron();
        
        break;
      } catch (err) {
        retries -= 1;
        console.log(`Database connection failed. Retries left: ${retries}`);
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Start overdue checker cron job
    startOverdueChecker();

    const { startHealthScoreCron } = require("./cron/healthScoreCron");
    startHealthScoreCron();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 GearGuard Server Running!`);
      console.log(`📡 API: http://localhost:${PORT}/api/v1`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`📄 Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = () => {
  console.log("Gracefully shutting down server...");
  server.close(() => {
    console.log("HTTP server closed.");
    mongoose.connection.close(false).then(() => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

if (require.main === module) {
  startServer();
}

module.exports = app;
