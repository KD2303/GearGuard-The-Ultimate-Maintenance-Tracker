const express = require("express");
const activitiesRoutes = require("./routes/activities");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();

const { syncDatabase } = require("./models");
const equipmentRoutes = require("./routes/equipment");
const teamRoutes = require("./routes/teams");
const memberRoutes = require("./routes/members");
const requestRoutes = require("./routes/requests");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/equipment", equipmentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/activities", activitiesRoutes); // ✅ added

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "GearGuard API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await syncDatabase();

    app.listen(PORT, () => {
      console.log(`\n🚀 GearGuard Server Running!`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
