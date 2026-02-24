const Alert = require("../models/Alert");

/*
==============================================
CREATE ALERT (ADMIN)
==============================================
*/
exports.createAlert = async (req, res) => {
  try {
    const { title, description, category, severity, area, startAt } = req.body;

    if (!title || !description || !category || !severity || !area?.district || !startAt) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Generate sequential custom ID safely
    const lastAlert = await Alert.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastAlert && lastAlert.alertId) {
      const lastNumber = parseInt(lastAlert.alertId.split("-")[1]);
      nextNumber = lastNumber + 1;
    }

    const alertId = `ALERT-${String(nextNumber).padStart(5, "0")}`;

    const alert = await Alert.create({
      ...req.body,
      alertId,
      source: "MANUAL",
    });

    res.status(201).json({
      success: true,
      data: alert,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create alert",
      error: err.message,
    });
  }
};


/*
==============================================
GET ALL ALERTS
Pagination + Filtering + Sorting
==============================================
*/
exports.getAlerts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      district,
      severity,
      category,
      isActive,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive numbers",
      });
    }

    const filter = {};

    if (district) filter["area.district"] = district;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const sortOption = {};
    sortOption[sortBy] = order === "asc" ? 1 : -1;

    const total = await Alert.countDocuments(filter);

    const alerts = await Alert.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      pagination: {
        totalRecords: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        pageSize: limit,
      },
      data: alerts,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: err.message,
    });
  }
};


/*
==============================================
GET ALERT BY CUSTOM ID
==============================================
*/
exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.id });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      data: alert,
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Invalid alert ID format",
    });
  }
};


/*
==============================================
UPDATE ALERT (ADMIN)
==============================================
*/
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      data: alert,
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Failed to update alert",
      error: err.message,
    });
  }
};


/*
==============================================
SOFT DELETE ALERT (ADMIN)
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
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      message: "Alert deactivated successfully",
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Invalid alert ID",
    });
  }
};


/*
==============================================
GET ALERTS FOR LOGGED-IN USER (PERSONALIZED)
==============================================
*/
exports.getMyAlerts = async (req, res) => {
  try {
    if (!req.user || !req.user.location?.district) {
      return res.status(400).json({
        success: false,
        message: "User location not configured",
      });
    }

    const district = req.user.location.district;

    const alerts = await Alert.find({
      "area.district": district,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      district,
      totalAlerts: alerts.length,
      data: alerts,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch personalized alerts",
      error: err.message,
    });
  }
};