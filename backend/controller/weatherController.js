const weatherService = require("../services/weatherService");

/*
==============================================
GET CURRENT WEATHER (One Call 3.0)
==============================================
*/
exports.getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const data = await weatherService.getOneCallData(lat, lon);

    res.json({
      success: true,
      data: {
        temperature: data.current.temp,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
        condition: data.current.weather[0].description,
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch weather data",
      error: err.message,
    });
  }
};


/*
==============================================
GET FORECAST (Daily Forecast)
==============================================
*/
exports.getForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const data = await weatherService.getOneCallData(lat, lon);

    // Return next 5 days
    const forecast = data.daily.slice(0, 5).map(day => ({
      date: new Date(day.dt * 1000),
      minTemp: day.temp.min,
      maxTemp: day.temp.max,
      humidity: day.humidity,
      windSpeed: day.wind_speed,
      condition: day.weather[0].description,
      rainProbability: day.pop * 100,
    }));

    res.json({
      success: true,
      data: forecast,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch forecast",
      error: err.message,
    });
  }
};


/*
==============================================
GET RISK LEVEL (Improved Logic)
==============================================
*/
exports.getRiskLevel = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const data = await weatherService.getOneCallData(lat, lon);

    const current = data.current;

    let score = 0;

    // High temperature
    if (current.temp >= 35) score++;

    // Strong wind
    if (current.wind_speed >= 12) score++;

    // Heavy rain (check current rain if exists)
    const rainVolume =
      (current.rain && current.rain["1h"]) || 0;

    if (rainVolume > 10) score++;

    // Government alerts increase risk automatically
    if (data.alerts && data.alerts.length > 0) {
      score += 2;
    }

    let level = "LOW";
    if (score === 1) level = "MEDIUM";
    if (score === 2) level = "HIGH";
    if (score >= 3) level = "CRITICAL";

    res.json({
      success: true,
      data: {
        riskLevel: level,
        score,
        temperature: current.temp,
        windSpeed: current.wind_speed,
        rainVolume,
        externalAlerts: data.alerts ? data.alerts.length : 0,
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate risk level",
      error: err.message,
    });
  }
};


/*
==============================================
GET EXTERNAL ALERTS (One Call 3.0)
==============================================
*/
exports.getExternalWeatherAlerts = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const data = await weatherService.getOneCallData(lat, lon);

    const alerts = data.alerts || [];

    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch external alerts",
      error: err.message,
    });
  }
};