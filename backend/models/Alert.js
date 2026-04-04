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
      uppercase: true,
      enum: ["FLOOD", "STORM", "EARTHQUAKE", "LANDSLIDE", "TSUNAMI", "WILDFIRE", "CYCLONE", "OTHER"],
      required: true,
    },

    severity: {
      type: String,
      uppercase: true,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },

    area: {
      district: {
        type: String,
        required: true,
      },
      cities: [{
        type: String
      }],
      // temporary backward compatibility
      city: {
        type: String,
      },
    },

    location: {
      lat: Number,
      lng: Number
    },

    locations: {
      type: [
        {
          lat: Number,
          lng: Number
        }
      ],
      default: []
    },

    safetyInstructions: [String],

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