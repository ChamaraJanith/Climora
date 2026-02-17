const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ["food", "water", "medicine", "clothing", "tools", "documents", "other"],
        default: "other",

    },
    quantity: {
        type: Number,
        default: 1,
    },
    isChecked: {
        type: Boolean,
        default: false,
    },
},
{
    _id: true,
    timestamps: true,
}
);

const checklistSchema = new mongoose.Schema(
    {
        userId: {
            type: String
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            default: "My Emergency Kit",
        },
        items: [checklistItemSchema],
    },
    {
        timestamps: true,
    }
);

const Checklist = mongoose.model('Checklist', checklistSchema);

module.exports = Checklist;