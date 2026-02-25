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
   ✅ REPORT (PUBLIC)
===================================================== */

// Public list (only verified)
router.get("/", reportController.getReports);

// Public vote summary
router.get("/:id/votes/summary", protect, reportController.getVoteSummary);

// Public comments list
router.get("/:id/comments", protect, commentController.getComments);

// Public single report (only verified inside controller)
router.get("/:id", protect, reportController.getReportById);

/* =====================================================
   ✅ REPORT (AUTH USER)
===================================================== */

router.post("/", protect, upload.array("photos", 5), reportController.createReport);
router.put("/:id", protect, reportController.updateReport);
router.delete("/:id", protect, reportController.deleteReport);

/* =====================================================
   ✅ VOTE (AUTH)
===================================================== */

router.post("/:id/vote", protect, voteController.voteReport);

/* =====================================================
   ✅ COMMENTS (AUTH)
===================================================== */

router.post("/:id/comments", protect, commentController.addComment);

router.delete("/comments/:commentId", protect, commentController.deleteComment);

/* =====================================================
   ✅ REPORT SUMMARY
===================================================== */

router.get("/:id/summary", protect, reportController.getReportSummary);

module.exports = router;

console.log("typeof protect:", typeof protect);
console.log("typeof adminOnly:", typeof adminOnly);
console.log("typeof getAllReportsAdmin:", typeof reportController.getAllReportsAdmin);