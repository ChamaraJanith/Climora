// routes/userChecklistRoutes.js
const express = require("express");
const {
  getMyChecklist,
  toggleItem,
  resetProgress,
  getProgress,
} = require("../controller/userChecklistController");

const { protect } = require("../middleware/authMiddleware");

const userChecklistRouter = express.Router();

// All routes require login
userChecklistRouter.use(protect);

// Get checklist with my marks (auto creates progress if first time)
userChecklistRouter.get("/:checklistId", getMyChecklist);

// Get my progress percentage only
userChecklistRouter.get("/:checklistId/progress", getProgress);

// Toggle single item checked/unchecked
userChecklistRouter.patch("/:checklistId/items/:itemId/toggle", toggleItem);

// Reset all items to unchecked
userChecklistRouter.patch("/:checklistId/reset", resetProgress);

module.exports = userChecklistRouter;