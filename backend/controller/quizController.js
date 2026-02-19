const Quiz = require('../models/Quiz');
const Article = require('../models/Article');

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
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question || !q.options || q.options.length !== 4 || q.correctAnswer === undefined) {
                return res.status(400).json({
                    error: `Invalid question format at index ${i}`,
                    message: 'Each question must have: question text, 4 options, and correctAnswer (0-3)',
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

// POST /api/quizzes/:id/submit - Submit quiz answers and get results
exports.submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body;

        // Validation
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ 
                error: 'Answers array is required',
                format: 'answers: [0, 2, 1, 3, ...]',
            });
        }

        // Fetch the quiz
        const quiz = await Quiz.findById(req.params.id).lean();
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Validate answer count
        if (answers.length !== quiz.questions.length) {
            return res.status(400).json({
                error: 'Answer count mismatch',
                expected: quiz.questions.length,
                received: answers.length,
                message: `Please provide exactly ${quiz.questions.length} answers`,
            });
        }

        // Calculate score
        let score = 0;
        const results = quiz.questions.map((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = q.correctAnswer === userAnswer;
            
            if (isCorrect) score++;

            return {
                questionNumber: index + 1,
                question: q.question,
                options: q.options,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: isCorrect 
                    ? '✅ Correct!' 
                    : `❌ Incorrect. The correct answer is: ${q.options[q.correctAnswer]}`,
            };
        });

        // Calculate percentage
        const percentage = ((score / quiz.questions.length) * 100).toFixed(2);
        const passed = parseFloat(percentage) >= quiz.passingScore;

        console.log(`📝 Quiz submitted: ${quiz._id} | Score: ${score}/${quiz.questions.length}`);

        res.json({
            quizId: quiz._id,
            quizTitle: quiz.title,
            score,
            total: quiz.questions.length,
            percentage: parseFloat(percentage),
            passingScore: quiz.passingScore,
            passed,
            results,
            message: passed 
                ? `🎉 Congratulations! You passed with ${percentage}%` 
                : `📚 You scored ${percentage}%. Keep learning! (Pass mark: ${quiz.passingScore}%)`,
        });
    } catch (err) {
        console.error('Error submitting quiz:', err.message);
        res.status(400).json({ 
            error: 'Failed to submit quiz', 
            details: err.message,
        });
    }
};