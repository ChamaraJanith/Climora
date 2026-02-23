// controller/reportController.js
const Report = require("../models/Report");
const Vote = require("../models/Vote");

// CREATE REPORT
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

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

        // delete local file after upload
        fs.unlinkSync(file.path);
      }
    }

    // ✅ MUST have custom userId (User-00001)
    if (!req.user?.userId) {
      return res.status(400).json({
        error:
          "Custom userId not found. Make sure User model generates userId (User-00001) and protect middleware attaches it.",
      });
    }

    const report = await Report.create({
      ...req.body,
      photos: imageUrls,

      // ✅ store custom userId (NOT Mongo ObjectId)
      userId: req.user.userId,

      // ✅ keep createdBy too (use custom id)
      createdBy: req.user.userId,
    });

    console.log("==============================================");
    console.log("📥 POST /api/reports");
    console.log(`🌍 REPORT CREATED: ${report._id}`);
    console.log(`👤 USER (custom): ${req.user.userId}`);
    console.log(`🖼 Uploaded Images: ${imageUrls.length}`);
    console.log("==============================================");

    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ===============================
// GET ALL REPORTS (with filters)
// ===============================
exports.getReports = async (req, res) => {
  try {
    const {
      category,
      severity,
      district,
      city,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (district) filter["location.district"] = district;
    if (city) filter["location.city"] = city;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Report.countDocuments(filter);

    res.json({
      data: reports,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
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
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// UPDATE REPORT (owner only if PENDING)
// ===============================
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    // ✅ block sensitive fields
    const blockedFields = [
      "_id",
      "objectId",
      "userId",
      "createdBy",
      "confirmCount",
      "denyCount",
      "commentCount",
      "status",
    ];

    blockedFields.forEach((f) => {
      if (req.body[f] !== undefined) delete req.body[f];
    });

    if (report.status !== "PENDING") {
      return res.status(403).json({ error: "Cannot update after review" });
    }

    // ✅ owner check using custom id
    if (String(report.createdBy) !== String(req.user.userId)) {
      return res.status(403).json({ error: "Not owner" });
    }

    Object.assign(report, req.body);
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ===============================
// DELETE REPORT (owner if pending OR admin)
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
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET VOTE SUMMARY FOR ONE REPORT
// ===============================
exports.getVoteSummary = async (req, res) => {
  try {
    const reportId = req.params.id;

    const report = await Report.findById(reportId).select(
      "_id confirmCount denyCount"
    );

    if (!report) return res.status(404).json({ error: "Report not found" });

    return res.json({
      reportId: report._id,
      upVotes: report.confirmCount || 0,
      downVotes: report.denyCount || 0,
      totalVotes: (report.confirmCount || 0) + (report.denyCount || 0),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET REPORT SUMMARY (votes + comments + myVote)
// ===============================
exports.getReportSummary = async (req, res) => {
  try {
    const reportId = req.params.id;

    const report = await Report.findById(reportId).select(
      "_id title status confirmCount denyCount commentCount createdAt"
    );

    if (!report) return res.status(404).json({ error: "Report not found" });

    const upVotes = report.confirmCount || 0;
    const downVotes = report.denyCount || 0;
    const commentCount = report.commentCount || 0;

    // ✅ optional: myVote (requires protect middleware)
    let myVote = null;
    if (req.user?.userId) {
      const v = await Vote.findOne({
        reportId,
        userId: req.user.userId,
      }).select("voteType");
      myVote = v ? v.voteType : null;
    }

    return res.json({
      reportId: report._id,
      title: report.title,
      status: report.status,
      votes: {
        up: upVotes,
        down: downVotes,
        total: upVotes + downVotes,
        myVote,
      },
      comments: {
        total: commentCount,
      },
      createdAt: report.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};