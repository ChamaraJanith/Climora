// controller/userChecklistController.js
const Checklist = require("../models/Checklist");
const UserChecklistProgress = require("../models/UserChecklistProgress");

// USER - GET CHECKLIST WITH MY MARKS
// GET /api/user-checklists/:checklistId
// Returns admin checklist + this user's checked status per item
exports.getMyChecklist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { checklistId } = req.params;

        // Get the admin checklist template
        const checklist = await Checklist.findById(checklistId).lean();
        if (!checklist) return res.status(404).json({ error: "Checklist not found" });

        // Get this user's progress for this checklist
        let progress = await UserChecklistProgress.findOne({ userId, checklistId }).lean();

        // If user has no progress yet, create empty progress record
        if (!progress) {
            progress = await UserChecklistProgress.create({
                userId,
                checklistId,
                // Initialize all items as unchecked
                markedItems: checklist.items.map((item) => ({
                    itemId: item._id,
                    isChecked: false,
                })),
            });
            console.log(`✅ Progress record created for user: ${userId} | Checklist: ${checklistId}`);
        }

        // Build a map of itemId → isChecked for quick lookup
        const checkedMap = {};
        progress.markedItems.forEach((m) => {
            checkedMap[m.itemId] = m.isChecked; 
        });

        // Merge admin items with user's checked status
        const itemsWithStatus = checklist.items.map((item) => ({
            _id: item._id,
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            note: item.note,
            isChecked: checkedMap[item._id.toString()] || false,
        }));

        // Calculate progress percentage
        const total = itemsWithStatus.length;
        const checked = itemsWithStatus.filter((i) => i.isChecked).length;
        const percentage = total === 0 ? 0 : parseFloat(((checked / total) * 100).toFixed(2));

        res.json({
            checklistId: checklist._id,
            title: checklist.title,
            disasterType: checklist.disasterType,
            items: itemsWithStatus,
            progress: {
                total,
                checked,
                unchecked: total - checked,
                percentage,
                isComplete: checked === total && total > 0,
            },
        });
    } catch (err) {
        console.error("Error fetching user checklist:", err.message);
        res.status(500).json({ error: "Failed to fetch checklist" });
    }
};

// USER - TOGGLE ITEM (check/uncheck)
// PATCH /api/user-checklists/:checklistId/items/:itemId/toggle
exports.toggleItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { checklistId, itemId } = req.params;

        // Verify checklist exists
        const checklist = await Checklist.findById(checklistId).lean();
        if (!checklist) return res.status(404).json({ error: "Checklist not found" });

        // Verify item exists in admin checklist
        const itemExists = checklist.items.some((i) => i._id === itemId);
        if (!itemExists) return res.status(404).json({ error: "Item not found" });

        // Get user's progress
        let progress = await UserChecklistProgress.findOne({ userId, checklistId });

        // If no progress record, create one
        if (!progress) {
            progress = await UserChecklistProgress.create({
                userId,
                checklistId,
                markedItems: checklist.items.map((item) => ({
                    itemId: item._id,
                    isChecked: false,
                })),
            });
        }

        // Find the specific item in user's progress
        const markedItem = progress.markedItems.find((m) => m.itemId === itemId);

        if (!markedItem) {
            return res.status(404).json({ error: "Item not found in progress" });
        }

        // Flip the checked status
        markedItem.isChecked = !markedItem.isChecked;
        await progress.save();

        console.log(`✅ Item toggled: ${itemId} → ${markedItem.isChecked} | User: ${userId}`);

        res.json({
            itemId,
            isChecked: markedItem.isChecked,
            message: markedItem.isChecked ? "Item marked as done" : "Item unmarked",
        });
    } catch (err) {
        console.error("Error toggling item:", err.message);
        res.status(400).json({ error: "Failed to toggle item" });
    }
};

// USER - RESET ALL (uncheck everything)
// PATCH /api/user-checklists/:checklistId/reset
exports.resetProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { checklistId } = req.params;

        const progress = await UserChecklistProgress.findOne({ userId, checklistId });
        if (!progress) return res.status(404).json({ error: "Progress not found" });

        // Set all items to unchecked
        progress.markedItems.forEach((item) => {
            item.isChecked = false;
        });

        await progress.save();

        console.log(`✅ Progress reset for user: ${userId} | Checklist: ${checklistId}`);
        res.json({ message: "All items unchecked successfully" });
    } catch (err) {
        console.error("Error resetting progress:", err.message);
        res.status(500).json({ error: "Failed to reset progress" });
    }
};

// USER - GET MY PROGRESS ONLY
// GET /api/user-checklists/:checklistId/progress
exports.getProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { checklistId } = req.params;

        const checklist = await Checklist.findById(checklistId).lean();
        if (!checklist) return res.status(404).json({ error: "Checklist not found" });

        const progress = await UserChecklistProgress.findOne({ userId, checklistId }).lean();

        const total = checklist.items.length;
        const checked = progress
            ? progress.markedItems.filter((m) => m.isChecked).length
            : 0;
        const percentage = total === 0 ? 0 : parseFloat(((checked / total) * 100).toFixed(2));

        res.json({
            userId,
            checklistId,
            total,
            checked,
            unchecked: total - checked,
            percentage,
            isComplete: checked === total && total > 0,
        });
    } catch (err) {
        console.error("Error fetching progress:", err.message);
        res.status(500).json({ error: "Failed to fetch progress" });
    }
};