// models/Vote.js
const mongoose = require("mongoose");

// ===============================
// ✅ Single counters collection (same as Report.js)
// ===============================
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "vote"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false, collection: "counters" } // force same collection name
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

async function getNextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  if (!doc) throw new Error(`Counter doc is null for key: ${name}`);
  return doc.seq;
}

// ===============================
// ✅ Vote Schema
// ===============================
const voteSchema = new mongoose.Schema(
  {
    // ✅ Primary Key (custom string)
    _id: { type: String }, // "Vote-00001"

    // ✅ Keep Mongo ObjectId associated
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true,
      index: true,
    },

    // ✅ Report custom id (Report-00008)
    reportId: {
      type: String,
      ref: "Report",
      required: true,
      index: true,
    },

    // ✅ Voter user (Mongo ObjectId)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ UP/DOWN
    voteType: {
      type: String,
      enum: ["UP", "DOWN"],
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ One user can have max 1 vote per report
voteSchema.index({ reportId: 1, userId: 1 }, { unique: true });

// ✅ Auto-generate "Vote-00001"
voteSchema.pre("validate", async function () {
  if (this.isNew && !this._id) {
    const seq = await getNextSequence("vote");
    this._id = `Vote-${String(seq).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("Vote", voteSchema);