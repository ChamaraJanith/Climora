const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// ── Mock all external dependencies ──────────────────────────────────────────
jest.mock('../../models/Article');
jest.mock('../../models/Quiz');
jest.mock('axios');

const Article = require('../../models/Article');
const Quiz = require('../../models/Quiz');
const axios = require('axios');

// ── Build a minimal Express app for testing ──────────────────────────────────
const articleRouter = require('../../routes/articleRoutes');

// Mock auth middleware so protected routes don't block
jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, _res, next) => {
        req.user = { userId: 'USR-TEST-001', role: 'user' };
        next();
    },
    adminOnly: (_req, _res, next) => next(),
}));

// Also mock quizController methods used inside articleRoutes
jest.mock('../../controller/quizController', () => ({
    getQuizForUser: jest.fn((_req, res) =>
        res.json({ quiz: { _id: 'QUZ-TEST-001' }, hasAttempted: false, attemptCount: 0, lastAttempt: null })
    ),
    submitQuizForUser: jest.fn((_req, res) =>
        res.json({ passed: true, percentage: 80, score: 4, total: 5 })
    ),
}));

const app = express();
app.use(express.json());
app.use('/api/articles', articleRouter);

// ── Shared test data ─────────────────────────────────────────────────────────
const mockArticle = {
    _id: 'ART-260219-1234',
    title: 'Flood Preparedness Guide',
    content: 'Content about how to prepare for floods in Sri Lanka. This is detailed content.',
    category: 'flood',
    author: 'Admin User',
    isPublished: true,
    publishedDate: new Date('2025-01-15'),
    quizId: 'QUZ-TEST-001',
};

const mockQuiz = {
    _id: 'QUZ-TEST-001',
    title: 'Flood Quiz',
    articleId: 'ART-260219-1234',
    questions: [
        {
            question: 'What should you do during a flood?',
            options: ['Stay inside', 'Move to higher ground', 'Go swimming', 'Ignore it'],
            correctAnswer: 1,
        },
    ],
    passingScore: 60,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildFindMock(data) {
    return {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(data),
    };
}


// GET /api/articles
describe('GET /api/articles', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns list of published articles with pagination', async () => {
        Article.find.mockReturnValue(buildFindMock([mockArticle]));
        Article.countDocuments.mockResolvedValue(1);

        const res = await request(app).get('/api/articles');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('articles');
        expect(res.body.articles).toHaveLength(1);
        expect(res.body.articles[0]._id).toBe('ART-260219-1234');
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination.total).toBe(1);
    });

    test('filters by category', async () => {
        Article.find.mockReturnValue(buildFindMock([mockArticle]));
        Article.countDocuments.mockResolvedValue(1);

        const res = await request(app).get('/api/articles?category=flood');

        expect(res.statusCode).toBe(200);
        // Verify Article.find was called (category filter applied internally)
        expect(Article.find).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'flood' })
        );
    });

    test('filters by search term', async () => {
        Article.find.mockReturnValue(buildFindMock([mockArticle]));
        Article.countDocuments.mockResolvedValue(1);

        const res = await request(app).get('/api/articles?search=flood');

        expect(res.statusCode).toBe(200);
        expect(Article.find).toHaveBeenCalledWith(
            expect.objectContaining({ $or: expect.any(Array) })
        );
    });

    test('respects limit and page query params', async () => {
        Article.find.mockReturnValue(buildFindMock([]));
        Article.countDocuments.mockResolvedValue(0);

        const res = await request(app).get('/api/articles?limit=5&page=2');

        expect(res.statusCode).toBe(200);
        expect(res.body.pagination.page).toBe(2);
        expect(res.body.pagination.limit).toBe(5);
    });

    test('returns 500 when database throws error', async () => {
        Article.find.mockImplementation(() => {
            throw new Error('DB connection error');
        });

        const res = await request(app).get('/api/articles');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});


