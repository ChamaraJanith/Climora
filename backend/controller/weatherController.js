const weatherService = require("../services/weatherService");
const Alert = require("../models/Alert");

/*
====================================================
GET CURRENT WEATHER (Manual Lat/Lon)
====================================================
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

    if (!data?.current) {
      return res.status(500).json({
        success: false,
        message: "Weather data not available",
      });
    }

    const current = data.current;

    res.json({
      success: true,
      data: {
        temperature: current.temp ?? null,
        humidity: current.humidity ?? null,
        windSpeed: current.wind_speed ?? null,
        windGust: current.wind_gust ?? 0,
        condition: current.weather?.[0]?.description ?? "N/A",
      },
    });

  } catch (err) {
    console.error("Weather Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weather data",
      error: err.message,
    });
  }
};


/*
====================================================
GET WEATHER FOR LOGGED-IN USER LOCATION
====================================================
*/
exports.getMyWeather = async (req, res) => {
  try {
    if (!req.user?.location?.lat || !req.user?.location?.lon) {
      return res.status(400).json({
        success: false,
        message: "User location not configured",
      });
    }

    const { lat, lon } = req.user.location;

    const data = await weatherService.getOneCallData(lat, lon);

    if (!data?.current) {
      return res.status(500).json({
        success: false,
        message: "Weather data not available",
      });
    }

    const current = data.current;

    res.json({
      success: true,
      location: req.user.location,
      data: {
        temperature: current.temp ?? null,
        humidity: current.humidity ?? null,
        windSpeed: current.wind_speed ?? null,
        windGust: current.wind_gust ?? 0,
        condition: current.weather?.[0]?.description ?? "N/A",
      },
    });

  } catch (err) {
    console.error("Personalized Weather Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch personalized weather",
      error: err.message,
    });
  }
};


/*
====================================================
GET FORECAST (Next 5 Days)
====================================================
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

    if (!data?.daily || !Array.isArray(data.daily)) {
      return res.status(500).json({
        success: false,
        message: "Forecast data not available",
      });
    }

    const forecast = data.daily.slice(0, 5).map((day) => ({
      date: new Date(day.dt * 1000),
      minTemp: day.temp?.min ?? null,
      maxTemp: day.temp?.max ?? null,
      humidity: day.humidity ?? null,
      windSpeed: day.wind_speed ?? null,
      condition: day.weather?.[0]?.description ?? "N/A",
      rainProbability: day.pop ? day.pop * 100 : 0,
    }));

    res.json({
      success: true,
      data: forecast,
    });

  } catch (err) {
    console.error("Forecast Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forecast",
      error: err.message,
    });
  }
};


/*
====================================================
GET RISK LEVEL (Stable Improved Logic)
====================================================
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

    if (!data?.current) {
      return res.status(500).json({
        success: false,
        message: "Weather data not available",
      });
    }

    const current = data.current;
    let score = 0;
    let reasons = [];

    // Temperature
    if (current.temp >= 38) {
      score += 2;
      reasons.push("Extreme heat");
    } else if (current.temp >= 35) {
      score += 1;
      reasons.push("High temperature");
    }

    // Wind
    if (current.wind_speed >= 12) {
      score += 1;
      reasons.push("Strong wind");
    }

    if (current.wind_gust && current.wind_gust >= 20) {
      score += 2;
      reasons.push("Severe wind gust");
    }

    // Rain
    const rainVolume =
      (current.rain && current.rain["1h"]) || 0;

    if (rainVolume > 10) {
      score += 1;
      reasons.push("Heavy rainfall");
    }

    // External alerts (just count them safely)
    if (Array.isArray(data.alerts) && data.alerts.length > 0) {
      score += 2;
      reasons.push("Government weather alert active");
    }

    // Final Level
    let level = "LOW";
    if (score <= 2) level = "LOW";
    else if (score <= 4) level = "MEDIUM";
    else if (score <= 6) level = "HIGH";
    else level = "CRITICAL";

    res.json({
      success: true,
      data: {
        riskLevel: level,
        score,
        reasons,
        temperature: current.temp,
        windSpeed: current.wind_speed,
        rainVolume,
        externalAlerts: Array.isArray(data.alerts)
          ? data.alerts.length
          : 0,
      },
    });

  } catch (err) {
    console.error("Risk Calculation Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to calculate risk level",
      error: err.message,
    });
  }
};


/*
====================================================
GET EXTERNAL ALERTS + SAFE AUTO SAVE
====================================================
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
    const alerts = Array.isArray(data?.alerts) ? data.alerts : [];

    for (const ext of alerts) {
      const startDate = ext.start
        ? new Date(ext.start * 1000)
        : new Date();

      const exists = await Alert.findOne({
        title: ext.event,
        startAt: startDate,
      });

      if (!exists) {
        const externalId = `EXT-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

        await Alert.create({
          alertId: externalId,
          title: ext.event || "Weather Alert",
          description: ext.description || "External weather alert",
          category: "STORM",
          severity: "HIGH",
          area: {
            district: "Unknown",
            city: "Unknown",
          },
          startAt: startDate,
          endAt: ext.end ? new Date(ext.end * 1000) : null,
          isActive: true,
          source: "OpenWeatherMap",
        });
      }
    }

    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });

  } catch (err) {
    console.error("External Alerts Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch external alerts",
      error: err.message,
    });
  }
};