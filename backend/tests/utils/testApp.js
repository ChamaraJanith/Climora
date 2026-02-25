// tests/utils/testApp.js
const express = require("express");
const bodyParser = require("body-parser");

// ✅ mock BEFORE requiring any routes
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
  adminOnly: (req, res, next) => next(),
}));

jest.mock("../../middleware/roleMiddleware", () => ({
  allowRoles: () => (req, res, next) => next(),
}));

// Now safe to import routes
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
