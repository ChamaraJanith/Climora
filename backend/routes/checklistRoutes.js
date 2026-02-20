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

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const checklistRouter = express.Router();

// PUBLIC ROUTES
checklistRouter.get("/", getAllChecklists);
checklistRouter.get("/:checklistId", getChecklistById);

// CONTENT_MANAGER + ADMIN ROUTES
checklistRouter.post(
  "/",
  protect,
  allowRoles("ADMIN", "CONTENT_MANAGER"),
  createChecklist
);

checklistRouter.post(
  "/:checklistId/items",
  protect,
  allowRoles("ADMIN", "CONTENT_MANAGER"),
  adminAddItem
);

checklistRouter.put(
  "/:checklistId/items/:itemId",
  protect,
  allowRoles("ADMIN", "CONTENT_MANAGER"),
  adminUpdateItem
);

checklistRouter.delete(
  "/:checklistId/items/:itemId",
  protect,
  allowRoles("ADMIN", "CONTENT_MANAGER"),
  adminDeleteItem
);

checklistRouter.delete(
  "/:checklistId",
  protect,
  allowRoles("ADMIN", "CONTENT_MANAGER"),
  deleteChecklist
);

module.exports = checklistRouter;