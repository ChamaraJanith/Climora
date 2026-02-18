const Alert = require("../models/Alert");

/*
  CREATE ALERT
*/
exports.createAlert = async (req, res) => {
  try {
    const { title, description, category, severity, area, startAt, endAt } =
      req.body;

    // Basic validation
    if (!title || !description || !category || !severity || !area?.district || !startAt || !endAt) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Date validation
    if (new Date(startAt) >= new Date(endAt)) {
      return res.status(400).json({
        error: "endAt must be after startAt",
      });
    }

    const alert = await Alert.create(req.body);

    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};

/*
  GET ALL ALERTS
  Supports:
  - Filtering (district, severity)
  - Pagination (page, limit)
*/
exports.getAlerts = async (req, res) => {
  try {
    const { district, severity, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (district) filter["area.district"] = district;
    if (severity) filter.severity = severity;

    // Auto deactivate expired alerts
    await Alert.updateMany(
      { endAt: { $lt: new Date() } },
      { isActive: false }
    );

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    const total = await Alert.countDocuments(filter);

    res.json({
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      data: alerts,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch alerts",
    });
  }
};

/*
  GET ALERT BY ID
*/
exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    res.json(alert);
  } catch (err) {
    res.status(400).json({
      error: "Invalid Alert ID",
    });
  }
};

/*
  UPDATE ALERT
*/
exports.updateAlert = async (req, res) => {
  try {
    const { startAt, endAt } = req.body;

    // If both dates provided → validate
    if (startAt && endAt) {
      if (new Date(startAt) >= new Date(endAt)) {
        return res.status(400).json({
          error: "endAt must be after startAt",
        });
      }
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    res.json(alert);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};

/*
  DELETE ALERT (Soft Delete)
  Instead of removing from DB, we deactivate it
*/
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    res.json({
      message: "Alert deactivated successfully",
    });
  } catch (err) {
    res.status(400).json({
      error: "Invalid Alert ID",
    });
  }
};
