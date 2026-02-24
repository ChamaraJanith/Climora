// controller/voteController.js
const Report = require("../models/Report");
const Vote = require("../models/Vote");

// 🔹 helper log function
const logVoteAction = (req, message) => {
  console.log("==============================================");
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  console.log(`👤 USER: ${req.user?.userId || "UNKNOWN"}`);
  console.log(`🗳 ACTION: ${message}`);
  console.log("==============================================");
};

exports.voteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user?.userId;
    const voteType = req.body.voteType;

    if (!userId) return res.status(401).json({ error: "Not authorized" });

    if (!["UP", "DOWN"].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    // ✅ allow votes ONLY for ADMIN_VERIFIED reports
    const report = await Report.findById(reportId).select("_id status");
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.status !== "ADMIN_VERIFIED") {
      logVoteAction(req, `Blocked vote (status=${report.status}) → ${reportId}`);
      return res.status(403).json({
        error: "Voting allowed only for ADMIN_VERIFIED reports",
      });
    }

    const existingVote = await Vote.findOne({ reportId, userId });

    // 🟢 No vote → create
    if (!existingVote) {
      await Vote.create({ reportId, userId, voteType });

      const inc = voteType === "UP" ? { confirmCount: 1 } : { denyCount: 1 };
      await Report.findByIdAndUpdate(reportId, { $inc: inc });

      logVoteAction(req, `Vote ADDED (${voteType}) → ${reportId}`);
      return res.status(200).json({ message: "Vote added" });
    }

    // 🟡 Same vote again → remove (toggle)
    if (existingVote.voteType === voteType) {
      await Vote.deleteOne({ _id: existingVote._id });

      const dec = voteType === "UP" ? { confirmCount: -1 } : { denyCount: -1 };
      await Report.findByIdAndUpdate(reportId, { $inc: dec });

      logVoteAction(req, `Vote REMOVED (${voteType}) → ${reportId}`);
      return res.status(200).json({ message: "Vote removed" });
    }

    // 🔵 switch vote
    const updateCounts =
      voteType === "UP"
        ? { confirmCount: 1, denyCount: -1 }
        : { confirmCount: -1, denyCount: 1 };

    existingVote.voteType = voteType;
    await existingVote.save();
    await Report.findByIdAndUpdate(reportId, { $inc: updateCounts });

    logVoteAction(req, `Vote SWITCHED → ${reportId} (${voteType})`);
    return res.status(200).json({ message: "Vote switched" });
  } catch (err) {
    console.log("❌ VOTE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};