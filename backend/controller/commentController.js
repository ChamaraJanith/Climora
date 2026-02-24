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

// =====================================
// ADD COMMENT
// =====================================
exports.addComment = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.userId;
    const text = req.body.text;

    if (!text || !text.trim()) {
      console.log("❌ Comment text missing");
      return res.status(400).json({ error: "text is required" });
    }

    if (!userId) {
      console.log("❌ userId not found in token");
      return res.status(400).json({
        error: "Custom userId not found in req.user.",
      });
    }

    const comment = await ReportComment.create({
      reportId,
      userId,
      text,
    });

    await Report.findByIdAndUpdate(reportId, {
      $inc: { commentCount: 1 },
    });

    logCommentAction(req, `Comment ADDED → ${reportId}`);

    return res.status(201).json(comment);
  } catch (err) {
    console.log("❌ ADD COMMENT ERROR:", err.message);
    return res.status(400).json({ error: err.message });
  }
};

// =====================================
// GET COMMENTS FOR REPORT
// =====================================
exports.getComments = async (req, res) => {
  try {
    const reportId = req.params.id;

    const comments = await ReportComment.find({ reportId }).sort({
      createdAt: -1,
    });

    logCommentAction(req, `Fetched ${comments.length} comments → ${reportId}`);

    return res.json(comments);
  } catch (err) {
    console.log("❌ GET COMMENTS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// =====================================
// DELETE COMMENT (owner or admin)
// =====================================
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.userId;
    const isAdmin = req.user.role === "ADMIN";

    const comment = await ReportComment.findById(commentId);

    if (!comment) {
      console.log("❌ Comment not found:", commentId);
      return res.status(404).json({ error: "Comment not found" });
    }

    if (!isAdmin && comment.userId !== userId) {
      console.log("❌ Unauthorized comment delete attempt");
      return res.status(403).json({ error: "Not allowed" });
    }

    const reportId = comment.reportId;

    await comment.deleteOne();

    await Report.findByIdAndUpdate(reportId, {
      $inc: { commentCount: -1 },
    });

    logCommentAction(req, `Comment DELETED → ${reportId}`);

    return res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.log("❌ DELETE COMMENT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};