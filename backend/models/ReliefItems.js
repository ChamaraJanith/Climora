const mongoose = require("mongoose");

const reliefItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "food",
        "medicine",
        "water",
        "clothes",
        "hygiene",
        "battery",
        "other",
      ],
      default: "other",
    },
    quantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "liters", "pieces", "units"],
      default: "units",
    },
    expiryDate: Date,
    priorityLevel: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    providedBy: {
      type: String,
      default: "unknown", 
    },
  },
  { _id: false }
);

module.exports = reliefItemSchema;
