const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const articleSchema = new mongoose.Schema(
    {
        // Custom ID format: ART-timestamp-randomstring
        _id: {
            type: String,
            default: () => {
                const date = new Date()
                    .toISOString()
                    .slice(2, 10)
                    .replace(/-/g, "");

                const random = Math.floor(1000 + Math.random() * 9000);

                return `ART-${date}-${random}`;
            }
        },
        title: {
            type: String,
            required: [true, 'Article title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters long'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        content: {
            type: String,
            required: [true, 'Article content is required'],
            minlength: [50, 'Content must be at least 50 characters long'],
        },
        category: {
            type: String,
            enum: {
                values: ['flood', 'drought', 'cyclone', 'landslide', 'heatwave', 'general'],
                message: '{VALUE} is not a valid category',
            },
            default: 'general',
        },
        author: {
            type: String,
            required: [true, 'Author name is required'],
            trim: true,
        },
        publishedDate: {
            type: Date,
            default: Date.now,
        },
        imageUrl: {
            type: String,
            validate: {
                validator: function (v) {
                    // Basic URL validation (optional field)
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message: 'Please provide a valid image URL',
            },
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        // Reference to the linked quiz (one-to-one relationship)
        quizId: {
            type: String,
            ref: 'Quiz',
            default: null,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        _id: false, // Disable auto ObjectId generation (using custom _id)
    }
);

// Index for faster queries
articleSchema.index({ category: 1, publishedDate: -1 });
articleSchema.index({ title: 'text', content: 'text' }); // Text search index

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;