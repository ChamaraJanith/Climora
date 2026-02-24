const express = require("express");

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