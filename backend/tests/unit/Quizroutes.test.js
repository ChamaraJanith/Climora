const request = require('supertest');
const express = require('express');

jest.mock('../../models/Quiz');
jest.mock('../../models/Article');
jest.mock('../../models/QuizAttempt');
jest.mock('../../models/User');

const Quiz = require('../../models/Quiz');
const Article = require('../../models/Article');
const QuizAttempt = require('../../models/QuizAttempt');
const User = require('../../models/User');

jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, _res, next) => {
        req.user = { userId: 'USR-TEST-001', role: 'user' };
        next();
    },
    adminOnly: (_req, _res, next) => next(),
}));

const quizRouter = require('../../routes/quizRoutes');

const app = express();
app.use(express.json());
app.use('/api/quizzes', quizRouter);

// ── Shared mock data ─────────────────────────────────────────────────────────
const mockQuestion = {
    question: 'What is the safest action during a flood?',
    options: ['Stay in ground floor', 'Move to higher ground', 'Go outside', 'Call friends'],
    correctAnswer: 1,
};

const mockQuiz = {
    _id: 'QUZ-260219-001',
    title: 'Flood Safety Quiz',
    articleId: 'ART-260219-1234',
    questions: [mockQuestion],
    passingScore: 60,
};

const mockArticle = {
    _id: 'ART-260219-1234',
    title: 'Flood Preparedness Guide',
    category: 'flood',
    author: 'Admin',
    quizId: 'QUZ-260219-001',
    save: jest.fn(),
};

function buildPaginatedMock(data) {
    return {
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(data),
    };
}


// GET /api/quizzes
describe('GET /api/quizzes', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns paginated list of quizzes', async () => {
        Quiz.find.mockReturnValue(buildPaginatedMock([mockQuiz]));
        Quiz.countDocuments.mockResolvedValue(1);

        const res = await request(app).get('/api/quizzes');

        expect(res.statusCode).toBe(200);
        expect(res.body.quizzes).toHaveLength(1);
        expect(res.body.quizzes[0]._id).toBe('QUZ-260219-001');
        expect(res.body.pagination.total).toBe(1);
    });

    test('returns empty list when no quizzes', async () => {
        Quiz.find.mockReturnValue(buildPaginatedMock([]));
        Quiz.countDocuments.mockResolvedValue(0);

        const res = await request(app).get('/api/quizzes');

        expect(res.statusCode).toBe(200);
        expect(res.body.quizzes).toHaveLength(0);
    });

    test('respects pagination query params', async () => {
        Quiz.find.mockReturnValue(buildPaginatedMock([]));
        Quiz.countDocuments.mockResolvedValue(50);

        const res = await request(app).get('/api/quizzes?limit=5&page=3');

        expect(res.statusCode).toBe(200);
        expect(res.body.pagination.page).toBe(3);
        expect(res.body.pagination.limit).toBe(5);
    });

    test('returns 500 on database error', async () => {
        Quiz.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
        });

        const res = await request(app).get('/api/quizzes');

        expect(res.statusCode).toBe(500);
    });
});


// GET /api/quizzes/article/:articleId
describe('GET /api/quizzes/article/:articleId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns quiz linked to article', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });

        const res = await request(app).get('/api/quizzes/article/ART-260219-1234');

        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe('QUZ-260219-001');
    });

    test('returns 404 when article not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/quizzes/article/ART-NOTFOUND');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/article not found/i);
    });

    test('returns 404 when article has no quiz', async () => {
        const articleNoQuiz = { ...mockArticle, quizId: null };
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(articleNoQuiz) });

        const res = await request(app).get('/api/quizzes/article/ART-260219-1234');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/no quiz/i);
    });

    test('returns 404 when quiz document is missing', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/quizzes/article/ART-260219-1234');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/quiz not found/i);
    });
});


// GET /api/quizzes/:id
describe('GET /api/quizzes/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns quiz by ID', async () => {
        Quiz.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockQuiz),
        });

        const res = await request(app).get('/api/quizzes/QUZ-260219-001');

        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe('QUZ-260219-001');
        expect(res.body.questions).toHaveLength(1);
    });

    test('returns 404 when quiz not found', async () => {
        Quiz.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        });

        const res = await request(app).get('/api/quizzes/QUZ-NOTFOUND');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});


