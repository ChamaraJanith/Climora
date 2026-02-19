// controller/reliefItemController.js
const Shelter = require("../models/Shelter");

// helper: safe, case-insensitive match
const findItemIndex = (shelter, itemName) =>
  (shelter.reliefItems || []).findIndex(
    (it) =>
      String(it.name || "").toLowerCase().trim() ===
      String(itemName || "").toLowerCase().trim()
  );

// GET /api/shelters/:id/items
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
    res.status(500).json({
      error: "❌ Failed to fetch shelter items",
      details: err.message,
    });
  }
};

// PUT /api/shelters/:id/items/:itemName
// body: { name, category, quantity, unit, expiryDate, priorityLevel }
// PUT /api/shelters/:id/items/:itemName
exports.updateShelterItem = async (req, res) => {
  const { name, category, quantity, unit, expiryDate, priorityLevel } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "❌ Shelter not found" });
    }

    if (!Array.isArray(shelter.reliefItems)) {
      shelter.reliefItems = [];
    }

    const itemIndex = findItemIndex(shelter, name);

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

    // 🔹 Only send reliefItems back
    return res.json({
      shelterId: shelter.shelterId,
      reliefItems: shelter.reliefItems,
    });
  } catch (err) {
    res.status(400).json({
      error: "Failed to update shelter item",
      details: err.message,
    });
  }
};


// PUT /api/shelters/:id/items/:itemName/increase
exports.increaseShelterItem = async (req, res) => {
  let { amount = 1 } = req.body;

  amount = Number(amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    if (!Array.isArray(shelter.reliefItems)) {
      shelter.reliefItems = [];
    }

    const index = findItemIndex(shelter, req.params.itemName);
    if (index < 0) {
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    const item = shelter.reliefItems[index];
    item.quantity += amount;
    item.lastUpdated = Date.now();

    await shelter.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({
      error: "Failed to increase shelter item",
      details: err.message,
    });
  }
};

// PUT /api/shelters/:id/items/:itemName/decrease
exports.decreaseShelterItem = async (req, res) => {
  let { amount = 1 } = req.body;

  amount = Number(amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    if (!Array.isArray(shelter.reliefItems)) {
      shelter.reliefItems = [];
    }

    const index = findItemIndex(shelter, req.params.itemName);
    if (index < 0) {
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    const item = shelter.reliefItems[index];
    item.quantity = Math.max(0, item.quantity - amount);
    item.lastUpdated = Date.now();

    await shelter.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({
      error: "Failed to decrease shelter item",
      details: err.message,
    });
  }
};

// DELETE /api/shelters/:id/items/:itemName
exports.deleteShelterItem = async (req, res) => {
  const { itemName } = req.params;

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    if (!Array.isArray(shelter.reliefItems)) {
      shelter.reliefItems = [];
    }

    const beforeCount = shelter.reliefItems.length;

    shelter.reliefItems = shelter.reliefItems.filter(
      (it) =>
        String(it.name || "").toLowerCase().trim() !==
        String(itemName || "").toLowerCase().trim()
    );

    if (shelter.reliefItems.length === beforeCount) {
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    await shelter.save();
    res.json({ message: "Item removed from shelter" });
  } catch (err) {
    res.status(400).json({
      error: "Failed to delete shelter item",
      details: err.message,
    });
  }
};
