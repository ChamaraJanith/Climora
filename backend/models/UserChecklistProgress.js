// models/UserChecklistProgress.js
const mongoose = require("mongoose");

// Stores which items this user has checked
const markedItemSchema = new mongoose.Schema(
  {
    // Reference to the original item _id in admin's checklist
    itemId: {
      type: String,
      required: true,
    },
    isChecked: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false, // No need for separate ID, itemId is enough
  }
);

const userChecklistProgressSchema = new mongoose.Schema(
  {
    // Custom ID: UCP-260219-4521
    _id: {
      type: String,
      default: () => {
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        return `UCP-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
    // Which user
    userId: {
      type: String,
      required: true,
    },
    // Which checklist
    checklistId: {
      type: String,
      ref: "Checklist",
      required: true,
    },
    // Marked items for this user
    markedItems: [markedItemSchema],
  },
  {
    timestamps: true,
    _id: false,
  }
);

// One progress record per user per checklist
userChecklistProgressSchema.index({ userId: 1, checklistId: 1 }, { unique: true });

module.exports = mongoose.model("UserChecklistProgress", userChecklistProgressSchema);