// POST /api/quizzes
describe('POST /api/quizzes', () => {
    beforeEach(() => jest.clearAllMocks());

    const validPayload = {
        title: 'Flood Safety Quiz',
        articleId: 'ART-260219-1234',
        questions: [mockQuestion],
        passingScore: 60,
    };

    test('creates quiz and links it to article', async () => {
        const articleNoQuiz = { ...mockArticle, quizId: null };
        Article.findById.mockResolvedValue(articleNoQuiz);
        Quiz.create.mockResolvedValue(mockQuiz);
        Article.findByIdAndUpdate.mockResolvedValue(mockArticle);

        const res = await request(app).post('/api/quizzes').send(validPayload);

        expect(res.statusCode).toBe(201);
        expect(res.body.quiz._id).toBe('QUZ-260219-001');
        expect(res.body.linkedArticle.id).toBe('ART-260219-1234');
        expect(Article.findByIdAndUpdate).toHaveBeenCalledWith(
            'ART-260219-1234',
            { quizId: 'QUZ-260219-001' }
        );
    });

    test('returns 400 when title is missing', async () => {
        const res = await request(app)
            .post('/api/quizzes')
            .send({ articleId: 'ART-260219-1234', questions: [mockQuestion] });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/missing/i);
    });

    test('returns 400 when articleId is missing', async () => {
        const res = await request(app)
            .post('/api/quizzes')
            .send({ title: 'Quiz', questions: [mockQuestion] });

        expect(res.statusCode).toBe(400);
    });

    test('returns 400 when questions array is empty', async () => {
        const res = await request(app).post('/api/quizzes').send({
            title: 'Quiz',
            articleId: 'ART-260219-1234',
            questions: [],
        });

        expect(res.statusCode).toBe(400);
    });

    test('returns 404 when article does not exist', async () => {
        Article.findById.mockResolvedValue(null);

        const res = await request(app).post('/api/quizzes').send(validPayload);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/article not found/i);
    });

    test('returns 400 when article already has a quiz', async () => {
        Article.findById.mockResolvedValue(mockArticle); // has quizId

        const res = await request(app).post('/api/quizzes').send(validPayload);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already has a quiz/i);
    });

    test('returns 400 for invalid question format (wrong option count)', async () => {
        const articleNoQuiz = { ...mockArticle, quizId: null };
        Article.findById.mockResolvedValue(articleNoQuiz);

        const res = await request(app).post('/api/quizzes').send({
            title: 'Quiz',
            articleId: 'ART-260219-1234',
            questions: [
                mockQuestion,
                {
                    question: 'Second question?',
                    options: ['Only', 'Three', 'Options'], // should be 4
                    correctAnswer: 0,
                },
            ],
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid question/i);
    });
});


// PUT /api/quizzes/:id
describe('PUT /api/quizzes/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('updates quiz title and passingScore', async () => {
        const updated = { ...mockQuiz, title: 'Updated Quiz', passingScore: 70 };
        Quiz.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });

        const res = await request(app)
            .put('/api/quizzes/QUZ-260219-001')
            .send({ title: 'Updated Quiz', passingScore: 70 });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Updated Quiz');
        expect(res.body.passingScore).toBe(70);
    });

    test('returns 400 when trying to change articleId', async () => {
        const res = await request(app)
            .put('/api/quizzes/QUZ-260219-001')
            .send({ articleId: 'ART-OTHER', title: 'New Title' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/cannot change article/i);
    });

    test('returns 404 when quiz not found', async () => {
        Quiz.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app)
            .put('/api/quizzes/QUZ-NOTFOUND')
            .send({ title: 'New Title' });

        expect(res.statusCode).toBe(404);
    });

    test('returns 400 for invalid question format in update', async () => {
        const res = await request(app)
            .put('/api/quizzes/QUZ-260219-001')
            .send({
                questions: [
                    {
                        question: 'Bad question?',
                        options: ['A', 'B'], // only 2 options
                        correctAnswer: 0,
                    },
                ],
            });

        expect(res.statusCode).toBe(400);
    });
});


// DELETE /api/quizzes/:id
describe('DELETE /api/quizzes/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('deletes quiz and unlinks from article', async () => {
        Quiz.findByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        Article.findByIdAndUpdate.mockResolvedValue(mockArticle);

        const res = await request(app).delete('/api/quizzes/QUZ-260219-001');

        expect(res.statusCode).toBe(200);
        expect(res.body.deletedQuizId).toBe('QUZ-260219-001');
        expect(res.body.unlinkedFromArticle).toBe('ART-260219-1234');
        expect(Article.findByIdAndUpdate).toHaveBeenCalledWith(
            'ART-260219-1234',
            { quizId: null }
        );
    });

    test('returns 404 when quiz not found', async () => {
        Quiz.findByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).delete('/api/quizzes/QUZ-NOTFOUND');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});