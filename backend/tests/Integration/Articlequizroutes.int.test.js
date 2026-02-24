/**
 * INTEGRATION TESTS — Article Routes + Quiz Routes
 * Tests HTTP layer end-to-end (router → middleware → controller)
 * All DB models are mocked — no real MongoDB connection needed.
 * Path: tests/integration/articleQuizRoutes.test.js
 */

const request = require('supertest');
const express = require('express');

// ── Mock models & external libs ────────────────────────────────────────────
jest.mock('../../models/Article');
jest.mock('../../models/Quiz');
jest.mock('../../models/QuizAttempt');
jest.mock('../../models/User');
jest.mock('axios');

const Article = require('../../models/Article');
const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');
const User = require('../../models/User');
const axios = require('axios');

// silence controller logs during tests
beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });
    jest.spyOn(console, "warn").mockImplementation(() => { });
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
});

// ── Mock middleware ────────────────────────────────────────────────────────
jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, _res, next) => {
        req.user = { userId: 'USR-001', role: 'USER' };
        next();
    },
}));

jest.mock('../../middleware/roleMiddleware', () => ({
    allowRoles: (...roles) => (req, res, next) => {
        // Simulate role check — req.user.role must be in allowed roles
        if (roles.includes(req.user?.role)) return next();
        return res.status(403).json({ error: 'Forbidden' });
    },
}));

// ── App setup ──────────────────────────────────────────────────────────────
const articleRouter = require('../../routes/articleRoutes');
const quizRouter = require('../../routes/quizRoutes');

const app = express();
app.use(express.json());
app.use('/api/articles', articleRouter);
app.use('/api/quizzes', quizRouter);

// ── Shared data ────────────────────────────────────────────────────────────
const mockArticle = {
    _id: 'ART-260219-1234',
    title: 'Flood Preparedness Guide Sri Lanka',
    content: 'Detailed content about flooding and what to do during a flood event.',
    category: 'flood',
    author: 'Admin',
    isPublished: true,
    quizId: 'QUZ-260219-001',
};

const mockQuiz = {
    _id: 'QUZ-260219-001',
    title: 'Flood Safety Quiz',
    articleId: 'ART-260219-1234',
    questions: [{
        question: 'What to do in a flood?',
        options: ['Stay', 'Evacuate', 'Ignore', 'Sleep'],
        correctAnswer: 1,
    }],
    passingScore: 60,
};

const mockUser = { _id: 'USR-DB-001', userId: 'USR-001', username: 'tester' };

const findChain = (data) => ({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
});

const populateChain = (data) => ({
    populate: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
});

const populateLean = (data) => ({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
});

// ══════════════════════════════════════════════════════════════════════════════
// ARTICLE ROUTES — PUBLIC
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/articles', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns articles list', async () => {
        Article.find.mockReturnValue(findChain([mockArticle]));
        Article.countDocuments.mockResolvedValue(1);

        const res = await request(app).get('/api/articles');

        expect(res.status).toBe(200);
        expect(res.body.articles).toHaveLength(1);
        expect(res.body.pagination.total).toBe(1);
    });

    test('200 — category filter is passed to DB query', async () => {
        Article.find.mockReturnValue(findChain([]));
        Article.countDocuments.mockResolvedValue(0);

        await request(app).get('/api/articles?category=flood');

        expect(Article.find).toHaveBeenCalledWith(expect.objectContaining({ category: 'flood' }));
    });

    test('200 — search filter adds $or to DB query', async () => {
        Article.find.mockReturnValue(findChain([]));
        Article.countDocuments.mockResolvedValue(0);

        await request(app).get('/api/articles?search=tsunami');

        const filterArg = Article.find.mock.calls[0][0];
        expect(filterArg).toHaveProperty('$or');
    });

    test('500 — DB error returns 500', async () => {
        Article.find.mockImplementation(() => { throw new Error('DB down'); });

        const res = await request(app).get('/api/articles');
        expect(res.status).toBe(500);
    });
});

describe('[INTEGRATION] GET /api/articles/stats', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns statistics', async () => {
        Article.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(6);
        Article.aggregate.mockResolvedValue([{ _id: 'flood', count: 6 }]);

        const res = await request(app).get('/api/articles/stats');

        expect(res.status).toBe(200);
        expect(res.body.total).toBe(10);
        expect(res.body.withQuiz).toBe(6);
        expect(res.body.withoutQuiz).toBe(4);
    });
});

