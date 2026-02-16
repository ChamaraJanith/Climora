const weatherService = require("../services/weatherService");

// Current Weather
exports.getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await weatherService.getWeatherData(lat, lon);

    res.json({
      temp: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].description,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weather" });
  }
};

// Forecast
exports.getForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await weatherService.getForecastData(lat, lon);

    res.json(data.list.slice(0, 5));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
};

// Risk Calculation
exports.getRiskLevel = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await weatherService.getWeatherData(lat, lon);

    let score = 0;

    if (data.main.temp > 35) score++;
    if (data.wind.speed > 10) score++;
    if (data.rain) score++;

    let level = "LOW";
    if (score === 1) level = "MEDIUM";
    if (score === 2) level = "HIGH";
    if (score >= 3) level = "CRITICAL";

    res.json({ riskLevel: level, score });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate risk" });
  }
};
