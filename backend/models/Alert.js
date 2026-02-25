const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      unique: true,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["FLOOD", "STORM", "HEATWAVE", "LANDSLIDE", "TSUNAMI", "WILDFIRE"],
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },

    area: {
      district: {
        type: String,
        required: true,
      },
      city: {
        type: String,
      },
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔥 NEW FIELD
    source: {
      type: String,
      enum: ["MANUAL", "OpenWeatherMap"],
      default: "MANUAL",
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);