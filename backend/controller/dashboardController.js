const Alert = require("../models/Alert");
const weatherService = require("../services/weatherService");

/*
====================================================
DASHBOARD: ALERTS + RISK (Manual Coordinates)
====================================================
*/
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
    1️⃣ Get Active Alerts (Optional District Filter)
    ==============================================
    */
    const alertFilter = { isActive: true };

    if (district) {
      alertFilter["area.district"] = district;
    }

    const activeAlerts = await Alert.find(alertFilter);

    /*
    ==============================================
    2️⃣ Get Weather Data (One Call 3.0)
    ==============================================
    */
    const weatherData = await weatherService.getOneCallData(lat, lon);

    if (!weatherData?.current) {
      return res.status(500).json({
        success: false,
        message: "Weather data not available",
      });
    }

    /*
    ==============================================
    3️⃣ Calculate Risk Level (Improved Logic)
    ==============================================
    */
    const current = weatherData.current;
    let score = 0;

    // High temperature
    if (current.temp >= 35) score++;

    // Strong wind
    if (current.wind_speed >= 12) score++;

    // Heavy rain
    const rainVolume =
      (current.rain && current.rain["1h"]) || 0;

    if (rainVolume > 10) score++;

    // External government alerts increase risk
    if (weatherData.alerts && weatherData.alerts.length > 0) {
      score += 2;
    }

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
        externalAlerts: weatherData.alerts ? weatherData.alerts.length : 0,
        activeAlerts,
        weather: {
          temperature: current.temp,
          humidity: current.humidity,
          windSpeed: current.wind_speed,
          condition: current.weather[0].description,
        },
        riskLevel,
        score,
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



/*
====================================================
SMART PERSONALIZED DASHBOARD (Uses User Location)
====================================================
*/
exports.getMyStatus = async (req, res) => {
  try {
    if (
      req.user?.location?.lat === undefined ||
      req.user?.location?.lon === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "User location not configured",
      });
    }

    const { lat, lon, district } = req.user.location;

    /*
    ==============================================
    1️⃣ Get Active Alerts in User District
    ==============================================
    */
    const activeAlerts = await Alert.find({
      "area.district": district,
      isActive: true,
    });

    /*
    ==============================================
    2️⃣ Get Weather Data
    ==============================================
    */
    const weatherData = await weatherService.getOneCallData(lat, lon);

    if (!weatherData?.current) {
      return res.status(500).json({
        success: false,
        message: "Weather data not available",
      });
    }

    /*
    ==============================================
    3️⃣ Calculate Risk
    ==============================================
    */
    const current = weatherData.current;
    let score = 0;

    if (current.temp >= 35) score++;
    if (current.wind_speed >= 12) score++;

    const rainVolume =
      (current.rain && current.rain["1h"]) || 0;

    if (rainVolume > 10) score++;

    if (weatherData.alerts && weatherData.alerts.length > 0) {
      score += 2;
    }

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
      location: district,
      activeAlertsInMyDistrict: activeAlerts.length,
      externalAlerts: weatherData.alerts ? weatherData.alerts.length : 0,
      weather: {
        temperature: current.temp,
        humidity: current.humidity,
        windSpeed: current.wind_speed,
        condition: current.weather[0].description,
      },
      riskLevel,
      score,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load personalized dashboard",
      error: err.message,
    });
  }
};