// models/Report.js
const mongoose = require("mongoose");

// ✅ Single counters collection (no new file)
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "report"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

async function getNextSequence(name) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

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
      enum: ["PENDING", "COMMUNITY_CONFIRMED", "ADMIN_VERIFIED", "REJECTED", "RESOLVED"],
      default: "PENDING",
    },

    confirmCount: { type: Number, default: 0 },
    denyCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ✅ Auto-generate "Report-00001" 
reportSchema.pre("validate", async function () {
  if (this.isNew && !this._id) {
    const seq = await getNextSequence("report");
    this._id = `Report-${String(seq).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("Report", reportSchema);