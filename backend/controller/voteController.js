const Report = require("../models/Report");
const ReportVote = require("../models/ReportVote");

const COMMUNITY_THRESHOLD = 5;

exports.voteReport = async (req, res) => {
  try {
    const { voteType } = req.body;
    const reportId = req.params.id;
    const userId = req.user._id;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ error: "Report not found" });

    // find existing vote
    let existing = await ReportVote.findOne({ reportId, userId });

    if (!existing) {
      await ReportVote.create({ reportId, userId, voteType });

      if (voteType === "UP") report.confirmCount += 1;
      else report.denyCount += 1;
    } else {
      // if same vote again do nothing
      if (existing.voteType === voteType) return res.json(report);

      // reverse counts
      if (existing.voteType === "UP") report.confirmCount -= 1;
      else report.denyCount -= 1;

      // apply new vote
      existing.voteType = voteType;
      await existing.save();

      if (voteType === "UP") report.confirmCount += 1;
      else report.denyCount += 1;
    }

    // community confirm logic
    if (report.confirmCount >= COMMUNITY_THRESHOLD && report.status === "PENDING") {
      report.status = "COMMUNITY_CONFIRMED";
    }

    await report.save();
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
