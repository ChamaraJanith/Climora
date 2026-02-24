const express = require("express");
const {
  getAllShelters,
  getShelterById,
  createShelter,
  updateShelter,
  deleteShelter,
  getShelterCountsByDistrict,
  getNearbyShelters,
  updateShelterStatus,
} = require("../controller/shelterController");

const {
  getShelterItems,
  updateShelterItem,
  increaseShelterItem,
  decreaseShelterItem,
  deleteShelterItem,
} = require("../controller/reliefItemController");

const {
  createShelterOccupancy,
  getLatestShelterOccupancy,
  getShelterOccupancyHistory,
  updateCurrentOccupancy,
} = require("../controller/shelterOccupancyController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const ShelterRouter = express.Router();

/**
 * PUBLIC / READ-ONLY ROUTES
 */

// Shelter stats
ShelterRouter.get("/counts/by-district", getShelterCountsByDistrict);
ShelterRouter.get("/nearby", getNearbyShelters);

// Shelter core read
ShelterRouter.get("/", getAllShelters);
ShelterRouter.get("/:id", getShelterById);

// Relief items read
ShelterRouter.get("/:id/items", getShelterItems);

// Occupancy read
ShelterRouter.get("/:id/occupancy", getLatestShelterOccupancy);
ShelterRouter.get("/:id/occupancy/history", getShelterOccupancyHistory);

/**
 * ADMIN + SHELTER_MANAGER ROUTES
 */

// Shelter create / update / status
ShelterRouter.post(
  "/",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  createShelter
);

ShelterRouter.put(
  "/:id",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  updateShelter
);

ShelterRouter.put(
  "/:id/status",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  updateShelterStatus
);

// Occupancy write
ShelterRouter.post(
  "/:id/occupancy",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  createShelterOccupancy
);

ShelterRouter.put(
  "/:id/occupancy/current",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  updateCurrentOccupancy
);

// Relief items modify
ShelterRouter.put(
  "/:id/items/:itemName",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  updateShelterItem
);

ShelterRouter.put(
  "/:id/items/:itemName/increase",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  increaseShelterItem
);

ShelterRouter.put(
  "/:id/items/:itemName/decrease",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  decreaseShelterItem
);

ShelterRouter.delete(
  "/:id/items/:itemName",
  protect,
  allowRoles("ADMIN", "SHELTER_MANAGER"),
  deleteShelterItem
);

/**
 * ADMIN ONLY ROUTES
 */

// Optional: only ADMIN can delete shelters
ShelterRouter.delete(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  deleteShelter
);

module.exports = ShelterRouter;
