const express = require('express');
const {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    getYouTubeVideos,
    getArticleStats,
} = require('../controller/articleController');

const articleRouter = express.Router();

// YouTube video search endpoint (third-party API)
articleRouter.get('/youtube/videos', getYouTubeVideos);

// Article statistics endpoint (optional)
articleRouter.get('/stats', getArticleStats);

articleRouter.get('/', getAllArticles);
articleRouter.get('/:id', getArticleById); // This returns article + quiz + related videos
articleRouter.post('/', createArticle);
articleRouter.put('/:id', updateArticle);
articleRouter.delete('/:id', deleteArticle);

module.exports = articleRouter;