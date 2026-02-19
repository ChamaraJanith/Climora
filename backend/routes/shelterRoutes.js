const express = require("express");

const
{
    getAllShelters,
    getShelterById,
    createShelter,
    updateShelter,
    deleteShelter,
    getShelterCountsByDistrict,
    getNearbyShelters,
    updateShelterStatus,
}= require("../controller/shelterController");

const {
    updateShelterItem,
    increaseShelterItem,
    decreaseShelterItem,
    deleteShelterItem,
    getShelterItems,
} = require("../controller/reliefItemController");


const ShelterRouter = express.Router();

//Shelter statistics routes
ShelterRouter.get("/counts/by-district", getShelterCountsByDistrict);
ShelterRouter.get("/nearby", getNearbyShelters);


//Shelter routes
ShelterRouter.get("/", getAllShelters);
ShelterRouter.get("/:id", getShelterById);
ShelterRouter.post("/", createShelter);
ShelterRouter.put("/:id", updateShelter);
ShelterRouter.delete("/:id", deleteShelter);
ShelterRouter.put("/:id/status", updateShelterStatus);


//Relief Item routes
ShelterRouter.put("/:id/items/:itemName", updateShelterItem);
ShelterRouter.put("/:id/items/:itemName/increase", increaseShelterItem);
ShelterRouter.put("/:id/items/:itemName/decrease", decreaseShelterItem);
ShelterRouter.delete("/:id/items/:itemName", deleteShelterItem);
ShelterRouter.get("/:id/items", getShelterItems);


module.exports = ShelterRouter;