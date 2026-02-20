// models/Counter.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // "report", "vote", "comment"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

module.exports = mongoose.models.Counter || mongoose.model("Counter", counterSchema);