const express = require('express');
const {
    getAllQuizzes,
    getQuizByArticleId,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
} = require('../controller/quizController');

const quizRouter = express.Router();

// Get all quizzes
quizRouter.get('/', getAllQuizzes);

// Get quiz by article ID
quizRouter.get('/article/:articleId', getQuizByArticleId);


// Standard CRUD operations
quizRouter.get('/:id', getQuizById);
quizRouter.post('/', createQuiz);
quizRouter.put('/:id', updateQuiz);
quizRouter.delete('/:id', deleteQuiz);

module.exports = quizRouter;