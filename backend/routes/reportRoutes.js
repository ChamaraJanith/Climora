const express = require("express");
const router = express.Router();

const reportController = require("../controller/reportController");
const voteController = require("../controller/voteController");
const commentController = require("../controller/commentController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* =====================================================
   ✅ ADMIN (PUT THESE FIRST)
===================================================== */

// Admin: get ALL reports (pending/rejected etc.)
router.get("/admin/all", protect, adminOnly, reportController.getAllReportsAdmin);

// Admin: view single report any status
router.get("/admin/:id", protect, adminOnly, reportController.getReportByIdAdmin);

// Admin: update status
router.patch("/:id/status", protect, adminOnly, reportController.updateReportStatusAdmin);

/* =====================================================
   ✅ REPORT (PUBLIC / MY)
===================================================== */

// Auth user's reports MUST be before /:id
router.get("/my", protect, reportController.getMyReports);

// User: view own report (any status) OR verified report
router.get("/user/:id", protect, reportController.getReportByIdUser);

// Public list (only verified)
router.get("/", reportController.getReports);

// Public vote summary
router.get("/:id/votes/summary", reportController.getVoteSummary);

// Legacy comments list
// router.get("/:id/comments", protect, commentController.getComments);

// New Embedded comments paginated (Publicly viewable)
router.get("/:id/comments", reportController.getEmbeddedComments);

// Public single report (only verified inside controller)
router.get("/:id", reportController.getReportById);

/* =====================================================
   ✅ REPORT (AUTH USER)
===================================================== */

router.post("/", protect, upload.array("photos", 5), reportController.createReport);
router.put("/:id", protect, upload.array("photos", 5), reportController.updateReport);
router.delete("/:id", protect, reportController.deleteReport);

/* =====================================================
   ✅ VOTE (AUTH)
===================================================== */

router.post("/:id/vote", protect, voteController.voteReport);

/* =====================================================
   ✅ COMMENTS (AUTH)
===================================================== */

router.post("/:id/comments", protect, commentController.addComment);

// NEW Embedded interaction routes
router.post("/:id/like", protect, reportController.toggleLike);
router.post("/:id/unlike", protect, reportController.toggleUnlike);
router.post("/:id/comment", protect, upload.single("image"), reportController.addEmbeddedComment);

// NEW Comment management routes (edit, delete, reply, like/unlike per comment)
router.put("/:id/comments/:commentId", protect, reportController.editEmbeddedComment);
router.delete("/:id/comments/:commentId", protect, reportController.deleteEmbeddedComment);
router.post("/:id/comments/:commentId/reply", protect, upload.single("image"), reportController.addReply);
router.post("/:id/comments/:commentId/like", protect, reportController.toggleCommentLike);
router.post("/:id/comments/:commentId/unlike", protect, reportController.toggleCommentUnlike);

router.delete("/comments/:commentId", protect, commentController.deleteComment);

/* =====================================================
   ✅ REPORT SUMMARY
===================================================== */

router.get("/:id/summary", protect, reportController.getReportSummary);

module.exports = router;

console.log("typeof protect:", typeof protect);
console.log("typeof adminOnly:", typeof adminOnly);
console.log("typeof getAllReportsAdmin:", typeof reportController.getAllReportsAdmin);