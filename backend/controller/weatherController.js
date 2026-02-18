const weatherService = require("../services/weatherService");

/*
==============================================
GET CURRENT WEATHER
==============================================
*/
exports.getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const data = await weatherService.getWeatherData(lat, lon);

    console.log("==============================================");
    console.log("📥 GET /api/weather/current");
    console.log(`🌦 WEATHER FETCHED: ${data.name}`);
    console.log("==============================================");

    res.json({
      city: data.name,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].description,
    });
  } catch (err) {
    console.log("==============================================");
    console.log("📥 GET /api/weather/current");
    console.log("❌ WEATHER FETCH FAILED");
    console.log("==============================================");

    res.status(500).json({ error: "Failed to fetch weather" });
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

    const data = await weatherService.getForecastData(lat, lon);

    console.log("==============================================");
    console.log("📥 GET /api/weather/forecast");
    console.log("📅 FORECAST FETCHED (5 Entries)");
    console.log("==============================================");

    res.json(data.list.slice(0, 5));
  } catch (err) {
    console.log("==============================================");
    console.log("📥 GET /api/weather/forecast");
    console.log("❌ FORECAST FETCH FAILED");
    console.log("==============================================");

    res.status(500).json({ error: "Failed to fetch forecast" });
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

    console.log("==============================================");
    console.log("📥 GET /api/weather/risk");
    console.log(`⚠ RISK LEVEL CALCULATED: ${level}`);
    console.log("==============================================");

    res.json({
      riskLevel: level,
      score,
      temperature: data.main.temp,
      windSpeed: data.wind.speed,
      rainVolume,
    });
  } catch (err) {
    console.log("==============================================");
    console.log("📥 GET /api/weather/risk");
    console.log("❌ RISK CALCULATION FAILED");
    console.log("==============================================");

    res.status(500).json({ error: "Failed to calculate risk" });
  }
};
