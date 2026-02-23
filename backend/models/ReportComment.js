// models/ReportComment.js
const mongoose = require("mongoose");

/* =====================================================
   ✅ Single counters collection (forced to "counters")
===================================================== */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "comment"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false, collection: "counters" }
);

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

async function getNextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (!doc) throw new Error(`Counter doc is null for key: ${name}`);
  return doc.seq;
}

/* =====================================================
   ✅ ReportComment Schema
===================================================== */
const reportCommentSchema = new mongoose.Schema(
  {
    // ✅ Custom Primary Key
    _id: { type: String }, // "Comment-00001"

    // ✅ (Optional) keep objectId associated
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true,
      index: true,
    },

    // ✅ Custom report id (Report-00008)
    reportId: {
      type: String,
      required: true,
      index: true,
    },

    // ✅ Custom user id (User-00001)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Auto-generate "Comment-00001"
reportCommentSchema.pre("validate", async function () {
  if (this.isNew && !this._id) {
    const seq = await getNextSequence("comment");
    this._id = `Comment-${String(seq).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("ReportComment", reportCommentSchema);