const express = require("express");
const { getAlertsAndRisk } = require("../controller/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Authenticated users can access dashboard
router.get("/alerts-risk", protect, getAlertsAndRisk);

module.exports = router;