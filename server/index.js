require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();
console.log("ENV CHECK");
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("SMTP_HOST:", process.env.SMTP_HOST);

const { syncDatabase } = require("./models");
const equipmentRoutes = require("./routes/equipment");
const teamRoutes = require("./routes/teams");
const memberRoutes = require("./routes/members");
const requestRoutes = require("./routes/requests");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes/controllers
app.set("socketio", io);

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", require("./routes/search"));
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "GearGuard API is running",
    timestamp: new Date().toISOString(),
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🔄 Syncing database...");
    await syncDatabase();
    console.log("✓ Database synced successfully");

    // Load routes
    console.log("📂 Loading routes...");

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

    // Debug route types
    console.log("authRoutes:", typeof authRoutes);
    console.log("activitiesRoutes:", typeof activitiesRoutes);
    console.log("equipmentRoutes:", typeof equipmentRoutes);
    console.log("teamRoutes:", typeof teamRoutes);
    console.log("memberRoutes:", typeof memberRoutes);
    console.log("requestRoutes:", typeof requestRoutes);
    console.log("notificationRoutes:", typeof notificationRoutes);
    console.log("adminRoutes:", typeof adminRoutes);
    console.log("uploadRoutes:", typeof uploadRoutes);
    console.log("searchRoutes:", typeof searchRoutes);

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/equipment", equipmentRoutes);
    app.use("/api/teams", teamRoutes);
    app.use("/api/members", memberRoutes);
    app.use("/api/requests", requestRoutes);
    app.use("/api/activities", activitiesRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/search", searchRoutes);
    app.use("/api/admin", adminRoutes);

    // Upload route
    app.use("/api/upload", uploadRoutes);

    console.log("✓ Routes loaded successfully");

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);

      const status = err.statusCode || 500;

      const message =
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message;

      res.status(status).json({
        error: message,
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: "Route not found",
      });
    });

    server.listen(PORT, () => {
      console.log(`\n🚀 GearGuard Server Running!`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;