const Alert = require("../models/Alert");
const normalizeDistrict = require("../utils/normalizeDistrict");
const axios = require("axios");

/*
==============================================
REVERSE GEOCODING HELPER
==============================================
*/
const getCityFromCoords = async (lat, lng) => {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        lat,
        lon: lng,
        format: "json",
      },
      headers: {
        "User-Agent": "climora-app",
      },
    });

    const address = res.data.address || {};

    console.log("📍 Full address:", address);

    return (
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.neighbourhood ||
      address.hamlet ||
      address.county ||
      address.state_district ||
      null
    );
  } catch {
    return null;
  }
};

/*
==============================================
CREATE ALERT (ADMIN)
==============================================
*/
exports.createAlert = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      area,
      startAt,
      locations,
      safetyInstructions
    } = req.body;

    if (!title || !description || !category || !severity || !area?.district || !startAt) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Derive cities from location coordinates via reverse geocoding
    let derivedCities = [];

    if (Array.isArray(locations) && locations.length > 0) {
      for (const loc of locations) {
        const city = await getCityFromCoords(loc.lat, loc.lng);
        if (city && !derivedCities.includes(city)) {
          derivedCities.push(city);
        }
      }
    }

    console.log("📍 Derived cities:", derivedCities);

    // Ensure cities array exists — prefer explicit > derived > district fallback
    const normalizedArea = {
      district: area?.district || "",
      cities:
        area?.cities?.length
          ? area.cities
          : derivedCities.length
            ? derivedCities
            : [area?.district]
    };

    console.log("🚨 Creating alert with area:", normalizedArea);

    // Generate sequential custom ID safely
    const lastAlert = await Alert.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastAlert && lastAlert.alertId) {
      const lastNumber = parseInt(lastAlert.alertId.split("-")[1]);
      nextNumber = lastNumber + 1;
    }

    const alertId = `ALERT-${String(nextNumber).padStart(5, "0")}`;

    const alert = await Alert.create({
      title,
      description,
      category,
      severity,
      area: normalizedArea,
      startAt,
      locations: locations || [],
      safetyInstructions,
      isActive: true,
      alertId,
      source: "MANUAL",
    });

    const io = req.app?.get?.("io") || global.io;

    if (io) {
      console.log("🔥 [SOCKET] alertCreated emitted:", alert.title);
      io.emit("alertCreated", alert);
    }

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
      search,
      severity,
      category,
      isActive,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const searchTerm = search || district;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive numbers",
      });
    }

    const filter = {
      isActive: true
    };

    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");

      filter.$or = [
        { "area.district": searchRegex },
        { "area.cities": { $in: [searchRegex] } },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }
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
    const { startAt } = req.body;

    if (startAt) {
      const newStart = new Date(startAt);
      const now = new Date();

      if (isNaN(newStart.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date"
        });
      }

      if (newStart < now) {
        return res.status(400).json({
          success: false,
          message: "Start date/time must be current or future"
        });
      }
    }

    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.id },
      {
        ...req.body,
        locations: req.body.locations || [],
      },
      { new: true, runValidators: true }
    );

    const io = req.app?.get?.("io") || global.io;
    if (io && alert) {
      console.log("🔄 [SOCKET] alertUpdated emitted:", alert.title);
      io.emit("alertUpdated", alert);
    }

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

    const io = req.app?.get?.("io") || global.io;
    if (io && alert) {
      console.log("❌ [SOCKET] alertDeleted emitted:", alert._id);
      io.emit("alertDeleted", alert._id);
    }

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
Paginated — same response envelope as getAlerts
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

    let { page = 1, limit = 10, search, severity } = req.query;

    page  = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive numbers",
      });
    }

    const userDistrict = normalizeDistrict(req.user.location.district);

    // Build filter: district match + active
    const filter = { isActive: true };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { "area.district": searchRegex },
        { "area.cities": { $in: [searchRegex] } },
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    if (severity) filter.severity = severity;

    // Fetch all active alerts matching optional filters, then narrow by district
    // (district normalisation requires in-app logic, so we pull candidates first)
    const allMatching = await Alert.find(filter).sort({ createdAt: -1 });

    const districtFiltered = allMatching.filter((a) => {
      const alertDistrict = normalizeDistrict(a.area?.district);
      return alertDistrict === userDistrict;
    });

    const total      = districtFiltered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip       = (page - 1) * limit;
    const paginated  = districtFiltered.slice(skip, skip + limit);

    res.json({
      success: true,
      district: userDistrict,
      pagination: {
        totalRecords: total,
        currentPage:  page,
        totalPages,
        pageSize:     limit,
      },
      data: paginated,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch personalized alerts",
      error: err.message,
    });
  }
};