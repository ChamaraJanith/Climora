const weatherService = require("../services/weatherService");

/*
==============================================
GET CURRENT WEATHER
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

    const data = await weatherService.getWeatherData(lat, lon);

    res.json({
      success: true,
      data: {
        city: data.name,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        condition: data.weather[0].description,
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
GET FORECAST
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

    const data = await weatherService.getForecastData(lat, lon);

    res.json({
      success: true,
      data: data.list.slice(0, 5),
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
GET RISK LEVEL
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

    const data = await weatherService.getWeatherData(lat, lon);

    let score = 0;

    if (data.main.temp >= 35) score++;
    if (data.wind.speed >= 10) score++;

    const rainVolume =
      (data.rain && (data.rain["1h"] || data.rain["3h"])) || 0;

    if (rainVolume > 10) score++;

    let level = "LOW";
    if (score === 1) level = "MEDIUM";
    if (score === 2) level = "HIGH";
    if (score >= 3) level = "CRITICAL";

    res.json({
      success: true,
      data: {
        riskLevel: level,
        score,
        temperature: data.main.temp,
        windSpeed: data.wind.speed,
        rainVolume,
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