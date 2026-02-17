const express = require("express");
const {
  getUserChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
} = require("../controller/checklistController");

const checklistRouter = express.Router();

checklistRouter.get("/user/:userId", getUserChecklist);
checklistRouter.post("/:checklistId/items", addChecklistItem);
checklistRouter.put("/:checklistId/items/:itemId", updateChecklistItem);
checklistRouter.delete("/:checklistId/items/:itemId", deleteChecklistItem);
checklistRouter.patch("/:checklistId/items/:itemId/toggle", toggleChecklistItem);

module.exports = checklistRouter;