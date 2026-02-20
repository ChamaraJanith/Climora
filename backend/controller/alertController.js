const Alert = require("../models/Alert");

/*
==============================================
CREATE ALERT
==============================================
*/
exports.createAlert = async (req, res) => {
  try {
    // Count existing alerts
    const count = await Alert.countDocuments();

    const newAlertId = `ALERT-${String(count + 1).padStart(5, "0")}`;

    const alert = await Alert.create({
      ...req.body,
      alertId: newAlertId,
    });

    console.log("==============================================");
    console.log("📥 POST /api/alerts");
    console.log(`🚨 ALERT CREATED: ${alert.alertId}`);
    console.log("==============================================");

    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/*
==============================================
GET ALL ALERTS
==============================================
*/
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find();

    console.log("==============================================");
    console.log("📥 GET /api/alerts");
    console.log(`📋 TOTAL ALERTS FETCHED: ${alerts.length}`);
    console.log("==============================================");

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

/*
==============================================
GET ALERT BY ID
==============================================
*/
exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.id });

    if (!alert) {
      console.log("==============================================");
      console.log("📥 GET /api/alerts/:id");
      console.log("❌ ALERT NOT FOUND");
      console.log("==============================================");

      return res.status(404).json({ error: "Alert not found" });
    }

    console.log("==============================================");
    console.log("📥 GET /api/alerts/:id");
    console.log(`🔎 ALERT FETCHED: ${alert.alertId}`);
    console.log("==============================================");

    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: "Invalid Alert ID" });
  }
};

/*
==============================================
UPDATE ALERT
==============================================
*/
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      req.body,
      { new: true }
    );

    if (!alert) {
      console.log("==============================================");
      console.log("📥 PUT /api/alerts/:id");
      console.log("❌ ALERT NOT FOUND");
      console.log("==============================================");

      return res.status(404).json({ error: "Alert not found" });
    }

    console.log("==============================================");
    console.log("📥 PUT /api/alerts/:id");
    console.log(`✏ ALERT UPDATED: ${alert._id}`);
    console.log("==============================================");

    res.json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/*
==============================================
DELETE ALERT (SOFT DELETE)
==============================================
*/
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      { isActive: false },
      { new: true }
    );

    if (!alert) {
      console.log("==============================================");
      console.log("📥 DELETE /api/alerts/:id");
      console.log("❌ ALERT NOT FOUND");
      console.log("==============================================");

      return res.status(404).json({ error: "Alert not found" });
    }

    console.log("==============================================");
    console.log("📥 DELETE /api/alerts/:id");
    console.log(`🗑 ALERT DEACTIVATED: ${alert._id}`);
    console.log("==============================================");

    res.json({ message: "Alert deactivated successfully" });
  } catch (err) {
    res.status(400).json({ error: "Invalid Alert ID" });
  }
};
