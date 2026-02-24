// controller/reportController.js
const Report = require("../models/Report");
const Vote = require("../models/Vote");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// ✅ Use your existing weather service
const { getOneCallData } = require("../services/weatherService"); // <-- path/name adjust if needed

// Helper function for logging
const logAction = (req, message) => {
  console.log("==============================================");
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  console.log(`👤 USER: ${req.user?.userId || "GUEST"}`);
  console.log(`📝 ACTION: ${message}`);
  console.log("==============================================");
};

// ===============================
// CREATE REPORT  (PENDING by default)
// - If FLOOD + lat/lon -> attach Weather Context
// ===============================
exports.createReport = async (req, res) => {
  try {
    let imageUrls = [];

    // ✅ If form-data sent location as JSON string
    if (req.body.location && typeof req.body.location === "string") {
      try {
        req.body.location = JSON.parse(req.body.location);
      } catch (e) {
        // ignore parse error (will fail validation if required fields missing)
      }
    }

    // Upload photos if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "climora-reports",
        });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    // ✅ MUST have custom userId (User-00001)
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Not authorized (no userId on token)" });
    }

    const lat = req.body?.location?.lat;
    const lon = req.body?.location?.lon;

    // ✅ Weather Context (Option 2)
    let weatherContext = undefined;

    // Only attach for FLOOD reports (you can remove this if you want for all categories)
    if (req.body.category === "FLOOD" && lat != null && lon != null) {
      try {
        const weather = await getOneCallData(lat, lon);

        const daily = weather?.daily?.[0];      // today / next 24h summary
        const current = weather?.current;       // current conditions

        const rain24h = Number(daily?.rain || 0);                 // mm (daily)
        const rain1h = Number(current?.rain?.["1h"] || 0);        // mm last 1 hour (if provided)

        let label = "No Rain";
        if (rain24h >= 50) label = "Heavy Rain";
        else if (rain24h >= 10) label = "Moderate Rain";
        else if (rain24h > 0) label = "Light Rain";

        weatherContext = {
          summary: `${label} (${rain24h}mm in last 24h)`,
          rain24hMm: rain24h,
          rain1hMm: rain1h,
          source: "openweather",
          fetchedAt: new Date(),
        };
      } catch (e) {
        console.log("⚠️ Weather Context fetch failed:", e.message);
      }
    }

    const report = await Report.create({
      ...req.body,
      photos: imageUrls,

      // store custom userId
      userId: req.user.userId,
      createdBy: req.user.userId,

      ...(weatherContext ? { weatherContext } : {}),
    });

    logAction(req, `Report Created → ${report._id}`);
    if (report.weatherContext?.summary) {
      console.log(`🌧 WEATHER: ${report.weatherContext.summary}`);
    }

    return res.status(201).json(report);
  } catch (err) {
    console.log("❌ CREATE REPORT ERROR:", err.message);
    return res.status(400).json({ error: err.message });
  }
};

