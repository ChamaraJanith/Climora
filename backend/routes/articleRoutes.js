const express = require('express');

const{
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    getYouTubeVideos,
} = require('../controller/articleController');

const articleRouter = express.Router();

articleRouter.get('/', getAllArticles);
articleRouter.get('/:id', getArticleById);
articleRouter.post('/', createArticle);
articleRouter.put('/:id', updateArticle);
articleRouter.delete('/:id', deleteArticle);
articleRouter.get('/youtube/videos', getYouTubeVideos);

module.exports = articleRouter;