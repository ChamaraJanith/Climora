const express = require('express');
const {
    getAllQuizzes,
    getQuizByArticleId,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
} = require('../controller/quizController');

const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

const quizRouter = express.Router();

// PUBLIC ROUTES
quizRouter.get('/article/:articleId', getQuizByArticleId);
quizRouter.get('/:id', getQuizById);

// CONTENT_MANAGER + ADMIN ROUTES
quizRouter.get('/',
    protect,
    allowRoles('ADMIN', 'CONTENT_MANAGER'),
    getAllQuizzes
);
quizRouter.post(
  '/',
  protect,
  allowRoles('ADMIN', 'CONTENT_MANAGER'),
  createQuiz
);

quizRouter.put(
  '/:id',
  protect,
  allowRoles('ADMIN', 'CONTENT_MANAGER'),
  updateQuiz
);

quizRouter.delete(
  '/:id',
  protect,
  allowRoles('ADMIN', 'CONTENT_MANAGER'),
  deleteQuiz
);

module.exports = quizRouter;