const express = require("express");
const router = express.Router();

const reportController = require("../controller/reportController");
const voteController = require("../controller/voteController");
const commentController = require("../controller/commentController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* ---------- REPORT CRUD ---------- */

router.post(
  "/:userId",
  protect,
  upload.array("photos", 5),
  reportController.createReport
);

router.get("/", reportController.getReports);
router.get("/:id", reportController.getReportById);
router.put("/:id", protect, reportController.updateReport);
router.delete("/:id", protect, reportController.deleteReport);

/* ---------- VOTE ---------- */

router.post("/:id/vote", protect, voteController.voteReport);
router.get("/:id/votes/summary", reportController.getVoteSummary);// Vote summary

/* ---------- COMMENTS ---------- */

router.post("/:id/comments", protect, commentController.addComment);
router.get("/:id/comments", commentController.getComments);
router.get("/:id/summary", protect, reportController.getReportSummary);
router.delete(
  "/comments/:commentId",


  protect,
  commentController.deleteComment
);

/* ---------- ADMIN ---------- */

router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  const Report = require("../models/Report");
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(report);
});

module.exports = router;