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

    const category = req.body.category?.toUpperCase();
    const lat = req.body?.location?.lat || req.body?.location?.latitude;
    const lon = req.body?.location?.lon || req.body?.location?.longitude;

    console.log("CATEGORY:", category);
    console.log("LAT:", lat, "LON:", lon);

    // ✅ Weather Context
    let weatherContext = null;

    // Only attach for FLOOD / RAIN-related incidents
    const rainRelatedCategories = ["FLOOD", "STORM"];
    
    if (rainRelatedCategories.includes(category) && lat != null && lon != null) {
      try {
        const fetchWeather = getOneCallData(lat, lon);
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Weather API timeout")), 5000)
        );

        const weather = await Promise.race([fetchWeather, timeout]);

        if (!weather) {
          weatherContext = null;
        } else {
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
        }
      } catch (e) {
        console.log("⚠️ Weather Context fetch failed:", e.message);
        weatherContext = null;
      }
    }

    const report = await Report.create({
      ...req.body,
      photos: imageUrls,

      // store custom userId
      userId: req.user.userId,
      createdBy: req.user.userId,

      weatherContext: weatherContext,
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

    // 🔹 Search filter (title / description / location)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.district": { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
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

// ===============================
// AUTH: GET LOGGED IN USER'S REPORTS
// ===============================
exports.getMyReports = async (req, res) => {
  try {
    const { category, severity, status, search } = req.query;

    const filter = { userId: req.user.userId };

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.district": { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 });

    logAction(req, `Fetched MY reports: ${reports.length}`);
    return res.json(reports);
  } catch (err) {
    console.log("❌ GET MY REPORTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// AUTH: GET REPORTS IN MY AREA (DISTRICT)
// ===============================
exports.getMyAreaReports = async (req, res) => {
  try {
    let userDistrict = req.user.district || req.user.location?.district;
    if (!userDistrict && req.query.district) {
      userDistrict = req.query.district;
    }

    if (!userDistrict) {
      return res.status(400).json({ error: "User district is required" });
    }

    const reports = await Report.find({
      "location.district": { $regex: new RegExp(`^${userDistrict}$`, "i") },
      status: "ADMIN_VERIFIED"
    }).sort({ createdAt: -1 }).lean();

    logAction(req, `Fetched MY AREA reports for district: ${userDistrict}`);
    return res.json({ reports });
  } catch (err) {
    console.log("❌ GET MY AREA REPORTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ADMIN: GET ALL REPORTS (filters supported)
// GET /api/reports/admin/all?status=PENDING&days=7&category=FLOOD&severity=HIGH
exports.getAllReportsAdmin = async (req, res) => {
  try {
    const { status, days, category, severity, district, city, search, page, limit } = req.query;

    const filter = {};

    // ✅ status filter
    if (status) filter.status = status;

    // ✅ category/severity filters (optional)
    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    // ✅ location filters (optional)
    if (district) filter["location.district"] = district;
    if (city) filter["location.city"] = city;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.district": { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
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

    // Pagination logic
    const reqPage = page ? Math.max(1, Number(page) || 1) : null;
    const reqLimit = limit ? Math.max(1, Number(limit) || 12) : 12;

    let reports = [];
    let totalReports = 0;
    let totalPages = 1;
    let currentPage = reqPage || 1;

    if (reqPage) {
      // Return paginated response
      const skip = (reqPage - 1) * reqLimit;
      [reports, totalReports] = await Promise.all([
        Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(reqLimit),
        Report.countDocuments(filter)
      ]);
      totalPages = Math.ceil(totalReports / reqLimit) || 1;
    } else {
      // Return all matching response
      reports = await Report.find(filter).sort({ createdAt: -1 });
      totalReports = reports.length;
    }

    console.log("==============================================");
    console.log(`📥 GET ${req.originalUrl}`);
    console.log(`👤 ADMIN: ${req.user?.userId}`);
    console.log(`🧾 FILTER:`, filter);
    console.log(`✅ RESULT: ${reports.length} reports`);
    console.log("==============================================");

    return res.json({
      reports,
      totalPages,
      currentPage,
      totalReports
    });
  } catch (err) {
    console.log("❌ ADMIN GET REPORTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// ADMIN: GET REPORT STATS (LAST 7 DAYS)
// ===============================
exports.getIncidentStats = async (req, res) => {
  try {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const reports = await Report.find({
      status: "ADMIN_VERIFIED",
      createdAt: { $gte: last7Days, $lte: today }
    });

    const days = [];
    const dateCounts = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push(dateStr);
      dateCounts[dateStr] = { Flood: 0, Landslide: 0, Pollution: 0, Other: 0 };
    }

    reports.forEach(r => {
      const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateCounts[dateStr] !== undefined) {
        const cat = r.category?.toUpperCase() || "OTHER";
        if (cat === "FLOOD") dateCounts[dateStr].Flood++;
        else if (cat === "LANDSLIDE") dateCounts[dateStr].Landslide++;
        else if (cat === "POLLUTION") dateCounts[dateStr].Pollution++;
        else dateCounts[dateStr].Other++;
      }
    });

    const data = days.map(d => ({
      date: d,
      Flood: dateCounts[d].Flood,
      Landslide: dateCounts[d].Landslide,
      Pollution: dateCounts[d].Pollution,
      Other: dateCounts[d].Other
    }));

    res.json(data);
  } catch (err) {
    console.log("❌ GET STATS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// PUBLIC: GET ONE REPORT (verified only)
// ===============================
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    });
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
// USER: GET ONE REPORT (own reports any status, others only verified)
// ===============================
exports.getReportByIdUser = async (req, res) => {
  try {
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    });

    if (!report) return res.status(404).json({ error: "Report not found" });

    const isOwner = String(report.userId) === String(req.user?.userId);
    const isVerified = report.status === "ADMIN_VERIFIED";

    // Allow owner to see own reports; allow anyone to see verified reports
    if (!isOwner && !isVerified) {
      return res.status(403).json({ error: "Access denied" });
    }

    logAction(req, `User viewed report → ${report._id} (owner: ${isOwner})`);
    return res.json(report);
  } catch (err) {
    console.log("❌ GET REPORT (USER) ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};



// ===============================
// ADMIN: GET ONE REPORT (any status)
// ===============================
exports.getReportByIdAdmin = async (req, res) => {
  try {
    const report = await Report.findOne({
      $or: [
        { _id: req.params.id },
        { reportId: req.params.id }
      ]
    });
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

    if (report.status === "ADMIN_VERIFIED") {
      return res.status(403).json({ error: "Cannot edit an admin verified report" });
    }

    if (String(report.createdBy) !== String(req.user.userId)) {
      return res.status(403).json({ error: "Not owner" });
    }

    if (req.body.location && typeof req.body.location === "string") {
      try {
        req.body.location = JSON.parse(req.body.location);
      } catch (e) {}
    }

    let parsedExistingPhotos = [];
    if (req.body.existingPhotos) {
      try {
        parsedExistingPhotos = JSON.parse(req.body.existingPhotos);
      } catch (e) {
        parsedExistingPhotos = Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos];
      }
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "climora-reports" });
        newImageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    if (req.body.existingPhotos !== undefined || newImageUrls.length > 0) {
      req.body.photos = [...parsedExistingPhotos, ...newImageUrls];
    } else if (req.body.photos !== undefined) {
      delete req.body.photos;
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

    if (!(isAdmin || isOwner)) {
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

// ===============================
// TOGGLE LIKE (Embedded array)
// ===============================
exports.toggleLike = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;

    const report = await Report.findOne({ $or: [{ _id: reportId }, { reportId }] });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const hasLiked = report.likes.includes(userId);

    let updatedReport;
    if (hasLiked) {
      // Unlike it (remove from likes)
      updatedReport = await Report.findByIdAndUpdate(
        report._id,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      // Like it (add to likes, remove from unlikes)
      updatedReport = await Report.findByIdAndUpdate(
        report._id,
        {
          $addToSet: { likes: userId },
          $pull: { unlikes: userId }
        },
        { new: true }
      );
    }

    return res.json({
      likeCount: updatedReport.likes.length,
      unlikeCount: updatedReport.unlikes.length,
      commentCount: updatedReport.comments.length
    });
  } catch (err) {
    console.log("❌ TOGGLE LIKE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// TOGGLE UNLIKE (Embedded array)
// ===============================
exports.toggleUnlike = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;

    const report = await Report.findOne({ $or: [{ _id: reportId }, { reportId }] });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const hasUnliked = report.unlikes.includes(userId);

    let updatedReport;
    if (hasUnliked) {
      // Remove unlike
      updatedReport = await Report.findByIdAndUpdate(
        report._id,
        { $pull: { unlikes: userId } },
        { new: true }
      );
    } else {
      // Add unlike, remove like
      updatedReport = await Report.findByIdAndUpdate(
        report._id,
        {
          $addToSet: { unlikes: userId },
          $pull: { likes: userId }
        },
        { new: true }
      );
    }

    return res.json({
      likeCount: updatedReport.likes.length,
      unlikeCount: updatedReport.unlikes.length,
      commentCount: updatedReport.comments.length
    });
  } catch (err) {
    console.log("❌ TOGGLE UNLIKE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// ADD EMBEDDED COMMENT
// ===============================
exports.addEmbeddedComment = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;
    const text = req.body.text?.trim();
    const parentId = req.body.parentId || null; 
    const hasImage = req.file;

    if (!text && !hasImage) {
      return res.status(400).json({ error: "Comment must contain text or an image." });
    }

    if (text && text.length > 500) {
      return res.status(400).json({ error: "Comment text exceeds 500 characters." });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "climora-comments",
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const report = await Report.findOneAndUpdate(
      { $or: [{ _id: reportId }, { reportId }] },
      {
        $push: {
          comments: { 
            user: userId, 
            text, 
            parentId: parentId,
            image: imageUrl,
            createdAt: new Date() 
          }
        }
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ error: "Report not found" });

    // Return the specific new comment (last one pushed)
    const newComment = report.comments[report.comments.length - 1];

    return res.json({
      success: true,
      comment: newComment,
      commentCount: report.comments.length
    });
  } catch (err) {
    console.log("❌ ADD COMMENT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// GET EMBEDDED COMMENTS (Paginated)
// ===============================
exports.getEmbeddedComments = async (req, res) => {
  try {
    const reportId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Fetch mostly all for grouping

    const report = await Report.findOne({ $or: [{ _id: reportId }, { reportId }] })
      .select("comments")
      .populate("comments.user", "username profileImage")
      .lean();

    if (!report) return res.status(404).json({ error: "Report not found" });

    // Sort by createdAt DESC strictly
    const sortedComments = (report.comments || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Normalize and add interaction fallbacks
    const normalizedComments = sortedComments.map(c => ({
      ...c,
      likes: c.likes || [],
      unlikes: c.unlikes || [],
      parentId: c.parentId || null
    }));

    return res.json({
      comments: normalizedComments,
      total: normalizedComments.length
    });

  } catch (err) {
    console.log("❌ GET COMMENTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// EDIT EMBEDDED COMMENT
// ===============================
exports.editEmbeddedComment = async (req, res) => {
  try {
    const { id: reportId, commentId } = req.params;
    const userId = req.user._id;
    const text = req.body.text?.trim();

    if (!text || text.length > 500) return res.status(400).json({ error: "Text must be 1-500 chars" });

    const report = await Report.findOne({ $or: [{ _id: reportId }, { reportId }] });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const comment = report.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to edit" });
    }

    comment.text = text;
    comment.updatedAt = new Date();
    await report.save();

    return res.json({ success: true, comment });
  } catch (err) {
    console.log("❌ EDIT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// DELETE EMBEDDED COMMENT (Recursive)
// ===============================
exports.deleteEmbeddedComment = async (req, res) => {
  try {
    const { id: reportId, commentId } = req.params;
    const userId = req.user._id;

    const report = await Report.findOne({ $or: [{ _id: reportId }, { reportId }] });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const targetComment = report.comments.id(commentId);
    if (!targetComment) return res.status(404).json({ error: "Comment not found" });

    // Verify ownership
    if (targetComment.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // RECURSIVE DELETE: 
    // Filter out the target comment AND any comments that have it as parentId
    const originalCount = report.comments.length;
    report.comments = report.comments.filter(c => 
      c._id.toString() !== commentId && 
      (!c.parentId || c.parentId.toString() !== commentId)
    );

    await report.save();

    return res.json({ 
      success: true, 
      commentCount: report.comments.length,
      deletedCount: originalCount - report.comments.length
    });
  } catch (err) {
    console.log("❌ DELETE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// ADD REPLY TO COMMENT (Flat logic)
// ===============================
exports.addReply = async (req, res) => {
  // Use the addEmbeddedComment logic but ensure parentId comes from URL
  req.body.parentId = req.params.commentId;
  return exports.addEmbeddedComment(req, res);
};

// ===============================
// TOGGLE LIKE ON COMMENT
// ===============================
exports.toggleCommentLike = async (req, res) => {
  try {
    const { id: reportId, commentId } = req.params;
    const userId = req.user._id;

    const report = await Report.findOne({ $or: [{ _id: reportId }, { reportId }] });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const comment = report.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Defensive array check
    comment.likes = comment.likes || [];
    comment.unlikes = comment.unlikes || [];

    const hasLiked = comment.likes.some(id => id.toString() === userId.toString());

    if (hasLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.addToSet(userId);
      comment.unlikes.pull(userId);
    }

    await report.save();
    return res.json({ likeCount: comment.likes.length, unlikeCount: comment.unlikes.length });
  } catch (err) {
    console.log("❌ LIKE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ===============================
// TOGGLE UNLIKE ON COMMENT
// ===============================
exports.toggleCommentUnlike = async (req, res) => {
  try {
    const { id: reportId, commentId } = req.params;
    const userId = req.user._id;

    const report = await Report.findOne({ $or: [{ _id: reportId }, { reportId }] });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const comment = report.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    comment.likes = comment.likes || [];
    comment.unlikes = comment.unlikes || [];

    const hasUnliked = comment.unlikes.some(id => id.toString() === userId.toString());

    if (hasUnliked) {
      comment.unlikes.pull(userId);
    } else {
      comment.unlikes.addToSet(userId);
      comment.likes.pull(userId);
    }

    await report.save();
    return res.json({ likeCount: comment.likes.length, unlikeCount: comment.unlikes.length });
  } catch (err) {
    console.log("❌ UNLIKE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};