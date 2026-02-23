const express = require('express');
const {
    getClimateNews,
    getLatestClimateNews,
    getClimateNewsStats,
    manualRefresh,
    cleanupIrrelevantNews,
} = require('../controller/climateNewsController');

const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const climateNewsRouter = express.Router();

// =============================================
// PUBLIC ROUTES - no login required
// =============================================

// GET /api/climate-news
// Query params: category, type, page, limit, refresh
climateNewsRouter.get('/', getClimateNews);

// GET /api/climate-news/latest
// Latest 6 articles for homepage widget
climateNewsRouter.get('/latest', getLatestClimateNews);

// GET /api/climate-news/stats
// Count by category + Sri Lanka vs World split
climateNewsRouter.get('/stats', getClimateNewsStats);

// =============================================
// ADMIN ONLY ROUTES - requires login + ADMIN role
// =============================================

// POST /api/climate-news/refresh
// Manually trigger fresh fetch from NewsData.io API
climateNewsRouter.post(
    '/refresh',
    protect,
    allowRoles('ADMIN', 'CONTENT_MANAGER'),
    manualRefresh
);

// DELETE /api/climate-news/cleanup
// One-time cleanup: remove irrelevant articles + fix wrong isSriLanka flags
// Run this once after deploying the updated controller
climateNewsRouter.delete(
    '/cleanup',
    protect,
    allowRoles('ADMIN', 'CONTENT_MANAGER'),
    cleanupIrrelevantNews
);

module.exports = climateNewsRouter;