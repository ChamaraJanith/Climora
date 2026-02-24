// controller/commentController.js
const ReportComment = require("../models/ReportComment");
const Report = require("../models/Report");

// 🔹 helper logger
const logCommentAction = (req, message) => {
  console.log("==============================================");
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  console.log(`👤 USER: ${req.user?.userId || "UNKNOWN"}`);
  console.log(`💬 ACTION: ${message}`);
  console.log("==============================================");
};

exports.addComment = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user?.userId;
    const text = req.body.text;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    // ✅ allow comments ONLY for ADMIN_VERIFIED reports
    const report = await Report.findById(reportId).select("_id status");
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.status !== "ADMIN_VERIFIED") {
      logCommentAction(req, `Blocked comment (status=${report.status}) → ${reportId}`);
      return res.status(403).json({
        error: "Comments allowed only for ADMIN_VERIFIED reports",
      });
    }

    const comment = await ReportComment.create({
      reportId,
      userId,
      text,
    });

    await Report.findByIdAndUpdate(reportId, { $inc: { commentCount: 1 } });

    logCommentAction(req, `Comment ADDED → ${reportId}`);
    return res.status(201).json(comment);
  } catch (err) {
    console.log("❌ ADD COMMENT ERROR:", err.message);
    return res.status(400).json({ error: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const reportId = req.params.id;

    // (optional) public comments only for verified report
    const report = await Report.findById(reportId).select("_id status");
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.status !== "ADMIN_VERIFIED") {
      return res.status(404).json({ error: "Report not found" }); // hide
    }

    const comments = await ReportComment.find({ reportId }).sort({ createdAt: -1 });
    logCommentAction(req, `Fetched ${comments.length} comments → ${reportId}`);
    return res.json(comments);
  } catch (err) {
    console.log("❌ GET COMMENTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === "ADMIN";

    if (!userId) return res.status(401).json({ error: "Not authorized" });

    const comment = await ReportComment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // ✅ Only owner/admin can delete
    if (!isAdmin && comment.userId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // ✅ ensure comment belongs to verified report (optional strict)
    const report = await Report.findById(comment.reportId).select("_id status");
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.status !== "ADMIN_VERIFIED" && !isAdmin) {
      return res.status(403).json({
        error: "Cannot manage comments unless report is ADMIN_VERIFIED",
      });
    }

    const reportId = comment.reportId;
    await comment.deleteOne();
    await Report.findByIdAndUpdate(reportId, { $inc: { commentCount: -1 } });

    logCommentAction(req, `Comment DELETED → ${reportId}`);
    return res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.log("❌ DELETE COMMENT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};