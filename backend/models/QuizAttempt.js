const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default: () => {
                const date = new Date().toISOString().slice(2,10).replace(/-/g,"");
                return `ATT-${date}-${Math.floor(Math.random()*9000+1000)}`;
            }
        },
        userId: {
            type: String,
            ref: 'User',
            required: true,
        },
        quizId: {
            type: String,
            ref: 'Quiz',
            required: true,
        },
        articleId: {
            type: String,
            ref: 'Article',
            required: true,
        },
        answers: {
            type: [Number],
            required: true,
        },
        score: Number,
        percentage: Number,
        passed: Boolean,
        results: [
            {
                questionNumber: Number,
                userAnswer: Number,
                correctAnswer: Number,
                isCorrect: Boolean,
            }
        ],
    },
    {
        timestamps: true,
        _id: false,
    }
);

quizAttemptSchema.index({ userId: 1, quizId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);