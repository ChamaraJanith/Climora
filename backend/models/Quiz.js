const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Sub-schema for individual quiz questions
const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
            minlength: [10, 'Question must be at least 10 characters long'],
        },
        options: {
            type: [String],
            required: [true, 'Question options are required'],
            validate: {
                validator: (arr) => arr.length === 4,
                message: 'Each question must have exactly 4 options',
            },
        },
        correctAnswer: {
            type: Number,
            required: [true, 'Correct answer index is required'],
            min: [0, 'Correct answer must be between 0 and 3'],
            max: [3, 'Correct answer must be between 0 and 3'],
        },
    },
    { 
        _id: false, // Don't create separate IDs for questions
    }
);

const quizSchema = new mongoose.Schema(
    {
        // Custom ID format: QUZ-timestamp-randomstring
        _id: {
            type: String,
            default: () => {
                const date = new Date().toISOString().slice(2,10).replace(/-/g,"");
                return `QUZ-${date}-${Math.floor(Math.random()*1000)}`;
            },
        },
        title: {
            type: String,
            required: [true, 'Quiz title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters long'],
        },
        // Reference to parent article (one-to-one relationship)
        articleId: {
            type: String,
            ref: 'Article',
            required: [true, 'Article ID is required'],
            unique: true, // Ensures one quiz per article
        },
        questions: {
            type: [questionSchema],
            validate: {
                validator: (arr) => arr.length >= 1 && arr.length <= 20,
                message: 'Quiz must have between 1 and 20 questions',
            },
        },
        // Optional: passing score percentage
        passingScore: {
            type: Number,
            default: 60,
            min: [0, 'Passing score cannot be negative'],
            max: [100, 'Passing score cannot exceed 100'],
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        _id: false, // Disable auto ObjectId generation
    }
);

// Index for faster queries
//quizSchema.index({ articleId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;