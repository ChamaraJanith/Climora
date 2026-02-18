const weatherService = require("../services/weatherService");

// Validate coordinates
const validateCoords = (lat, lon) => {
  if (!lat || !lon) return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  return true;
};

// GET Current Weather
exports.getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!validateCoords(lat, lon)) {
      return res.status(400).json({
        error: "Invalid latitude or longitude",
      });
    }

    const data = await weatherService.getWeatherData(lat, lon);

    res.json({
      city: data.name,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].description,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch weather",
    });
  }
};

// GET Forecast
exports.getForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!validateCoords(lat, lon)) {
      return res.status(400).json({
        error: "Invalid latitude or longitude",
      });
    }

    const data = await weatherService.getForecastData(lat, lon);

    res.json(data.list.slice(0, 5));
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch forecast",
    });
  }
};

// GET Risk Level
exports.getRiskLevel = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!validateCoords(lat, lon)) {
      return res.status(400).json({
        error: "Invalid latitude or longitude",
      });
    }

    const data = await weatherService.getWeatherData(lat, lon);

    let score = 0;

    // Temperature Risk
    if (data.main.temp >= 35) score++;

    // Wind Risk
    if (data.wind.speed >= 10) score++;

    // Rain Risk
    const rainVolume =
      (data.rain && (data.rain["1h"] || data.rain["3h"])) || 0;

    if (rainVolume > 10) score++;

    let level = "LOW";
    if (score === 1) level = "MEDIUM";
    if (score === 2) level = "HIGH";
    if (score >= 3) level = "CRITICAL";

    res.json({
      riskLevel: level,
      score,
      temperature: data.main.temp,
      windSpeed: data.wind.speed,
      rainVolume,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to calculate risk",
    });
  }
};
