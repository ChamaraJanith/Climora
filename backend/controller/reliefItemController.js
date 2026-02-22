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
      console.log(
        `[ShelterItems][GET] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "Shelter not found" });
    }

    console.log(
      `✅ [ShelterItems][GET] Success | shelterId=${shelter.shelterId} | items=${(shelter.reliefItems || []).length}`
    );

    return res.json({
      shelterId: shelter.shelterId,
      shelterName: shelter.name,
      district: shelter.district,
      reliefItems: shelter.reliefItems || [],
    });
  } catch (err) {
    console.error(
      `[ShelterItems][GET] Failed | shelterId=${req.params.id} | error=${err.message}`
    );
    res.status(500).json({
      error: "❌ Failed to fetch shelter items",
      details: err.message,
    });
  }
};

// PUT /api/shelters/:id/items/:itemName
exports.updateShelterItem = async (req, res) => {
  const {
    name,
    category,
    quantity,
    unit,
    expiryDate,
    priorityLevel,
    providedBy,
  } = req.body;

  if (!name) {
    console.log(
      `[ShelterItems][PUT] Bad Request - name missing | shelterId=${req.params.id}`
    );
    return res.status(400).json({ error: "Item name is required" });
  }

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      console.log(
        `[ShelterItems][PUT] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "❌ Shelter not found" });
    }

    if (!Array.isArray(shelter.reliefItems)) {
      shelter.reliefItems = [];
    }

    const itemIndex = findItemIndex(shelter, name);

    let action = "created";

    if (itemIndex >= 0) {
      // update existing
      const item = shelter.reliefItems[itemIndex];

      if (quantity !== undefined) item.quantity = quantity;
      if (category !== undefined) item.category = category;
      if (unit !== undefined) item.unit = unit;
      if (expiryDate !== undefined) item.expiryDate = expiryDate;
      if (priorityLevel !== undefined) item.priorityLevel = priorityLevel;
      if (providedBy !== undefined) item.providedBy = providedBy;

      item.lastUpdated = Date.now();
      action = "updated";
    } else {
      // create new
      shelter.reliefItems.push({
        name,
        category,
        quantity,
        unit,
        expiryDate,
        priorityLevel,
        lastUpdated: Date.now(),
        providedBy: providedBy || "unknown",
      });
    }

    await shelter.save();

    console.log(
      `✅ [ShelterItems][PUT] ${action.toUpperCase()} | shelterId=${
        shelter.shelterId
      } | item=${name}`
    );

    return res.json({
      shelterId: shelter.shelterId,
      reliefItems: shelter.reliefItems,
    });
  } catch (err) {
    console.error(
      `[ShelterItems][PUT] Failed | shelterId=${req.params.id} | item=${name} | error=${err.message}`
    );
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
    console.log(
      `[ShelterItems][PUT][INCREASE] Invalid amount | shelterId=${req.params.id} | item=${req.params.itemName} | amount=${req.body.amount}`
    );
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      console.log(
        `[ShelterItems][PUT][INCREASE] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "Shelter not found" });
    }

    if (!Array.isArray(shelter.reliefItems)) {
      shelter.reliefItems = [];
    }

    const index = findItemIndex(shelter, req.params.itemName);
    if (index < 0) {
      console.log(
        `[ShelterItems][PUT][INCREASE] Item not found | shelterId=${req.params.id} | item=${req.params.itemName}`
      );
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    const item = shelter.reliefItems[index];
    item.quantity += amount;
    item.lastUpdated = Date.now();

    await shelter.save();

    console.log(
      `✅ [ShelterItems][PUT][INCREASE] Success | shelterId=${
        shelter.shelterId
      } | item=${item.name} | +${amount} | newQty=${item.quantity}`
    );

    res.json(item);
  } catch (err) {
    console.error(
      `[ShelterItems][PUT][INCREASE] Failed | shelterId=${req.params.id} | item=${req.params.itemName} | error=${err.message}`
    );
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
    console.log(
      `[ShelterItems][PUT][DECREASE] Invalid amount | shelterId=${req.params.id} | item=${req.params.itemName} | amount=${req.body.amount}`
    );
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const shelter = await Shelter.findOne({ shelterId: req.params.id });
    if (!shelter) {
      console.log(
        `[ShelterItems][PUT][DECREASE] Shelter not found | shelterId=${req.params.id}`
      );
      return res.status(404).json({ error: "Shelter not found" });
    }

    if (!Array.isArray(shelter.reliefItems)) {
      shelter.reliefItems = [];
    }

    const index = findItemIndex(shelter, req.params.itemName);
    if (index < 0) {
      console.log(
        `[ShelterItems][PUT][DECREASE] Item not found | shelterId=${req.params.id} | item=${req.params.itemName}`
      );
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    const item = shelter.reliefItems[index];
    const oldQty = item.quantity;
    item.quantity = Math.max(0, item.quantity - amount);
    item.lastUpdated = Date.now();

    await shelter.save();

    console.log(
      `✅ [ShelterItems][PUT][DECREASE] Success | shelterId=${
        shelter.shelterId
      } | item=${item.name} | -${amount} | oldQty=${oldQty} | newQty=${
        item.quantity
      }`
    );

    res.json(item);
  } catch (err) {
    console.error(
      `[ShelterItems][PUT][DECREASE] Failed | shelterId=${req.params.id} | item=${req.params.itemName} | error=${err.message}`
    );
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
      console.log(
        `[ShelterItems][DELETE] Shelter not found | shelterId=${req.params.id}`
      );
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
      console.log(
        `[ShelterItems][DELETE] Item not found | shelterId=${req.params.id} | item=${itemName}`
      );
      return res.status(404).json({ error: "Item not found in shelter" });
    }

    await shelter.save();

    console.log(
      `✅ [ShelterItems][DELETE] Success | shelterId=${shelter.shelterId} | item=${itemName}`
    );

    res.json({ message: "Item removed from shelter" });
  } catch (err) {
    console.error(
      `[ShelterItems][DELETE] Failed | shelterId=${req.params.id} | item=${itemName} | error=${err.message}`
    );
    res.status(400).json({
      error: "Failed to delete shelter item",
      details: err.message,
    });
  }
};
