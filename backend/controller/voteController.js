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
    const userId = req.user.userId;
    const voteType = req.body.voteType; // "UP" or "DOWN"

    if (!["UP", "DOWN"].includes(voteType)) {
      console.log("❌ Invalid vote type");
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      console.log("❌ Report not found:", reportId);
      return res.status(404).json({ error: "Report not found" });
    }

    const existingVote = await Vote.findOne({ reportId, userId });

    // 🟢 Case 1: No previous vote → Create
    if (!existingVote) {
      await Vote.create({ reportId, userId, voteType });

      const inc =
        voteType === "UP"
          ? { confirmCount: 1 }
          : { denyCount: 1 };

      await Report.findByIdAndUpdate(reportId, { $inc: inc });

      logVoteAction(req, `Vote ADDED (${voteType}) → ${reportId}`);

      return res.status(200).json({ message: "Vote added" });
    }

    // 🟡 Case 2: Same vote clicked again → Remove (Toggle off)
    if (existingVote.voteType === voteType) {
      await Vote.deleteOne({ _id: existingVote._id });

      const dec =
        voteType === "UP"
          ? { confirmCount: -1 }
          : { denyCount: -1 };

      await Report.findByIdAndUpdate(reportId, { $inc: dec });

      logVoteAction(req, `Vote REMOVED (${voteType}) → ${reportId}`);

      return res.status(200).json({ message: "Vote removed" });
    }

    // 🔵 Case 3: Switch vote
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