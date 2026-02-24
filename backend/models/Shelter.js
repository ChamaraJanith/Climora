const mongoose = require("mongoose");
const reliefItemSchema = require("./ReliefItems");

const shelterSchema = new mongoose.Schema(
  {
    shelterId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    capacityTotal: {
      type: Number,
      required: true,
    },
    capacityCurrent: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["school", "temple", "communityHall", "other"],
      default: "other",
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    facilities: [String],
    contactPerson: String,
    contactPhone: String,
    contactEmail: String,
    currentOccupantsCount: {
      type: Number,
      default: 0,
    },
    lastUpdatedBy: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["planned", "standby", "open", "closed"],
      default: "planned",
    },
    openSince: Date,
    closedAt: Date,

    // Relief items embedded but fetched via separate routes
    reliefItems: {
      type: [reliefItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shelter", shelterSchema);
