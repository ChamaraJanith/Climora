// models/ShelterOccupancy.js

const mongoose = require("mongoose");

const shelterOccupancySchema = new mongoose.Schema(
  {
    shelterId: {
      type: String,
      required: true,
      index: true,
    },
    // Snapshot numbers
    capacityTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    currentOccupancy: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    safeThresholdPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 90,
    },
    isOverCapacity: {
      type: Boolean,
      default: false,
    },

    childrenCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    elderlyCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    specialNeedsCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // snapshot time / created by
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: String,
      trim: true, // userId / name
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShelterOccupancy", shelterOccupancySchema);
