require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");

// ====== Route Imports ======
const authRoutes = require("./routes/authRoutes");
const shelterRoutes = require("./routes/shelterRoutes");
const articleRoutes = require("./routes/articleRoutes");
const alertRoutes = require("./routes/alertRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const quizRoutes = require("./routes/quizRoutes");
const checklistRoutes = require("./routes/checklistRoutes");
const userChecklistRoutes = require("./routes/userChecklistRoutes");
const reportRoutes = require("./routes/reportRoutes");
const climateNewsRoutes = require("./routes/climateNewsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Import Alert model ONLY for auto-expire
const Alert = require("./models/Alert");

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
app.use("/api/reports", reportRoutes);
app.use("/api/climate-news", climateNewsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ====== Global Error Handler ======
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
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

    /*
    ==============================================
    AUTO-EXPIRE ALERTS CRON JOB 
    Runs every 10 minutes
    ==============================================
    */
    cron.schedule("*/10 * * * *", async () => {
      try {
        console.log("⏰ [CRON] Checking for expired alerts...");

        const result = await Alert.updateMany(
          {
            endAt: { $exists: true, $lt: new Date() },
            isActive: true,
          },
          { isActive: false }
        );

        if (result.modifiedCount > 0) {
          console.log(
            `⚠ ${result.modifiedCount} expired alert(s) deactivated`
          );
        } else {
          console.log("✅ No expired alerts found");
        }
      } catch (err) {
        console.error("❌ [CRON] Alert expiration failed:", err.message);
      }
    });

    console.log("⏰ Alert auto-expire scheduled (every 10 minutes)");

    //── Auto-refresh climate news every 30 minutes ──
    const { fetchAndCacheNews } = require('./controller/climateNewsController');
    
    cron.schedule('0 */6 * * *', async () => {
        console.log('⏰ [CRON] Auto-refreshing climate news...');
        try {
           await fetchAndCacheNews();
           console.log('✅ [CRON] Climate news updated successfully');
       } catch (err) {
           console.error('❌ [CRON] Auto-refresh failed:', err.message);
       }
    });

   console.log('⏰ Climate news auto-refresh scheduled (every 6 hours)');

  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();