const Quiz = require('../models/Quiz');
const Article = require('../models/Article');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

// GET /api/quizzes - Get all quizzes
exports.getAllQuizzes = async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch quizzes with article details
        const quizzes = await Quiz.find()
            .populate('articleId', 'title category author') // Populate article details
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        // Get total count
        const total = await Quiz.countDocuments();

        console.log(`✅ Quizzes fetched: ${quizzes.length} / Total: ${total}`);

        res.json({
            quizzes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Error fetching quizzes:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch quizzes',
            details: err.message,
        });
    }
};


// GET /api/quizzes/article/:articleId - Get quiz by article ID
exports.getQuizByArticleId = async (req, res) => {
    try {
        // First check if article exists
        const article = await Article.findById(req.params.articleId).lean();
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Check if article has a quiz
        if (!article.quizId) {
            return res.status(404).json({ 
                error: 'No quiz found for this article',
                articleId: req.params.articleId,
                articleTitle: article.title,
            });
        }

        // Fetch the quiz
        const quiz = await Quiz.findById(article.quizId).lean();
        
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        console.log(`✅ Fetched quiz for article: ${article.title}`);
        res.json(quiz);
    } catch (err) {
        console.error('Error fetching quiz:', err.message);
        res.status(400).json({ 
            error: 'Invalid article ID',
            details: err.message,
        });
    }
};

// GET /api/quizzes/:id - Get single quiz by quiz ID
exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('articleId', 'title category')
            .lean();
        
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.json(quiz);
    } catch (err) {
        console.error('Error fetching quiz:', err.message);
        res.status(400).json({ 
            error: 'Invalid quiz ID',
            details: err.message,
        });
    }
};

// POST /api/quizzes - Create new quiz and link to article
exports.createQuiz = async (req, res) => {
    try {
        const { title, articleId, questions, passingScore } = req.body;

        // Validation
        if (!title || !articleId || !questions || questions.length === 0) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['title', 'articleId', 'questions (at least 1)'],
            });
        }

        // Check if article exists
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Check if article already has a quiz (enforce one-to-one relationship)
        if (article.quizId) {
            return res.status(400).json({
                error: 'This article already has a quiz',
                existingQuizId: article.quizId,
                message: 'Please delete the existing quiz first or update it instead',
            });
        }

        // Validate each question
        for (let i = 1; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question || !q.options || q.options.length !== 4 || q.correctAnswer === undefined) {
                return res.status(400).json({
                    error: `Invalid question format at index ${i}`,
                    message: 'Each question must have: question text, 4 options, and correctAnswer (1-4)',
                });
            }
        }

        // Create the quiz
        const quiz = await Quiz.create({
            title,
            articleId,
            questions,
            passingScore: passingScore || 60,
        });

        // Link quiz to article
        await Article.findByIdAndUpdate(articleId, { quizId: quiz._id });

        console.log(`✅ Quiz created and linked: ${quiz._id} → Article: ${article.title}`);

        res.status(201).json({
            message: 'Quiz created and linked to article successfully',
            quiz,
            linkedArticle: {
                id: article._id,
                title: article.title,
            },
        });
    } catch (err) {
        console.error('Error creating quiz:', err.message);
        res.status(400).json({ 
            error: 'Failed to create quiz', 
            details: err.message,
        });
    }
};

// PUT /api/quizzes/:id - Update quiz
exports.updateQuiz = async (req, res) => {
    try {
        // Don't allow changing articleId (would break one-to-one relationship)
        const { articleId, ...updateData } = req.body;

        if (articleId) {
            return res.status(400).json({ 
                error: 'Cannot change article link',
                message: 'To link quiz to different article, delete and create new quiz',
            });
        }

        // Validate questions if provided
        if (updateData.questions) {
            for (let i = 0; i < updateData.questions.length; i++) {
                const q = updateData.questions[i];
                if (!q.question || !q.options || q.options.length !== 4 || q.correctAnswer === undefined) {
                    return res.status(400).json({
                        error: `Invalid question format at index ${i}`,
                    });
                }
            }
        }

        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            updateData,
            { 
                new: true,
                runValidators: true,
            }
        ).lean();

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        console.log(`✅ Quiz updated: ${quiz._id}`);
        res.json(quiz);
    } catch (err) {
        console.error('Error updating quiz:', err.message);
        res.status(400).json({ 
            error: 'Failed to update quiz', 
            details: err.message,
        });
    }
};

