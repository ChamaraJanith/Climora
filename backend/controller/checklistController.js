const Checklist = require("../models/Checklist");

// Get user's checklist
exports.getUserChecklist = async (req, res) => {
  try {
    let checklist = await Checklist.findOne({ userId: req.params.userId }).lean();
    
    // If no checklist exists, create a default one
    if (!checklist) {
      checklist = await Checklist.create({
        userId: req.params.userId,
        title: "My Emergency Kit",
        items: [],
      });
    }
    
    res.json(checklist);
  } catch (err) {
    console.error("Error fetching checklist:", err.message);
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
};

// Add item to checklist
exports.addChecklistItem = async (req, res) => {
  try {
    const { itemName, category, quantity } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: "Item name is required" });
    }

    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    checklist.items.push({
      itemName,
      category: category || "other",
      quantity: quantity || 1,
      isChecked: false,
    });

    await checklist.save();
    res.status(201).json(checklist);
  } catch (err) {
    console.error("Error adding checklist item:", err.message);
    res.status(400).json({ error: "Failed to add item", details: err.message });
  }
};

// Update checklist item
exports.updateChecklistItem = async (req, res) => {
  try {
    const { itemName, category, quantity, isChecked } = req.body;

    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    const item = checklist.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (itemName !== undefined) item.itemName = itemName;
    if (category !== undefined) item.category = category;
    if (quantity !== undefined) item.quantity = quantity;
    if (isChecked !== undefined) item.isChecked = isChecked;

    await checklist.save();
    res.json(checklist);
  } catch (err) {
    console.error("Error updating checklist item:", err.message);
    res.status(400).json({ error: "Failed to update item", details: err.message });
  }
};

// Delete checklist item
exports.deleteChecklistItem = async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    checklist.items.pull(req.params.itemId);
    await checklist.save();

    res.json({ message: "Item deleted successfully", checklist });
  } catch (err) {
    console.error("Error deleting checklist item:", err.message);
    res.status(400).json({ error: "Failed to delete item", details: err.message });
  }
};

//Toggle item checked status
exports.toggleChecklistItem = async (req, res) => {
  try {
    const checklist = await Checklist.findById(req.params.checklistId);
    if (!checklist) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    const item = checklist.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    item.isChecked = !item.isChecked;
    await checklist.save();

    res.json({ message: "Item toggled", item });
  } catch (err) {
    console.error("Error toggling checklist item:", err.message);
    res.status(400).json({ error: "Failed to toggle item", details: err.message });
  }
};