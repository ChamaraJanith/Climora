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
      return res.status(400).json({
        error: "Custom userId not found.",
      });
    }

    const report = await Report.create({
      ...req.body,
      photos: imageUrls,
      userId: req.user.userId,
      createdBy: req.user.userId,
    });

    logAction(req, `Report Created → ${report._id}`);

    res.status(201).json(report);
  } catch (err) {
    console.log("❌ CREATE REPORT ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// ===============================
// GET ALL REPORTS
// ===============================
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });

    logAction(req, `Fetched ${reports.length} reports`);

    res.json(reports);
  } catch (err) {
    console.log("❌ GET REPORTS ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET ONE REPORT
// ===============================
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    logAction(req, `Viewed Report → ${report._id}`);

    res.json(report);
  } catch (err) {
    console.log("❌ GET REPORT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// UPDATE REPORT
// ===============================
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.status !== "PENDING") {
      return res.status(403).json({ error: "Cannot update after review" });
    }

    if (String(report.createdBy) !== String(req.user.userId)) {
      return res.status(403).json({ error: "Not owner" });
    }

    Object.assign(report, req.body);
    await report.save();

    logAction(req, `Report Updated → ${report._id}`);

    res.json(report);
  } catch (err) {
    console.log("❌ UPDATE ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// ===============================
// DELETE REPORT
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

    res.json({ message: "Report deleted" });
  } catch (err) {
    console.log("❌ DELETE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET VOTE SUMMARY
// ===============================
exports.getVoteSummary = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select(
      "_id confirmCount denyCount"
    );

    if (!report) return res.status(404).json({ error: "Report not found" });

    logAction(req, `Viewed Vote Summary → ${report._id}`);

    res.json({
      reportId: report._id,
      upVotes: report.confirmCount || 0,
      downVotes: report.denyCount || 0,
      totalVotes: (report.confirmCount || 0) + (report.denyCount || 0),
    });
  } catch (err) {
    console.log("❌ VOTE SUMMARY ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET REPORT SUMMARY
// ===============================
exports.getReportSummary = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select(
      "_id title status confirmCount denyCount commentCount createdAt"
    );

    if (!report) return res.status(404).json({ error: "Report not found" });

    let myVote = null;
    if (req.user?.userId) {
      const v = await Vote.findOne({
        reportId: req.params.id,
        userId: req.user.userId,
      }).select("voteType");
      myVote = v ? v.voteType : null;
    }

    logAction(req, `Viewed Full Summary → ${report._id}`);

    res.json({
      reportId: report._id,
      title: report.title,
      status: report.status,
      votes: {
        up: report.confirmCount || 0,
        down: report.denyCount || 0,
        total: (report.confirmCount || 0) + (report.denyCount || 0),
        myVote,
      },
      comments: {
        total: report.commentCount || 0,
      },
      createdAt: report.createdAt,
    });
  } catch (err) {
    console.log("❌ SUMMARY ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};