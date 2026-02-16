const express = require("express");
const router = express.Router();
const weatherController = require("../controller/weatherController");

router.get("/current", weatherController.getCurrentWeather);
router.get("/forecast", weatherController.getForecast);
router.get("/risk", weatherController.getRiskLevel);

module.exports = router;
