// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ====== Route Imports ======
const authRoutes = require("./routes/authRoutes");            //Add Auth routes
const shelterRoutes = require("./routes/shelterRoutes");      //Add Shelter routes
const articleRoutes = require("./routes/articleRoutes");      //Add Article routes
const alertRoutes = require("./routes/alertRoutes");          //Add Alert routes
const weatherRoutes = require("./routes/weatherRoutes");      //Add Weather routes
const quizRoutes = require("./routes/quizRoutes");            //Add Quiz routes
const checklistRoutes = require("./routes/checklistRoutes");  //Add Checklist routes

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
app.use("/api/auth", authRoutes);             // Auth Routes
app.use("/api/shelters", shelterRoutes);      // Shelter Routes
app.use("/api/articles", articleRoutes);      // Article Routes
app.use("/api/alerts", alertRoutes);          // Add Alert routes
app.use("/api/weather", weatherRoutes);       // Add Weather routes
app.use("/api/quizzes", quizRoutes);          // Add Quiz routes
app.use("/api/checklists", checklistRoutes);  // Add Checklist routes

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
