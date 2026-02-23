// controller/commentController.js
const ReportComment = require("../models/ReportComment");
const Report = require("../models/Report");

// =====================================
// ADD COMMENT
// =====================================
exports.addComment = async (req, res) => {
  try {
    const reportId = req.params.id;        // "Report-00008"
    const userId = req.user.userId;        // "User-00001"
    const text = req.body.text;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    if (!userId) {
      return res.status(400).json({
        error:
          "Custom userId not found in req.user. Check protect middleware.",
      });
    }

    // ✅ create comment
    const comment = await ReportComment.create({
      reportId,
      userId,
      text,
    });

    // ✅ increment report comment count
    await Report.findByIdAndUpdate(reportId, {
      $inc: { commentCount: 1 },
    });

    return res.status(201).json(comment);
  } catch (err) {
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

    return res.json(comments);
  } catch (err) {
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

    if (!comment)
      return res.status(404).json({ error: "Comment not found" });

    // ✅ Only comment owner or admin can delete
    if (!isAdmin && comment.userId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const reportId = comment.reportId;

    await comment.deleteOne();

    // ✅ decrement report comment count
    await Report.findByIdAndUpdate(reportId, {
      $inc: { commentCount: -1 },
    });

    return res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};