// GET /api/articles/stats
describe('GET /api/articles/stats', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns article statistics', async () => {
        Article.countDocuments
            .mockResolvedValueOnce(10) // total
            .mockResolvedValueOnce(6); // withQuiz

        Article.aggregate.mockResolvedValue([
            { _id: 'flood', count: 5 },
            { _id: 'general', count: 5 },
        ]);

        const res = await request(app).get('/api/articles/stats');

        expect(res.statusCode).toBe(200);
        expect(res.body.total).toBe(10);
        expect(res.body.withQuiz).toBe(6);
        expect(res.body.withoutQuiz).toBe(4);
        expect(res.body.byCategory).toHaveLength(2);
    });

    test('returns 500 on database error', async () => {
        Article.countDocuments.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/api/articles/stats');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});


// GET /api/articles/youtube/videos
describe('GET /api/articles/youtube/videos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.YOUTUBE_API_KEY = 'TEST_KEY_123';
    });

    afterAll(() => {
        delete process.env.YOUTUBE_API_KEY;
    });

    test('returns YouTube videos for a given query', async () => {
        axios.get.mockResolvedValue({
            data: {
                items: [
                    {
                        id: { videoId: 'abc123' },
                        snippet: {
                            title: 'Flood Safety Tips',
                            description: 'How to stay safe during floods',
                            thumbnails: {
                                medium: { url: 'https://img.youtube.com/thumb.jpg' },
                                high: { url: 'https://img.youtube.com/hq.jpg' },
                            },
                            publishedAt: '2025-01-01T00:00:00Z',
                            channelTitle: 'SafetyChannel',
                            channelId: 'CH001',
                        },
                    },
                ],
            },
        });

        const res = await request(app).get('/api/articles/youtube/videos?query=flood+safety');

        expect(res.statusCode).toBe(200);
        expect(res.body.videos).toHaveLength(1);
        expect(res.body.videos[0].videoId).toBe('abc123');
        expect(res.body.videos[0]).toHaveProperty('videoUrl');
        expect(res.body.videos[0]).toHaveProperty('embedUrl');
    });

    test('returns 500 when YOUTUBE_API_KEY is missing', async () => {
        delete process.env.YOUTUBE_API_KEY;

        const res = await request(app).get('/api/articles/youtube/videos');

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toMatch(/api key/i);
    });

    test('returns 403 when YouTube quota is exceeded', async () => {
        axios.get.mockRejectedValue({
            response: { status: 403, data: { error: 'quotaExceeded' } },
            message: 'Request failed with status code 403',
        });

        const res = await request(app).get('/api/articles/youtube/videos?query=flood');

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/quota/i);
    });
});


// GET /api/articles/:id
describe('GET /api/articles/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.YOUTUBE_API_KEY = 'TEST_KEY_123';
    });

    test('returns article with quiz and related videos', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        axios.get.mockResolvedValue({
            data: {
                items: [
                    {
                        id: { videoId: 'vid001' },
                        snippet: {
                            title: 'Related Video',
                            description: 'Description',
                            thumbnails: { medium: { url: 'https://img.youtube.com/t.jpg' } },
                            publishedAt: '2025-01-01T00:00:00Z',
                            channelTitle: 'Channel',
                        },
                    },
                ],
            },
        });

        const res = await request(app).get('/api/articles/ART-260219-1234');

        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe('ART-260219-1234');
        expect(res.body.quiz).toBeDefined();
        expect(res.body.quiz._id).toBe('QUZ-TEST-001');
        expect(res.body.hasQuiz).toBe(true);
        expect(res.body.relatedVideos).toHaveLength(1);
        expect(res.body.hasRelatedVideos).toBe(true);
    });

    test('returns article without quiz when no quizId', async () => {
        const articleNoQuiz = { ...mockArticle, quizId: null };
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(articleNoQuiz) });
        axios.get.mockResolvedValue({ data: { items: [] } });

        const res = await request(app).get('/api/articles/ART-260219-1234');

        expect(res.statusCode).toBe(200);
        expect(res.body.quiz).toBeNull();
        expect(res.body.hasQuiz).toBe(false);
    });

    test('returns 404 when article not found', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/articles/ART-NOTFOUND');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    test('still returns article when YouTube API fails', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        axios.get.mockRejectedValue(new Error('YouTube API unavailable'));

        const res = await request(app).get('/api/articles/ART-260219-1234');

        expect(res.statusCode).toBe(200);
        expect(res.body.relatedVideos).toHaveLength(0);
    });
});


