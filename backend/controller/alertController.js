const Alert = require("../models/Alert");

/*
==============================================
CREATE ALERT
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

    // Generate custom alert ID
    const count = await Alert.countDocuments();
    const alertId = `ALERT-${String(count + 1).padStart(5, "0")}`;

    const alert = await Alert.create({
      ...req.body,
      alertId,
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
WITH:
- Pagination
- Filtering
- Sorting
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

    // Build filter object
    const filter = {};

    if (district) filter["area.district"] = district;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Sorting
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
GET ALERT BY ID
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
UPDATE ALERT
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