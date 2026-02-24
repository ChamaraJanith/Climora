const express = require("express");

const {
  getCurrentWeather,
  getForecast,
  getRiskLevel,
  getExternalWeatherAlerts,
  getMyWeather,
} = require("../controller/weatherController");

const { protect } = require("../middleware/authMiddleware");

const weatherRouter = express.Router();

/*
====================================================
WEATHER ROUTES (Protected)
====================================================
*/

weatherRouter.get("/current", protect, getCurrentWeather);                    // Get current weather
weatherRouter.get("/forecast", protect, getForecast);                         // Get 5-day forecast
weatherRouter.get("/risk", protect, getRiskLevel);                            // Get calculated risk level
weatherRouter.get("/external-alerts", protect, getExternalWeatherAlerts);     // Get external government alerts (One Call 3.0)
weatherRouter.get("/my", protect, getMyWeather);                              // Get weather for logged-in user's saved location

module.exports = weatherRouter;