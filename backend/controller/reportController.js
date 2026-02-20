const Report = require("../models/Report");

// CREATE REPORT
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

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

    const report = await Report.create({
      ...req.body,
      photos: imageUrls,
      createdBy: req.user._id,
    });

    console.log("==============================================");
    console.log("📥 POST /api/reports");
    console.log(`🌍 REPORT CREATED: ${report._id}`);
    console.log(`🖼 Uploaded Images: ${imageUrls.length}`);
    console.log("==============================================");

    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// GET ALL REPORTS (with filters)
exports.getReports = async (req, res) => {
  try {
    const { category, severity, district, city, status, search, page = 1, limit = 10 } =
      req.query;

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

    const skip = (page - 1) * limit;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Report.countDocuments(filter);

    res.json({ data: reports, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE REPORT
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE REPORT (owner only if PENDING)
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.status !== "PENDING")
      return res.status(403).json({ error: "Cannot update after review" });

    if (String(report.createdBy) !== String(req.user._id))
      return res.status(403).json({ error: "Not owner" });

    Object.assign(report, req.body);
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE REPORT (owner if pending OR admin)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const isOwner = String(report.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === "ADMIN";

    if (!(isAdmin || (isOwner && report.status === "PENDING")))
      return res.status(403).json({ error: "Not allowed" });

    await report.deleteOne();
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
