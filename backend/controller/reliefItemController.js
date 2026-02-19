const reliefItemSchema = require("../models/ReliefItems");
const Shelter = require("../models/Shelter");

// GET /api/shelters/:id/items - get all items for one shelter
exports.getShelterItems = async (req, res) => {
  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id }).lean();
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    return res.json({
      shelterId: shelter.shelterId,
      shelterName: shelter.name,
      district: shelter.district,
      reliefItems: shelter.reliefItems || [],
    });
  } catch (err) {
    console.error("❌ Error fetching shelter items:", err.message);
    res.status(500).json({
      error: "❌ Failed to fetch shelter items",
      details: err.message,
    });
  }
};



// Update or add one item in specific shelter
exports.updateShelterItem = async (req, res) => {
  const { name, category, quantity, unit, expiryDate, priorityLevel } =
    req.body;

  if (!name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "❌ Shelter not found" });
    }

    const itemIndex = shelter.reliefItems.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (itemIndex >= 0) {
      const item = shelter.reliefItems[itemIndex];

      if (quantity !== undefined) item.quantity = quantity;
      if (category !== undefined) item.category = category;
      if (unit !== undefined) item.unit = unit;
      if (expiryDate !== undefined) item.expiryDate = expiryDate;
      if (priorityLevel !== undefined) item.priorityLevel = priorityLevel;

      item.lastUpdated = Date.now();
    } else {
      shelter.reliefItems.push({
        name,
        category,
        quantity,
        unit,
        expiryDate,
        priorityLevel,
        lastUpdated: Date.now(),
      });
    }

    await shelter.save();
    console.log("✅ Shelter item upserted:", shelter._id, name);
    res.json(shelter);
  } catch (err) {
    console.error("❌ Error updating shelter item:", err.message);
    res.status(400).json({
      error: "Failed to update shelter item",
      details: err.message,
    });
  }
};

// helper: find item index by name (case-insensitive)
const findItemIndex = (shelter, itemName) =>
  shelter.reliefItems.findIndex(
    (it) => it.name.toLowerCase() === itemName.toLowerCase()
  );

// PATCH /api/shelters/:id/items/:itemName - increase specific item in shelter
exports.increaseShelterItem = async (req, res) => {
  const { amount = 1 } = req.body;

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    const index = findItemIndex(shelter, req.params.itemName);
    if (index < 0) {
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    const item = shelter.reliefItems[index];
    item.quantity += amount;
    item.lastUpdated = Date.now();

    await shelter.save();
    console.log(
      "✅ Item increased:",
      shelter._id,
      item.name,
      "=>",
      item.quantity
    );
    res.json(item);
  } catch (err) {
    console.error("Error increasing shelter item:", err.message);
    res.status(400).json({
      error: "Failed to increase shelter item",
      details: err.message,
    });
  }
};

// PATCH /api/shelters/:id/items/:itemName - decrease specific item in shelter
exports.decreaseShelterItem = async (req, res) => {
  const { amount = 1 } = req.body;

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    const index = findItemIndex(shelter, req.params.itemName);
    if (index < 0) {
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    const item = shelter.reliefItems[index];
    item.quantity = Math.max(0, item.quantity - amount);
    item.lastUpdated = Date.now();

    await shelter.save();
    console.log(
      "✅ Item decreased:",
      shelter._id,
      item.name,
      "=>",
      item.quantity
    );
    res.json(item);
  } catch (err) {
    console.error("Error decreasing shelter item:", err.message);
    res.status(400).json({
      error: "Failed to decrease shelter item",
      details: err.message,
    });
  }
};

// DELETE one item from a shelter
// DELETE /api/shelters/:id/items/:itemName
exports.deleteShelterItem = async (req, res) => {
  const { itemName } = req.params;

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    const beforeCount = shelter.reliefItems.length;

    shelter.reliefItems = shelter.reliefItems.filter(
      (it) => it.name.toLowerCase() !== itemName.toLowerCase()
    );

    if (shelter.reliefItems.length === beforeCount) {
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    await shelter.save();
    console.log("✅ Item deleted:", shelter._id, itemName);
    res.json({ message: "Item removed from shelter" });
  } catch (err) {
    console.error("Error deleting shelter item:", err.message);
    res.status(400).json({
      error: "Failed to delete shelter item",
      details: err.message,
    });
  }
};
