const express = require("express");

const
{
    getAllShelters,
    getShelterById,
    createShelter,
    updateShelter,
    deleteShelter,
    updateShelterItem,
    increaseShelterItem,
    decreaseShelterItem,
    deleteShelterItem,
    getShelterCountsByDistrict,
}= require("../controller/shelterController");

const ShelterRouter = express.Router();

//Shelter routes
ShelterRouter.get("/", getAllShelters);
ShelterRouter.get("/:id", getShelterById);
ShelterRouter.post("/", createShelter);
ShelterRouter.put("/:id", updateShelter);
ShelterRouter.delete("/:id", deleteShelter);
ShelterRouter.get("/counts/by-district", getShelterCountsByDistrict);

//Relief Item routes
ShelterRouter.put("/:id/items/:itemName", updateShelterItem);
ShelterRouter.put("/:id/items/:itemName/increase", increaseShelterItem);
ShelterRouter.put("/:id/items/:itemName/decrease", decreaseShelterItem);
ShelterRouter.delete("/:id/items/:itemName", deleteShelterItem);


module.exports = ShelterRouter;