const mongoose = require('mongoose');

// Cache news in DB to avoid hitting API rate limits
const climateNewsSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default: () => {
                const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                return `NEWS-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
            },
        },
        // Unique article ID from NewsData API
        articleId: {
            type: String,
            unique: true,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            default: '',
        },
        // Source website name
        sourceName: {
            type: String,
            default: '',
        },
        sourceUrl: {
            type: String,
            default: '',
        },
        // Direct link to original article
        link: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            default: null,
        },
        publishedAt: {
            type: Date,
            required: true,
        },
        // Country code - 'lk' for Sri Lanka, others for world news
        country: {
            type: String,
            default: '',
        },
        // Climate category we assigned
        climateCategory: {
            type: String,
            enum: ['flood', 'drought', 'cyclone', 'landslide', 'wildfire', 'tsunami', 'earthquake', 'storm', 'general'],
            default: 'general',
        },
        // Is this Sri Lanka specific news?
        isSriLanka: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Index for fast filtering
climateNewsSchema.index({ publishedAt: -1 });
climateNewsSchema.index({ climateCategory: 1, publishedAt: -1 });
climateNewsSchema.index({ isSriLanka: 1, publishedAt: -1 });

module.exports = mongoose.model('ClimateNews', climateNewsSchema);