// controller/checklistController.js
const Checklist = require("../models/Checklist");
const UserChecklistProgress = require("../models/UserChecklistProgress");

// ADMIN - GET ALL CHECKLISTS
// GET /api/checklists
exports.getAllChecklists = async (req, res) => {
  try {
    const checklists = await Checklist.find({ isActive: true }).lean();
    res.json({ checklists, total: checklists.length });
  } catch (err) {
    console.error("Error fetching checklists:", err.message);
    res.status(500).json({ error: "Failed to fetch checklists" });
  }
};

// ADMIN - GET SINGLE CHECKLIST
// GET /api/checklists/:checklistId
exports.getChecklistById = async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.checklistId).lean();
    if (!checklist) return res.status(404).json({ error: "Checklist not found" });

    res.json(checklist);
  } catch (err) {
    console.error("Error fetching checklist:", err.message);
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
};

// ADMIN - CREATE CHECKLIST
// POST /api/checklists
exports.createChecklist = async (req, res) => {
  try {
    const { title, disasterType, items } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const checklist = await Checklist.create({
      title,
      disasterType: disasterType || "general",
      items: items || [],
      createdBy: req.user.userId,
    });

    console.log(`✅ Checklist created: ${checklist._id} by Admin: ${req.user.userId}`);
    res.status(201).json(checklist);
  } catch (err) {
    console.error("Error creating checklist:", err.message);
    res.status(400).json({ error: "Failed to create checklist", details: err.message });
  }
};


// ADMIN - ADD ITEM TO CHECKLIST
// POST /api/checklists/:checklistId/items
exports.adminAddItem = async (req, res) => {
  try {
    const { itemName, category, quantity, note } = req.body;

    if (!itemName) return res.status(400).json({ error: "Item name is required" });

    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) return res.status(404).json({ error: "Checklist not found" });

    checklist.items.push({
      itemName,
      category: category || "other",
      quantity: quantity || 1,
      note: note || "",
    });

    await checklist.save();

    console.log(`✅ Admin added item: ${itemName} to checklist: ${checklist._id}`);
    res.status(201).json(checklist);
  } catch (err) {
    console.error("Error adding item:", err.message);
    res.status(400).json({ error: "Failed to add item", details: err.message });
  }
};

// ADMIN - UPDATE ITEM
// PUT /api/checklists/:checklistId/items/:itemId
exports.adminUpdateItem = async (req, res) => {
  try {
    const { itemName, category, quantity, note } = req.body;

    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) return res.status(404).json({ error: "Checklist not found" });

    const item = checklist.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (itemName !== undefined) item.itemName = itemName;
    if (category !== undefined) item.category = category;
    if (quantity !== undefined) item.quantity = quantity;
    if (note !== undefined) item.note = note;

    await checklist.save();

    console.log(`✅ Admin updated item: ${item.itemName}`);
    res.json(checklist);
  } catch (err) {
    console.error("Error updating item:", err.message);
    res.status(400).json({ error: "Failed to update item", details: err.message });
  }
};


// ADMIN - DELETE ITEM
// DELETE /api/checklists/:checklistId/items/:itemId
exports.adminDeleteItem = async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) return res.status(404).json({ error: "Checklist not found" });

    const item = checklist.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    checklist.items.pull(req.params.itemId);
    await checklist.save();

    console.log(`✅ Admin deleted item: ${req.params.itemId}`);
    res.json({ message: "Item deleted", checklist });
  } catch (err) {
    console.error("Error deleting item:", err.message);
    res.status(400).json({ error: "Failed to delete item", details: err.message });
  }
};

// ADMIN - DELETE CHECKLIST (soft delete)
// DELETE /api/checklists/:checklistId
exports.deleteChecklist = async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) return res.status(404).json({ error: "Checklist not found" });

    checklist.isActive = false;
    await checklist.save();

    console.log(`✅ Checklist deactivated: ${checklist._id}`);
    res.json({ message: "Checklist deleted successfully" });
  } catch (err) {
    console.error("Error deleting checklist:", err.message);
    res.status(500).json({ error: "Failed to delete checklist" });
  }
};