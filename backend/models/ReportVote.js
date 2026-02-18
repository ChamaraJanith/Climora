const mongoose = require("mongoose");

const reportVoteSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voteType: {
      type: String,
      enum: ["UP", "DOWN"],
      required: true,
    },
  },
  { timestamps: true }
);

// One vote per user per report
reportVoteSchema.index({ reportId: 1, userId: 1 }, { unique: true });

// ✅ Standard safe export method (prevents OverwriteModelError)
module.exports =
  mongoose.models.ReportVote || mongoose.model("ReportVote", reportVoteSchema);
