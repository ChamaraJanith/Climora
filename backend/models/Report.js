const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
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

    photos: [{ type: String }], // Later store uploaded paths/URLs

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

    confirmCount: { type: Number, default: 0 },
    denyCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
