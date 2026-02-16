const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        }, 
        category: {
            type: String,
            enum: ["flood", "drought", "cyclone", "landslide", "heatwave", "general"],
            default: "general",
        },
        author: {
            type: String,
            required: true,
            trim: true,
        },
        publishedDate: {
            type: Date,
            default: Date.now,
        },
        imageUrl: {
            type: String,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;