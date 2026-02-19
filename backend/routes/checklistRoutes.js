// routes/checklistRoutes.js
const express = require("express");
const {
  getAllChecklists,
  getChecklistById,
  createChecklist,
  adminAddItem,
  adminUpdateItem,
  adminDeleteItem,
  deleteChecklist,
} = require("../controller/checklistController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const checklistRouter = express.Router();

// Public - anyone can view checklists
checklistRouter.get("/", getAllChecklists);
checklistRouter.get("/:checklistId", getChecklistById);

// Admin only - manage checklist templates
checklistRouter.post("/", protect, adminOnly, createChecklist);
checklistRouter.post("/:checklistId/items", protect, adminOnly, adminAddItem);
checklistRouter.put("/:checklistId/items/:itemId", protect, adminOnly, adminUpdateItem);
checklistRouter.delete("/:checklistId/items/:itemId", protect, adminOnly, adminDeleteItem);
checklistRouter.delete("/:checklistId", protect, adminOnly, deleteChecklist);

module.exports = checklistRouter;