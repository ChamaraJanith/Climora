// tests/utils/testApp.js
const express = require("express");
const bodyParser = require("body-parser");
const shelterRoutes = require("../../routes/shelterRoutes");

function createTestApp() {
  const app = express();
  app.use(bodyParser.json());

  // mount your routes under /api/shelters (or whatever you use)
  app.use("/api/shelters", shelterRoutes);

  // optional: global error handler / 404, etc.
  return app;
}

module.exports = { createTestApp };