// DELETE /api/quizzes/:id - Delete quiz and unlink from article
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id).lean();
        
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Unlink quiz from article
        await Article.findByIdAndUpdate(quiz.articleId, { quizId: null });

        console.log(`✅ Quiz deleted and unlinked: ${req.params.id}`);
        res.json({ 
            message: 'Quiz deleted and unlinked from article successfully',
            deletedQuizId: req.params.id,
            unlinkedFromArticle: quiz.articleId,
        });
    } catch (err) {
        console.error('Error deleting quiz:', err.message);
        res.status(400).json({ 
            error: 'Failed to delete quiz', 
            details: err.message,
        });
    }
};

//check if user has attempted quiz before and return quiz + previous attempt details
// GET /api/articles/:articleId/:userId/quiz
exports.getQuizForUser = async (req, res) => {
    try {
        const { articleId, userId } = req.params;

        const article = await Article.findById(articleId).lean();
        if (!article) return res.status(404).json({ error: '❌ Article not found' });
        if (!article.quizId) return res.status(404).json({ error: '❌No quiz for this article' });

        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ error: '❌User not found' });

        const quiz = await Quiz.findById(article.quizId).lean();
        if (!quiz) return res.status(404).json({ error: '❌Quiz not found' });

        const previousAttempts = await QuizAttempt.find({ userId, quizId: quiz._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            quiz,
            user: {
                id: user._id,
                userId: user.userId,
                username: user.username,
            },
            attemptCount: previousAttempts.length,
            lastAttempt: previousAttempts[0] || null,
            hasAttempted: previousAttempts.length > 0,
        });

    } catch (err) {
        console.error('❌ Error fetching quiz for user:', err.message);
        res.status(400).json({ error: '❌ Failed to fetch quiz', details: err.message });
    }
};


// POST /api/articles/:articleId/:userId/quiz/submit
exports.submitQuizForUser = async (req, res) => {
    try {
        const { articleId, userId } = req.params;
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: '❌ Answers array is required' });
        }

        const article = await Article.findById(articleId).lean();
        if (!article || !article.quizId) {
            return res.status(404).json({ error: '❌ Article or quiz not found' });
        }

        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ error: '❌ User not found' });

        const quiz = await Quiz.findById(article.quizId).lean();
        if (!quiz) return res.status(404).json({ error: '❌ Quiz not found' });

        if (answers.length !== quiz.questions.length) {
            return res.status(400).json({
                error: '❌ Answer count mismatch',
                expected: quiz.questions.length,
                received: answers.length,
            });
        }

        // Score calculate
        let score = 0;
        const results = quiz.questions.map((q, index) => {
            const isCorrect = q.correctAnswer === answers[index];
            if (isCorrect) score++;
            return {
                questionNumber: index + 1,
                userAnswer: answers[index],
                correctAnswer: q.correctAnswer,
                isCorrect,
            };
        });

        const percentage = parseFloat(((score / quiz.questions.length) * 100).toFixed(2));
        const passed = percentage >= quiz.passingScore;

        // Attempt store
        const attempt = await QuizAttempt.create({
            userId,
            quizId: quiz._id,
            articleId,
            answers,
            score,
            percentage,
            passed,
            results,
        });

        console.log(`✅ Quiz attempt saved: ${attempt._id} | User: ${user.userId} | Score: ${score}/${quiz.questions.length}`);

        res.json({
            attemptId: attempt._id,
            quizTitle: quiz.title,
            score,
            total: quiz.questions.length,
            percentage,
            passingScore: quiz.passingScore,
            passed,
            results: quiz.questions.map((q, index) => ({
                questionNumber: index + 1,
                question: q.question,
                options: q.options,
                userAnswer: answers[index],
                correctAnswer: q.correctAnswer,
                isCorrect: results[index].isCorrect,
                explanation: results[index].isCorrect
                    ? '✅ Correct!'
                    : `❌ Incorrect. Correct answer: ${q.options[q.correctAnswer]}`,
            })),
            message: passed
                ? `🎉 Congratulations! You passed with ${percentage}%`
                : `📚 You scored ${percentage}%. Keep learning! (Pass mark: ${quiz.passingScore}%)`,
        });

    } catch (err) {
        console.error('❌ Error submitting quiz:', err.message);
        res.status(400).json({ error: '❌ Failed to submit quiz', details: err.message });
    }
};