// POST /api/articles
describe('POST /api/articles', () => {
    beforeEach(() => jest.clearAllMocks());

    test('creates article with valid data', async () => {
        Article.create.mockResolvedValue(mockArticle);

        const res = await request(app).post('/api/articles').send({
            title: 'Flood Preparedness Guide',
            content: 'Detailed content about floods and preparedness in Sri Lanka.',
            category: 'flood',
            author: 'Admin User',
        });

        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBe('ART-260219-1234');
    });

    test('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/api/articles').send({
            title: 'Missing content and author',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when title is missing', async () => {
        const res = await request(app).post('/api/articles').send({
            content: 'Some content here',
            author: 'Admin',
        });

        expect(res.statusCode).toBe(400);
    });

    test('returns 400 when author is missing', async () => {
        const res = await request(app).post('/api/articles').send({
            title: 'Some title here',
            content: 'Some content here',
        });

        expect(res.statusCode).toBe(400);
    });
});


// PUT /api/articles/:id
describe('PUT /api/articles/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('updates article successfully', async () => {
        const updated = { ...mockArticle, title: 'Updated Flood Guide' };
        Article.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });

        const res = await request(app)
            .put('/api/articles/ART-260219-1234')
            .send({ title: 'Updated Flood Guide' });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Updated Flood Guide');
    });

    test('returns 404 when article does not exist', async () => {
        Article.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app)
            .put('/api/articles/ART-NOTFOUND')
            .send({ title: 'New Title' });

        expect(res.statusCode).toBe(404);
    });

    test('ignores quizId in update body', async () => {
        const updated = { ...mockArticle };
        Article.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });

        await request(app)
            .put('/api/articles/ART-260219-1234')
            .send({ title: 'New Title', quizId: 'QUZ-HACKED' });

        // quizId should be stripped, not passed to findByIdAndUpdate
        const callArg = Article.findByIdAndUpdate.mock.calls[0][1];
        expect(callArg).not.toHaveProperty('quizId');
    });
});


// DELETE /api/articles/:id
describe('DELETE /api/articles/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    test('deletes article and its linked quiz', async () => {
        Article.findById.mockResolvedValue(mockArticle);
        Quiz.findByIdAndDelete.mockResolvedValue(mockQuiz);
        Article.findByIdAndDelete.mockResolvedValue(mockArticle);

        const res = await request(app).delete('/api/articles/ART-260219-1234');

        expect(res.statusCode).toBe(200);
        expect(res.body.deletedArticleId).toBe('ART-260219-1234');
        expect(res.body.deletedQuizId).toBe('QUZ-TEST-001');
        expect(Quiz.findByIdAndDelete).toHaveBeenCalledWith('QUZ-TEST-001');
    });

    test('deletes article without a quiz', async () => {
        const articleNoQuiz = { ...mockArticle, quizId: null };
        Article.findById.mockResolvedValue(articleNoQuiz);
        Article.findByIdAndDelete.mockResolvedValue(articleNoQuiz);

        const res = await request(app).delete('/api/articles/ART-260219-1234');

        expect(res.statusCode).toBe(200);
        expect(Quiz.findByIdAndDelete).not.toHaveBeenCalled();
        expect(res.body.deletedQuizId).toBeNull();
    });

    test('returns 404 when article does not exist', async () => {
        Article.findById.mockResolvedValue(null);

        const res = await request(app).delete('/api/articles/ART-NOTFOUND');

        expect(res.statusCode).toBe(404);
    });
});


// GET /api/articles/:articleId/:userId/quiz  (protected)
describe('GET /api/articles/:articleId/:userId/quiz', () => {
    test('returns quiz data for user (protected route)', async () => {
        const res = await request(app).get('/api/articles/ART-260219-1234/USR-TEST-001/quiz');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('quiz');
    });
});

// POST /api/articles/:articleId/:userId/quiz/submit  (protected)
describe('POST /api/articles/:articleId/:userId/quiz/submit', () => {
    test('submits quiz answers for user (protected route)', async () => {
        const res = await request(app)
            .post('/api/articles/ART-260219-1234/USR-TEST-001/quiz/submit')
            .send({ answers: [1, 0, 2, 3, 1] });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('passed');
        expect(res.body).toHaveProperty('percentage');
    });
});