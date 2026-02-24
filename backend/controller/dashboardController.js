const Alert = require("../models/Alert");
const weatherService = require("../services/weatherService");

exports.getAlertsAndRisk = async (req, res) => {
  try {
    const { lat, lon, district } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    /*
    ==============================================
    1️⃣ Get Active Alerts (Filtered by District)
    ==============================================
    */
    const alertFilter = { isActive: true };

    if (district) {
      alertFilter["area.district"] = district;
    }

    const activeAlerts = await Alert.find(alertFilter);

    /*
    ==============================================
    2️⃣ Get Weather Data
    ==============================================
    */
    const weatherData = await weatherService.getWeatherData(lat, lon);

    /*
    ==============================================
    3️⃣ Calculate Risk Level
    ==============================================
    */
    let score = 0;

    if (weatherData.main.temp >= 35) score++;
    if (weatherData.wind.speed >= 10) score++;

    const rainVolume =
      (weatherData.rain && (weatherData.rain["1h"] || weatherData.rain["3h"])) || 0;

    if (rainVolume > 10) score++;

    let riskLevel = "LOW";
    if (score === 1) riskLevel = "MEDIUM";
    if (score === 2) riskLevel = "HIGH";
    if (score >= 3) riskLevel = "CRITICAL";

    /*
    ==============================================
    FINAL RESPONSE
    ==============================================
    */
    res.json({
      success: true,
      data: {
        alertsCount: activeAlerts.length,
        activeAlerts,
        weather: {
          city: weatherData.name,
          temperature: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          condition: weatherData.weather[0].description,
        },
        riskLevel,
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate dashboard data",
      error: err.message,
    });
  }
};