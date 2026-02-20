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

const {
    getQuizForUser,
    submitQuizForUser,
} = require('../controller/quizController');

const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const articleRouter = express.Router();

// PUBLIC ROUTES
articleRouter.get('/youtube/videos', getYouTubeVideos);
articleRouter.get('/stats', getArticleStats);
articleRouter.get('/', getAllArticles);
articleRouter.get('/:id', getArticleById);

// CONTENT_MANAGER + ADMIN ROUTES
articleRouter.post(
  '/',
  protect,
  allowRoles('ADMIN', 'CONTENT_MANAGER'),
  createArticle
);

articleRouter.put(
  '/:id',
  protect,
  allowRoles('ADMIN', 'CONTENT_MANAGER'),
  updateArticle
);

articleRouter.delete(
  '/:id',
  protect,
  allowRoles('ADMIN', 'CONTENT_MANAGER'),
  deleteArticle
);

// USER ROUTES (logged in users only)
articleRouter.get('/:articleId/:userId/quiz', protect, getQuizForUser);
articleRouter.post('/:articleId/:userId/quiz/submit', protect, submitQuizForUser);

module.exports = articleRouter;