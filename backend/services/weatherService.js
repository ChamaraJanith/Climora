const axios = require("axios");

const BASE_URL = process.env.WEATHER_BASE_URL;
const API_KEY = process.env.WEATHER_API_KEY;

if (!BASE_URL || !API_KEY) {
  throw new Error("Weather API configuration missing in .env");
}

exports.getWeatherData = async (lat, lon) => {
  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const response = await axios.get(url);

    return response.data;

  } catch (err) {
    throw new Error("External weather API error");
  }
};

exports.getForecastData = async (lat, lon) => {
  try {
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const response = await axios.get(url);

    return response.data;

  } catch (err) {
    throw new Error("External forecast API error");
  }
};