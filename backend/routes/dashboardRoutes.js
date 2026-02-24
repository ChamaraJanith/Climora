const express = require("express");

const {
  getAlertsAndRisk,
  getMyStatus, // 🔥 new smart summary endpoint
} = require("../controller/dashboardController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/*
====================================================
DASHBOARD ROUTES (Authenticated Users Only)
====================================================
*/

// Combined alerts + risk (manual lat/lon optional)
router.get("/alerts-risk", protect, getAlertsAndRisk);

// Smart personalized dashboard (uses user location automatically)
router.get("/my-status", protect, getMyStatus);

module.exports = router;