const express = require('express');

const {
    getCurrentWeather,
    getForecast,
    getRiskLevel,
} = require('../controller/weatherController');

const weatherRouter = express.Router();

weatherRouter.get('/current', getCurrentWeather);
weatherRouter.get('/forecast', getForecast);
weatherRouter.get('/risk', getRiskLevel);

module.exports = weatherRouter;
