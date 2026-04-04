const express = require("express");
const axios = require("axios");

const {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  getMyAlerts, // 🔥 NEW
} = require("../controller/alertController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/*
==================================================
VIEW ALERTS
All authenticated users can view alerts
==================================================
*/

router.get("/search-location", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json([]);
  }

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          format: "json",
          q: `${q}, Sri Lanka`,
          countrycodes: "lk",
          limit: 5,
        },
        headers: {
          "User-Agent": "climora-app",
        },
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("SEARCH ERROR:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/", protect, getAlerts);          // Get all alerts (with pagination/filtering)
router.get("/my", protect, getMyAlerts);      // Get alerts for logged-in user's district
router.get("/:id", protect, getAlertById);    // Get single alert by ID

/*
==================================================
CREATE / UPDATE / DELETE ALERTS
ADMIN ONLY
==================================================
*/

router.post("/", protect, allowRoles("ADMIN"), createAlert);
router.put("/:id", protect, allowRoles("ADMIN"), updateAlert);
router.delete("/:id", protect, allowRoles("ADMIN"), deleteAlert);

module.exports = router;