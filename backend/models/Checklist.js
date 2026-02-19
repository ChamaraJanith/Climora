// models/Checklist.js
const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema(
  {
    // Custom item ID: ITM-260219-4521
    _id: {
      type: String,
      default: () => {
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        return `ITM-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["food", "water", "medicine", "clothing", "tools", "documents", "other"],
      default: "other",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false, // Auto ObjectId disable - custom _id use කරනවා
    timestamps: true,
  }
);

const checklistSchema = new mongoose.Schema(
  {
    // Custom ID: CHL-260219-4521
    _id: {
      type: String,
      default: () => {
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        return `CHL-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    disasterType: {
      type: String,
      enum: ["flood", "drought", "cyclone", "landslide", "wildfire", "tsunami", "earthquake", "general"],
      default: "general",
    },
    // Items defined by admin only
    items: [checklistItemSchema],
    // Which admin created this
    createdBy: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

module.exports = mongoose.model("Checklist", checklistSchema);