// ===============================
// PUBLIC: GET VERIFIED REPORTS ONLY
// ===============================
exports.getReports = async (req, res) => {
  try {
    const { category, severity, district, city, search } = req.query;

    // Always only verified for public
    const filter = {
      status: "ADMIN_VERIFIED",
    };

    // 🔹 Category filter
    if (category) {
      filter.category = category;
    }

    // 🔹 Severity filter
    if (severity) {
      filter.severity = severity;
    }

    // 🔹 Location filter
    if (district) {
      filter["location.district"] = district;
    }

    if (city) {
      filter["location.city"] = city;
    }

    // 🔹 Search filter (title / description)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const reports = await Report.find(filter).sort({
      createdAt: -1,
    });

    logAction(req, `Fetched PUBLIC reports: ${reports.length}`);

    return res.json(reports);
  } catch (err) {
    console.log("❌ GET REPORTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ADMIN: GET ALL REPORTS (filters supported)
// GET /api/reports/admin/all?status=PENDING&days=7&category=FLOOD&severity=HIGH
exports.getAllReportsAdmin = async (req, res) => {
  try {
    const { status, days, category, severity, district, city, search } = req.query;

    const filter = {};

    // ✅ status filter
    if (status) filter.status = status;

    // ✅ category/severity filters (optional)
    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    // ✅ location filters (optional)
    if (district) filter["location.district"] = district;
    if (city) filter["location.city"] = city;

    // ✅ search (optional)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ days filter (only recent reports)
    if (days) {
      const n = Number(days);
      if (!Number.isNaN(n) && n > 0) {
        const cutoff = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
        filter.createdAt = { $gte: cutoff };
      }
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 });

    console.log("==============================================");
    console.log(`📥 GET ${req.originalUrl}`);
    console.log(`👤 ADMIN: ${req.user?.userId}`);
    console.log(`🧾 FILTER:`, filter);
    console.log(`✅ RESULT: ${reports.length} reports`);
    console.log("==============================================");

    return res.json(reports);
  } catch (err) {
    console.log("❌ ADMIN GET REPORTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// PUBLIC: GET ONE REPORT (verified only)
// ===============================
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.status !== "ADMIN_VERIFIED") {
      return res.status(404).json({ error: "Report not found" });
    }

    logAction(req, `Public viewed report → ${report._id}`);
    return res.json(report);
  } catch (err) {
    console.log("❌ GET REPORT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// ADMIN: GET ONE REPORT (any status)
// ===============================
exports.getReportByIdAdmin = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    logAction(req, `Admin viewed report → ${report._id}`);
    return res.json(report);
  } catch (err) {
    console.log("❌ ADMIN GET REPORT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// UPDATE REPORT (owner only if PENDING)
// ===============================
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    // block sensitive fields
    const blockedFields = [
      "_id",
      "objectId",
      "userId",
      "createdBy",
      "confirmCount",
      "denyCount",
      "commentCount",
      "status",
      "weatherContext",
    ];
    blockedFields.forEach((f) => {
      if (req.body[f] !== undefined) delete req.body[f];
    });

    if (report.status !== "PENDING") {
      return res.status(403).json({ error: "Cannot update after review" });
    }

    if (String(report.createdBy) !== String(req.user.userId)) {
      return res.status(403).json({ error: "Not owner" });
    }

    Object.assign(report, req.body);
    await report.save();

    logAction(req, `Report Updated → ${report._id}`);
    return res.json(report);
  } catch (err) {
    console.log("❌ UPDATE ERROR:", err.message);
    return res.status(400).json({ error: err.message });
  }
};

// ===============================
// DELETE REPORT (owner pending OR admin)
// ===============================
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const isOwner = String(report.createdBy) === String(req.user.userId);
    const isAdmin = req.user.role === "ADMIN";

    if (!(isAdmin || (isOwner && report.status === "PENDING"))) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await report.deleteOne();

    logAction(req, `Report Deleted → ${report._id}`);
    return res.json({ message: "Report deleted" });
  } catch (err) {
    console.log("❌ DELETE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET VOTE SUMMARY (public: verified only)
// ===============================
exports.getVoteSummary = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select(
      "_id status confirmCount denyCount"
    );

    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.status !== "ADMIN_VERIFIED") {
      return res.status(404).json({ error: "Report not found" });
    }

    logAction(req, `Viewed Vote Summary → ${report._id}`);
    return res.json({
      reportId: report._id,
      upVotes: report.confirmCount || 0,
      downVotes: report.denyCount || 0,
      totalVotes: (report.confirmCount || 0) + (report.denyCount || 0),
    });
  } catch (err) {
    console.log("❌ VOTE SUMMARY ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET REPORT SUMMARY (verified only)
// ===============================
exports.getReportSummary = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select(
      "_id title status confirmCount denyCount commentCount weatherContext createdAt"
    );

    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.status !== "ADMIN_VERIFIED") {
      return res.status(404).json({ error: "Report not found" });
    }

    let myVote = null;
    if (req.user?.userId) {
      const v = await Vote.findOne({
        reportId: req.params.id,
        userId: req.user.userId,
      }).select("voteType");
      myVote = v ? v.voteType : null;
    }

    logAction(req, `Viewed Summary → ${report._id}`);

    return res.json({
      reportId: report._id,
      title: report.title,
      status: report.status,
      votes: {
        up: report.confirmCount || 0,
        down: report.denyCount || 0,
        total: (report.confirmCount || 0) + (report.denyCount || 0),
        myVote,
      },
      comments: { total: report.commentCount || 0 },
      weatherContext: report.weatherContext || null,
      createdAt: report.createdAt,
    });
  } catch (err) {
    console.log("❌ SUMMARY ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// ADMIN: UPDATE REPORT STATUS
// ===============================
exports.updateReportStatusAdmin = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status } = req.body;

    const allowed = [
      "PENDING",
      "COMMUNITY_CONFIRMED",
      "ADMIN_VERIFIED",
      "REJECTED",
      "RESOLVED",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    if (!report) return res.status(404).json({ error: "Report not found" });

    logAction(req, `Admin updated status → ${report._id} = ${status}`);
    return res.json(report);
  } catch (err) {
    console.log("❌ ADMIN STATUS UPDATE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};