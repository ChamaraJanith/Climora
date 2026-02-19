// routes/ShelterRouter.js
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

const ShelterRouter = express.Router();

// Shelter stats
ShelterRouter.get("/counts/by-district", getShelterCountsByDistrict);
ShelterRouter.get("/nearby", getNearbyShelters);

// Shelter core
ShelterRouter.get("/", getAllShelters);
ShelterRouter.post("/", createShelter);
ShelterRouter.get("/:id", getShelterById);
ShelterRouter.put("/:id", updateShelter);
ShelterRouter.delete("/:id", deleteShelter);
ShelterRouter.put("/:id/status", updateShelterStatus);

// Relief items
ShelterRouter.get("/:id/items", getShelterItems);
ShelterRouter.put("/:id/items/:itemName", updateShelterItem);
ShelterRouter.put("/:id/items/:itemName/increase", increaseShelterItem);
ShelterRouter.put("/:id/items/:itemName/decrease", decreaseShelterItem);
ShelterRouter.delete("/:id/items/:itemName", deleteShelterItem);

module.exports = ShelterRouter;
