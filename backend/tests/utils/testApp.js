// tests/utils/testApp.js
const express = require("express");
const bodyParser = require("body-parser");

// ✅ Global mocks for auth & roles (before requiring routes)
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => {
    // Default authenticated user for all protected routes
    req.user = { userId: "User-00001", role: "USER" };
    next();
  },
  adminOnly: (req, res, next) => {
    // Elevate to ADMIN where adminOnly is used
    req.user = req.user || { userId: "Admin-00001" };
    req.user.role = "ADMIN";
    next();
  },
}));

jest.mock("../../middleware/roleMiddleware", () => ({
  allowRoles: () => (req, res, next) => {
    // Skip role checks completely in integration tests
    next();
  },
}));

// Routes
const shelterRoutes = require("../../routes/shelterRoutes");
const alertRoutes = require("../../routes/alertRoutes");
const weatherRoutes = require("../../routes/weatherRoutes");
const dashboardRoutes = require("../../routes/dashboardRoutes");
const articleRoutes = require("../../routes/articleRoutes");
const checklistRoutes = require("../../routes/checklistRoutes");
const climateNewsRoutes = require("../../routes/climateNewsRoutes");
const quizRoutes = require("../../routes/quizRoutes");
const reportRoutes = require("../../routes/reportRoutes");

function createTestApp() {
  const app = express();
  app.use(bodyParser.json());

  app.use("/api/shelters", shelterRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/articles", articleRoutes);
  app.use("/api/checklists", checklistRoutes);
  app.use("/api/climate-news", climateNewsRoutes);
  app.use("/api/quizzes", quizRoutes);
  app.use("/api/reports", reportRoutes);

  return app;
}

module.exports = { createTestApp };
