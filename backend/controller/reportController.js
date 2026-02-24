// controller/reportController.js
const Report = require("../models/Report");
const Vote = require("../models/Vote");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// Helper function for logging
const logAction = (req, message) => {
  console.log("==============================================");
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  console.log(`👤 USER: ${req.user?.userId || "GUEST"}`);
  console.log(`📝 ACTION: ${message}`);
  console.log("==============================================");
};

// ===============================
// CREATE REPORT
// ===============================
exports.createReport = async (req, res) => {
  try {
    logAction(req, "Create Report request received");

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "climora-reports",
        });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    if (!req.user?.userId) {
      logAction(req, "Create Report BLOCKED: Custom userId not found");
      return res.status(400).json({ error: "Custom userId not found." });
    }

    const report = await Report.create({
      ...req.body,
      photos: imageUrls,
      userId: req.user.userId,
      createdBy: req.user.userId,
    });

    logAction(req, `Report Created (PENDING) → ${report._id}`);
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
    logAction(req, "Public list request received");

    const reports = await Report.find({ status: "ADMIN_VERIFIED" }).sort({
      createdAt: -1,
    });

    logAction(req, `Fetched PUBLIC verified reports: ${reports.length}`);
    return res.json(reports);
  } catch (err) {
    console.log("❌ GET REPORTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// ADMIN: GET ALL REPORTS
// ===============================
exports.getAllReportsAdmin = async (req, res) => {
  try {
    logAction(req, "Admin list ALL reports request received");

    const reports = await Report.find({}).sort({ createdAt: -1 });

    logAction(req, `Admin fetched ALL reports: ${reports.length}`);
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
    logAction(req, `Public view report request: ${req.params.id}`);

    const report = await Report.findById(req.params.id);
    if (!report) {
      logAction(req, `Public view FAILED: Report not found (${req.params.id})`);
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.status !== "ADMIN_VERIFIED") {
      logAction(req, `Public view BLOCKED: Not verified (${report._id} status=${report.status})`);
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
    logAction(req, `Admin view report request: ${req.params.id}`);

    const report = await Report.findById(req.params.id);
    if (!report) {
      logAction(req, `Admin view FAILED: Report not found (${req.params.id})`);
      return res.status(404).json({ error: "Report not found" });
    }

    logAction(req, `Admin viewed report → ${report._id} (status=${report.status})`);
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
    logAction(req, `Update report request: ${req.params.id}`);

    const report = await Report.findById(req.params.id);
    if (!report) {
      logAction(req, `Update FAILED: Report not found (${req.params.id})`);
      return res.status(404).json({ error: "Report not found" });
    }

    // block sensitive fields
    const blockedFields = [
      "_id","objectId","userId","createdBy","confirmCount","denyCount","commentCount","status",
    ];
    blockedFields.forEach((f) => {
      if (req.body[f] !== undefined) delete req.body[f];
    });

    if (report.status !== "PENDING") {
      logAction(req, `Update BLOCKED: status=${report.status}`);
      return res.status(403).json({ error: "Cannot update after review" });
    }

    if (String(report.createdBy) !== String(req.user.userId)) {
      logAction(req, `Update BLOCKED: Not owner (createdBy=${report.createdBy})`);
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
// DELETE REPORT
// ===============================
exports.deleteReport = async (req, res) => {
  try {
    logAction(req, `Delete report request: ${req.params.id}`);

    const report = await Report.findById(req.params.id);
    if (!report) {
      logAction(req, `Delete FAILED: Report not found (${req.params.id})`);
      return res.status(404).json({ error: "Report not found" });
    }

    const isOwner = String(report.createdBy) === String(req.user.userId);
    const isAdmin = req.user.role === "ADMIN";

    if (!(isAdmin || (isOwner && report.status === "PENDING"))) {
      logAction(req, `Delete BLOCKED: isAdmin=${isAdmin} isOwner=${isOwner} status=${report.status}`);
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
// GET VOTE SUMMARY (verified only public)
// ===============================
exports.getVoteSummary = async (req, res) => {
  try {
    logAction(req, `Vote summary request: ${req.params.id}`);

    const report = await Report.findById(req.params.id).select(
      "_id status confirmCount denyCount"
    );

    if (!report) {
      logAction(req, `Vote summary FAILED: Report not found (${req.params.id})`);
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.status !== "ADMIN_VERIFIED") {
      logAction(req, `Vote summary BLOCKED: Not verified (${report._id} status=${report.status})`);
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
    logAction(req, `Report summary request: ${req.params.id}`);

    const report = await Report.findById(req.params.id).select(
      "_id title status confirmCount denyCount commentCount createdAt"
    );

    if (!report) {
      logAction(req, `Summary FAILED: Report not found (${req.params.id})`);
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.status !== "ADMIN_VERIFIED") {
      logAction(req, `Summary BLOCKED: Not verified (${report._id} status=${report.status})`);
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

    logAction(req, `Viewed Public Summary → ${report._id}`);

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
    logAction(req, `Admin status update request: ${req.params.id}`);

    const { status } = req.body;

    const allowed = [
      "PENDING",
      "COMMUNITY_CONFIRMED",
      "ADMIN_VERIFIED",
      "REJECTED",
      "RESOLVED",
    ];

    if (!allowed.includes(status)) {
      logAction(req, `Admin status update BLOCKED: invalid status (${status})`);
      return res.status(400).json({ error: "Invalid status value" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      logAction(req, `Admin status update FAILED: Report not found (${req.params.id})`);
      return res.status(404).json({ error: "Report not found" });
    }

    logAction(req, `Admin updated status → ${report._id} = ${status}`);
    return res.json(report);
  } catch (err) {
    console.log("❌ ADMIN STATUS UPDATE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};