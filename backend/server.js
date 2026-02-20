// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ====== Route Imports ======
const authRoutes = require("./routes/authRoutes");
const shelterRoutes = require("./routes/shelterRoutes");
const articleRoutes = require("./routes/articleRoutes");
const alertRoutes = require("./routes/alertRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const quizRoutes = require("./routes/quizRoutes");
const checklistRoutes = require("./routes/checklistRoutes");
const userChecklistRoutes = require("./routes/userChecklistRoutes");
const reportRoutes = require("./routes/reportRoutes");//Add Report routes

const app = express();

// ====== Config ======
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ====== Middleware ======
app.use(cors());
app.use(express.json());


// ====== Health Check ======
app.get("/", (req, res) => {
  res.json({
    message: "Climate Disaster Preparedness API is running 🚀",
  });
});

// ====== Routes ======
app.use("/api/auth", authRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/checklists", checklistRoutes);
app.use("/api/user-checklists", userChecklistRoutes);
app.use("/api/reports", reportRoutes);     // Add Report routes


// ====== Global Error Handler ======
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong",
  });
});

// ====== DB Connect + Server Start ======
const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();