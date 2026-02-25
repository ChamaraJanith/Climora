const express = require("express");
const bodyParser = require("body-parser");

// Only import routes actually needed for integration tests
const shelterRoutes = require("../../routes/shelterRoutes");
const alertRoutes = require("../../routes/alertRoutes");
const weatherRoutes = require("../../routes/weatherRoutes");
const dashboardRoutes = require("../../routes/dashboardRoutes");
const articleRoutes = require("../../routes/articleRoutes");
const checklistRoutes = require("../../routes/checklistRoutes");
const climateNewsRoutes = require("../../routes/climateNewsRoutes");
const quizRoutes = require("../../routes/quizRoutes");

function createTestApp() {
  const app = express();
  app.use(bodyParser.json());

  // Mount ONLY safe routes
  app.use("/api/shelters", shelterRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/articles", articleRoutes);
  app.use("/api/checklists", checklistRoutes);
  app.use("/api/climate-news", climateNewsRoutes);
  app.use("/api/quizzes", quizRoutes);

  return app;
}

module.exports = { createTestApp };