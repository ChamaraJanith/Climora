const express = require("express");
const router = express.Router();

const reportController = require("../controller/reportController");
const voteController = require("../controller/voteController");
const commentController = require("../controller/commentController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* =====================================================
   ✅ REPORT (PUBLIC)
   - Users see only ADMIN_VERIFIED
===================================================== */

// Public list (only verified)
router.get("/", reportController.getReports);

// Public single report (only verified inside controller)
router.get("/:id",protect, reportController.getReportById);

// Public vote summary (only verified inside controller)
router.get("/:id/votes/summary", protect,reportController.getVoteSummary);

// Public comments list (comments can be public too)
router.get("/:id/comments", protect,commentController.getComments);

/* =====================================================
   ✅ REPORT (AUTH USER)
===================================================== */

// Create report (no need :userId in url, we take from token)
router.post(
  "/",
  protect,
  upload.array("photos", 5),
  reportController.createReport
);

// Update (owner only + only if PENDING)
router.put("/:id", protect, reportController.updateReport);

// Delete (owner pending OR admin)
router.delete("/:id", protect, reportController.deleteReport);

/* =====================================================
   ✅ VOTE (AUTH)
===================================================== */
router.post("/:id/vote", protect, voteController.voteReport);

/* =====================================================
   ✅ COMMENTS (AUTH)
===================================================== */
router.post("/:id/comments", protect, commentController.addComment);

// Delete comment (owner/admin)
router.delete(
  "/comments/:commentId",
  protect,
  commentController.deleteComment
);

/* =====================================================
   ✅ REPORT SUMMARY (OPTIONAL)
   - If you want myVote -> protect required
   - Controller must hide non-verified for non-admin
===================================================== */
router.get("/:id/summary", protect, reportController.getReportSummary);

/* =====================================================
   ✅ ADMIN
===================================================== */

// Admin: get ALL reports (pending/rejected etc.)
router.get("/admin/all", protect, adminOnly, reportController.getAllReportsAdmin);

// Admin: view single report any status
router.get("/admin/:id", protect, adminOnly, reportController.getReportByIdAdmin);

// Admin: update status
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  reportController.updateReportStatusAdmin
);

module.exports = router;