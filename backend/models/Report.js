// models/Report.js
const mongoose = require("mongoose");
const User = require("./User"); // only for ref consistency (optional)

// ===============================
// ✅ Single counters collection
// ===============================
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "report", "vote"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false, collection: "counters" }, // force same collection name
);

// ✅ reuse same model safely (avoid OverwriteModelError)
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

async function getNextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true, // ensures seq default on insert
    },
  );

  // safety guard (prevents "Cannot read properties of null (reading 'seq')")
  if (!doc) throw new Error(`Counter doc is null for key: ${name}`);
  return doc.seq;
}

// ===============================
// ✅ Report Schema
// ===============================
const reportSchema = new mongoose.Schema(
  {
    // ✅ Primary Key (custom string)
    _id: { type: String }, // "Report-00001"

    // ✅ Keep Mongo ObjectId associated
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true,
      index: true,
    },

    // ✅ report owner user (Mongo ObjectId)
    userId: {
      type: String,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    category: {
      type: String,
      enum: ["FLOOD", "LANDSLIDE", "HEATWAVE", "STORM", "AIR_QUALITY", "OTHER"],
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },

    location: {
      district: { type: String, required: true },
      city: { type: String, required: true },
      lat: Number,
      lon: Number,
    },

    photos: [{ type: String }],

    status: {
      type: String,
      enum: [
        "PENDING",
        "COMMUNITY_CONFIRMED",
        "ADMIN_VERIFIED",
        "REJECTED",
        "RESOLVED",
      ],
      default: "PENDING",
    },

    // ✅ counts updated ONLY by vote controller
    confirmCount: { type: Number, default: 0 },
    denyCount: { type: Number, default: 0 },

    // keep createdBy if you use it for owner checks
    createdBy: { type: String, ref: "User" },
  },
  { timestamps: true },
);

// ✅ Auto-generate "Report-00001"
reportSchema.pre("validate", async function () {
  if (this.isNew && !this._id) {
    const seq = await getNextSequence("report");
    this._id = `Report-${String(seq).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("Report", reportSchema);
