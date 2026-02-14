const Shelter = require("../models/Shelter");

// GET /api/shelters - Get all shelters
exports.getAllShelters = async (req, res) => {
  try {
    const shelters = await Shelter.find().lean();
    console.log("✅ Fetched shelters count:", shelters.length);
    res.json(shelters);
  } catch (err) {
    console.error("Error fetching shelters:", err.message);
    res.status(500).json({ error: "Failed to fetch shelters" });
  }
};

// GET /api/shelters/:id - Select One Shelter
exports.getShelterById = async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id).lean();
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }
    console.log("✅ Fetched shelter:", shelter._id);
    res.json(shelter);
  } catch (err) {
    console.error("Error fetching shelter:", err.message);
    res.status(400).json({ error: "Invalid shelter ID" });
  }
};

// POST /api/shelters - Create a new shelter
exports.createShelter = async (req, res) => {
  try {
    const shelter = await Shelter.create(req.body);
    console.log("✅ Shelter created:", shelter._id);
    res.status(201).json(shelter);
  } catch (err) {
    console.error("Error creating shelter:", err.message);
    res
      .status(400)
      .json({ error: "Failed to create shelter", details: err.message });
  }
};

// PUT /api/shelters/:id - Update a shelter
exports.updateShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }
    console.log("✅ Shelter updated:", shelter._id);
    res.json(shelter);
  } catch (err) {
    console.error("Error updating shelter:", err.message);
    res
      .status(400)
      .json({ error: "Failed to update shelter", details: err.message });
  }
};

// DELETE /api/shelters/:id - Delete a shelter
exports.deleteShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findByIdAndDelete(req.params.id).lean();
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }
    console.log("✅ Shelter deleted:", shelter._id);
    res.json({ message: "Shelter deleted successfully" });
  } catch (err) {
    console.error("Error deleting shelter:", err.message);
    res
      .status(400)
      .json({ error: "Failed to delete shelter", details: err.message });
  }
};

// Update or add one item in specific shelter
exports.updateShelterItem = async (req, res) => {
  const {
    name,
    category,
    quantity,
    unit,
    expiryDate,
    priorityLevel,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ error: "Shelter not found" });
    }

    // existing item index
    const itemIndex = shelter.reliefItems.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (itemIndex >= 0) {
      // update existing item
      const item = shelter.reliefItems[itemIndex];

      if (quantity !== undefined) item.quantity = quantity;
      if (category !== undefined) item.category = category;
      if (unit !== undefined) item.unit = unit;
      if (expiryDate !== undefined) item.expiryDate = expiryDate;
      if (priorityLevel !== undefined) item.priorityLevel = priorityLevel;

      item.lastUpdated = Date.now();
    } else {
      // add new item
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
    console.error("Error updating shelter item:", err.message);
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
    const shelter = await Shelter.findById(req.params.id);
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
    const shelter = await Shelter.findById(req.params.id);
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
    const shelter = await Shelter.findById(req.params.id);
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