describe('[INTEGRATION] GET /api/articles/youtube/videos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.YOUTUBE_API_KEY = 'TEST_KEY';
    });
    afterAll(() => delete process.env.YOUTUBE_API_KEY);

    test('200 — returns video list', async () => {
        axios.get.mockResolvedValue({
            data: {
                items: [{
                    id: { videoId: 'VID001' },
                    snippet: {
                        title: 'Flood Safety', description: 'Stay safe',
                        thumbnails: { medium: { url: 'http://t.jpg' }, high: { url: 'http://h.jpg' } },
                        publishedAt: '2025-01-01', channelTitle: 'SafetyTV', channelId: 'CH1',
                    },
                }]
            }
        });

        const res = await request(app).get('/api/articles/youtube/videos?query=flood');

        expect(res.status).toBe(200);
        expect(res.body.videos).toHaveLength(1);
        expect(res.body.videos[0]).toHaveProperty('embedUrl');
    });

    test('500 — missing API key returns 500', async () => {
        delete process.env.YOUTUBE_API_KEY;
        const res = await request(app).get('/api/articles/youtube/videos');
        expect(res.status).toBe(500);
    });

    test('403 — YouTube quota error returns 403', async () => {
        axios.get.mockRejectedValue({ response: { status: 403, data: {} }, message: 'quota' });
        const res = await request(app).get('/api/articles/youtube/videos?query=flood');
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] GET /api/articles/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.YOUTUBE_API_KEY = 'TEST_KEY';
    });

    test('200 — returns article with quiz and videos', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        axios.get.mockResolvedValue({ data: { items: [] } });

        const res = await request(app).get('/api/articles/ART-260219-1234');

        expect(res.status).toBe(200);
        expect(res.body.quiz._id).toBe('QUZ-260219-001');
        expect(res.body.hasQuiz).toBe(true);
    });

    test('404 — article not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/articles/ART-NOTFOUND');
        expect(res.status).toBe(404);
    });

    test('200 — still responds even when YouTube API fails', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        axios.get.mockRejectedValue(new Error('YouTube down'));

        const res = await request(app).get('/api/articles/ART-260219-1234');
        expect(res.status).toBe(200);
        expect(res.body.relatedVideos).toHaveLength(0);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// ARTICLE ROUTES — PROTECTED (require ADMIN or CONTENT_MANAGER role)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] POST /api/articles — role protected', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER role cannot create article', async () => {
        // Default mock user has role USER
        const res = await request(app).post('/api/articles').send({
            title: 'New Article', content: 'Some content here', author: 'Me',
        });
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] POST /api/articles — ADMIN role', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Override protect to simulate ADMIN role
        jest.resetModules();
    });

    test('400 — missing required fields', async () => {
        // Even without role bypass, controller validates before creating
        // We need to test with an admin-mocked app
        const adminApp = express();
        adminApp.use(express.json());

        jest.doMock('../../middleware/authMiddleware', () => ({
            protect: (req, _res, next) => { req.user = { userId: 'USR-001', role: 'ADMIN' }; next(); },
        }));
        jest.doMock('../../middleware/roleMiddleware', () => ({
            allowRoles: () => (_req, _res, next) => next(),
        }));

        // Use controller directly for this test
        Article.create.mockResolvedValue(mockArticle);

        const articleController = require('../../controller/articleController');

        // Test validation directly
        const res = mockRes();
        await articleController.createArticle({ body: { title: 'Only title' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);

        function mockRes() {
            const r = {};
            r.status = jest.fn().mockReturnValue(r);
            r.json = jest.fn().mockReturnValue(r);
            return r;
        }
    });
});

describe('[INTEGRATION] DELETE /api/articles/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER role cannot delete', async () => {
        const res = await request(app).delete('/api/articles/ART-260219-1234');
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] PUT /api/articles/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER role cannot update', async () => {
        const res = await request(app).put('/api/articles/ART-260219-1234').send({ title: 'X' });
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// QUIZ ROUTES — PUBLIC
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/quizzes/article/:articleId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns quiz for article', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });

        const res = await request(app).get('/api/quizzes/article/ART-260219-1234');

        expect(res.status).toBe(200);
        expect(res.body._id).toBe('QUZ-260219-001');
    });

    test('404 — article not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/quizzes/article/NOPE');
        expect(res.status).toBe(404);
    });

    test('404 — article has no quiz', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ ...mockArticle, quizId: null }) });

        const res = await request(app).get('/api/quizzes/article/ART-260219-1234');
        expect(res.status).toBe(404);
    });
});

describe('[INTEGRATION] GET /api/quizzes/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns quiz by ID', async () => {
        Quiz.findById.mockReturnValue(populateLean(mockQuiz));

        const res = await request(app).get('/api/quizzes/QUZ-260219-001');
        expect(res.status).toBe(200);
        expect(res.body._id).toBe('QUZ-260219-001');
    });

    test('404 — quiz not found', async () => {
        Quiz.findById.mockReturnValue(populateLean(null));

        const res = await request(app).get('/api/quizzes/NOPE');
        expect(res.status).toBe(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// QUIZ ROUTES — PROTECTED (ADMIN / CONTENT_MANAGER only)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/quizzes — role protected', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER cannot list all quizzes', async () => {
        const res = await request(app).get('/api/quizzes');
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] POST /api/quizzes — role protected', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER cannot create quiz', async () => {
        const res = await request(app).post('/api/quizzes').send({
            title: 'Quiz', articleId: 'ART-001', questions: [],
        });
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] DELETE /api/quizzes/:id — role protected', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER cannot delete quiz', async () => {
        const res = await request(app).delete('/api/quizzes/QUZ-001');
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER QUIZ SUBMISSION (any logged-in user)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/articles/:articleId/:userId/quiz', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — logged-in user can fetch quiz', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        QuizAttempt.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        });

        const res = await request(app).get('/api/articles/ART-260219-1234/USR-001/quiz');

        expect(res.status).toBe(200);
        expect(res.body.quiz._id).toBe('QUZ-260219-001');
        expect(res.body.hasAttempted).toBe(false);
    });
});

describe('[INTEGRATION] POST /api/articles/:articleId/:userId/quiz/submit', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — submits answers and returns score', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        QuizAttempt.create.mockResolvedValue({ _id: 'ATT-001' });

        const res = await request(app)
            .post('/api/articles/ART-260219-1234/USR-001/quiz/submit')
            .send({ answers: [1] }); // correct answer

        expect(res.status).toBe(200);
        expect(res.body.score).toBe(1);
        expect(res.body.passed).toBe(true);
    });

    test('400 — missing answers returns 400', async () => {
        const res = await request(app)
            .post('/api/articles/ART-260219-1234/USR-001/quiz/submit')
            .send({});

        expect(res.status).toBe(400);
    });

    test('400 — wrong number of answers', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });

        const res = await request(app)
            .post('/api/articles/ART-260219-1234/USR-001/quiz/submit')
            .send({ answers: [1, 2, 3] }); // quiz has only 1 question

        expect(res.status).toBe(400);
    });
});