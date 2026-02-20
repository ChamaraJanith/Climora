const Report = require("../models/Report");
const Vote = require("../models/Vote");

exports.voteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user._id;
    const voteType = req.body.voteType; // "UP" or "DOWN"

    if (!["UP", "DOWN"].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
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

      return res.status(200).json({ message: "Vote removed" });
    }

    // 🔵 Case 3: Switch vote (UP → DOWN or DOWN → UP)
    const updateCounts =
      voteType === "UP"
        ? { confirmCount: 1, denyCount: -1 }
        : { confirmCount: -1, denyCount: 1 };

    existingVote.voteType = voteType;
    await existingVote.save();

    await Report.findByIdAndUpdate(reportId, { $inc: updateCounts });

    return res.status(200).json({ message: "Vote switched" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};