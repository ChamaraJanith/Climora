const express = require('express');

const {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    deleteAlert,
} = require('../controller/alertController');

const alertRouter = express.Router();

alertRouter.post('/', createAlert);
alertRouter.get('/', getAlerts);
alertRouter.get('/:id', getAlertById);
alertRouter.put('/:id', updateAlert);
alertRouter.delete('/:id', deleteAlert);

module.exports = alertRouter;
