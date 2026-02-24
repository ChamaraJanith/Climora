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

    if (!data || !data.current) {
      return res.status(500).json({
        success: false,
        message: "Weather data not available",
      });
    }

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

    res.json({
      success: true,
      location: req.user.location,
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

    if (!data?.daily) {
      return res.status(500).json({
        success: false,
        message: "Forecast data not available",
      });
    }

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
====================================================
GET RISK LEVEL (Improved Logic + External Alert Aware)
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

    if (current.temp >= 35) score++;
    if (current.wind_speed >= 12) score++;

    const rainVolume =
      (current.rain && current.rain["1h"]) || 0;

    if (rainVolume > 10) score++;

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
====================================================
GET EXTERNAL ALERTS + AUTO SAVE
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
    const alerts = data.alerts || [];

    for (const ext of alerts) {

      const startDate = new Date(ext.start * 1000);

      const exists = await Alert.findOne({
        title: ext.event,
        startAt: startDate,
      });

      if (!exists) {

        const externalId = `EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await Alert.create({
          alertId: externalId,
          title: ext.event,
          description: ext.description,
          category: "STORM", // Can enhance mapping logic
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch external alerts",
      error: err.message,
    });
  }
};