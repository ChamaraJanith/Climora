const express = require('express');

const {
    getAllQuizzes,
    getQuizByArticleId,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    submitQuiz,
} = require('../controller/quizController');

const quizRouter = express.Router();

quizRouter.get('/', getAllQuizzes);
quizRouter.get('/article/:articleId', getQuizByArticleId);
quizRouter.post('/', createQuiz);
quizRouter.put('/:id', updateQuiz);
quizRouter.delete('/:id', deleteQuiz);
quizRouter.post('/:id/submit', submitQuiz);

module.exports = quizRouter;