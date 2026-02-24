const axios = require("axios");

const BASE_URL = process.env.WEATHER_BASE_URL;
const API_KEY = process.env.WEATHER_API_KEY;

/*
=================================================
GET ONE CALL DATA (includes alerts array)
=================================================
*/
exports.getOneCallData = async (lat, lon) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: "metric",
        exclude: "minutely,hourly",
      },
    });

    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(
        `Weather API error: ${err.response.status} ${err.response.statusText}`
      );
    }
    throw new Error("Unable to fetch weather data");
  }
};