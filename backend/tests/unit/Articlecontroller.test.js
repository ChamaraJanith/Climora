/**
 * UNIT TESTS — articleController.js
 * Tests each controller function in isolation (no DB, no HTTP)
 * Path: tests/unit/articleController.test.js
 */

jest.mock('../../models/Article');
jest.mock('../../models/Quiz');
jest.mock('axios');

const Article = require('../../models/Article');
const Quiz    = require('../../models/Quiz');
const axios   = require('axios');

const {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    getYouTubeVideos,
    getArticleStats,
} = require('../../controller/articleController');

// ── Helpers ────────────────────────────────────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
};

const mockReq = (overrides = {}) => ({
    query:  {},
    params: {},
    body:   {},
    ...overrides,
});

const mockArticle = {
    _id:           'ART-260219-1234',
    title:         'Flood Preparedness Guide for Sri Lanka',
    content:       'Detailed content about how to prepare for floods in Sri Lanka.',
    category:      'flood',
    author:        'Admin',
    isPublished:   true,
    publishedDate: new Date('2025-01-15'),
    quizId:        'QUZ-260219-001',
};

const mockQuiz = {
    _id:         'QUZ-260219-001',
    title:       'Flood Safety Quiz',
    articleId:   'ART-260219-1234',
    questions:   [{ question: 'Q1?', options: ['A','B','C','D'], correctAnswer: 1 }],
    passingScore: 60,
};

// helper to build chainable find mock
const findChain = (data) => ({
    sort:  jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip:  jest.fn().mockReturnThis(),
    lean:  jest.fn().mockResolvedValue(data),
});

// ══════════════════════════════════════════════════════════════════════════════
// getAllArticles
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getAllArticles', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns articles + pagination on success', async () => {
        Article.find.mockReturnValue(findChain([mockArticle]));
        Article.countDocuments.mockResolvedValue(1);

        const req = mockReq({ query: { page: '1', limit: '20' } });
        const res = mockRes();

        await getAllArticles(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            articles:   expect.any(Array),
            pagination: expect.objectContaining({ total: 1, page: 1 }),
        }));
    });

    test('filters by category when provided', async () => {
        Article.find.mockReturnValue(findChain([]));
        Article.countDocuments.mockResolvedValue(0);

        const req = mockReq({ query: { category: 'flood' } });
        await getAllArticles(req, mockRes());

        expect(Article.find).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'flood' })
        );
    });

    test('does NOT filter by category when category=all', async () => {
        Article.find.mockReturnValue(findChain([]));
        Article.countDocuments.mockResolvedValue(0);

        const req = mockReq({ query: { category: 'all' } });
        await getAllArticles(req, mockRes());

        const calledFilter = Article.find.mock.calls[0][0];
        expect(calledFilter).not.toHaveProperty('category');
    });

    test('adds $or filter when search term provided', async () => {
        Article.find.mockReturnValue(findChain([]));
        Article.countDocuments.mockResolvedValue(0);

        const req = mockReq({ query: { search: 'flood' } });
        await getAllArticles(req, mockRes());

        const calledFilter = Article.find.mock.calls[0][0];
        expect(calledFilter).toHaveProperty('$or');
    });

    test('returns 500 on DB error', async () => {
        Article.find.mockImplementation(() => { throw new Error('DB down'); });

        const res = mockRes();
        await getAllArticles(mockReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getArticleById
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getArticleById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.YOUTUBE_API_KEY = 'TEST_KEY';
    });
    afterAll(() => delete process.env.YOUTUBE_API_KEY);

    test('returns article + quiz + videos on success', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        axios.get.mockResolvedValue({ data: { items: [{
            id: { videoId: 'vid1' },
            snippet: { title: 'V', description: 'D',
                thumbnails: { medium: { url: 'http://t.jpg' } },
                publishedAt: '2025-01-01', channelTitle: 'Ch' },
        }] } });

        const req = mockReq({ params: { id: 'ART-260219-1234' } });
        const res = mockRes();
        await getArticleById(req, res);

        const body = res.json.mock.calls[0][0];
        expect(body.quiz).toBeDefined();
        expect(body.hasQuiz).toBe(true);
        expect(body.relatedVideos).toHaveLength(1);
    });

    test('returns 404 when article missing', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getArticleById(mockReq({ params: { id: 'NOPE' } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('still responds when YouTube API fails', async () => {
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });
        Quiz.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockQuiz) });
        axios.get.mockRejectedValue(new Error('YouTube down'));

        const res = mockRes();
        await getArticleById(mockReq({ params: { id: 'ART-260219-1234' } }), res);

        expect(res.json).toHaveBeenCalled();
        const body = res.json.mock.calls[0][0];
        expect(body.relatedVideos).toHaveLength(0);
    });

    test('quiz is null when article has no quizId', async () => {
        const noQuiz = { ...mockArticle, quizId: null };
        Article.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(noQuiz) });
        axios.get.mockResolvedValue({ data: { items: [] } });

        const res = mockRes();
        await getArticleById(mockReq({ params: { id: 'ART-260219-1234' } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.quiz).toBeNull();
        expect(body.hasQuiz).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// createArticle
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] createArticle', () => {
    beforeEach(() => jest.clearAllMocks());

    test('creates and returns article with status 201', async () => {
        Article.create.mockResolvedValue(mockArticle);

        const req = mockReq({ body: { title: 'T', content: 'C', author: 'A' } });
        const res = mockRes();
        await createArticle(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'ART-260219-1234' }));
    });

    test('returns 400 when title missing', async () => {
        const res = mockRes();
        await createArticle(mockReq({ body: { content: 'C', author: 'A' } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when content missing', async () => {
        const res = mockRes();
        await createArticle(mockReq({ body: { title: 'T', author: 'A' } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when author missing', async () => {
        const res = mockRes();
        await createArticle(mockReq({ body: { title: 'T', content: 'C' } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// updateArticle
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] updateArticle', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns updated article', async () => {
        const updated = { ...mockArticle, title: 'New Title' };
        Article.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });

        const req = mockReq({ params: { id: 'ART-260219-1234' }, body: { title: 'New Title' } });
        const res = mockRes();
        await updateArticle(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
    });

    test('strips quizId from update data', async () => {
        Article.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockArticle) });

        const req = mockReq({ params: { id: 'ART-260219-1234' }, body: { title: 'T', quizId: 'HACK' } });
        await updateArticle(req, mockRes());

        const updateArg = Article.findByIdAndUpdate.mock.calls[0][1];
        expect(updateArg).not.toHaveProperty('quizId');
    });

    test('returns 404 when article not found', async () => {
        Article.findByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await updateArticle(mockReq({ params: { id: 'NOPE' }, body: {} }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// deleteArticle
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] deleteArticle', () => {
    beforeEach(() => jest.clearAllMocks());

    test('deletes article and its linked quiz', async () => {
        Article.findById.mockResolvedValue(mockArticle);
        Quiz.findByIdAndDelete.mockResolvedValue(mockQuiz);
        Article.findByIdAndDelete.mockResolvedValue(mockArticle);

        const res = mockRes();
        await deleteArticle(mockReq({ params: { id: 'ART-260219-1234' } }), res);

        expect(Quiz.findByIdAndDelete).toHaveBeenCalledWith('QUZ-260219-001');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            deletedArticleId: 'ART-260219-1234',
            deletedQuizId:    'QUZ-260219-001',
        }));
    });

    test('skips quiz delete when article has no quiz', async () => {
        Article.findById.mockResolvedValue({ ...mockArticle, quizId: null });
        Article.findByIdAndDelete.mockResolvedValue({});

        await deleteArticle(mockReq({ params: { id: 'ART-260219-1234' } }), mockRes());

        expect(Quiz.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('returns 404 when article not found', async () => {
        Article.findById.mockResolvedValue(null);

        const res = mockRes();
        await deleteArticle(mockReq({ params: { id: 'NOPE' } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getYouTubeVideos
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getYouTubeVideos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.YOUTUBE_API_KEY = 'TEST_KEY';
    });
    afterAll(() => delete process.env.YOUTUBE_API_KEY);

    const youtubeItem = (id) => ({
        id: { videoId: id },
        snippet: {
            title: `Video ${id}`, description: 'Desc',
            thumbnails: { medium: { url: 'http://t.jpg' }, high: { url: 'http://h.jpg' } },
            publishedAt: '2025-01-01', channelTitle: 'Ch', channelId: 'CID',
        },
    });

    test('returns formatted video list', async () => {
        axios.get.mockResolvedValue({ data: { items: [youtubeItem('abc'), youtubeItem('def')] } });

        const res = mockRes();
        await getYouTubeVideos(mockReq({ query: { query: 'flood' } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.videos).toHaveLength(2);
        expect(body.videos[0]).toHaveProperty('videoUrl');
        expect(body.videos[0]).toHaveProperty('embedUrl');
    });

    test('returns 500 when API key missing', async () => {
        delete process.env.YOUTUBE_API_KEY;

        const res = mockRes();
        await getYouTubeVideos(mockReq({ query: {} }), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('returns 403 when YouTube quota exceeded', async () => {
        axios.get.mockRejectedValue({ response: { status: 403, data: {} }, message: '403' });

        const res = mockRes();
        await getYouTubeVideos(mockReq({ query: {} }), res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('clamps maxResults between 1 and 50', async () => {
        axios.get.mockResolvedValue({ data: { items: [] } });

        await getYouTubeVideos(mockReq({ query: { maxResults: '999' } }), mockRes());

        const params = axios.get.mock.calls[0][1].params;
        expect(params.maxResults).toBe(50);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getArticleStats
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getArticleStats', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns total, withQuiz, withoutQuiz, byCategory', async () => {
        Article.countDocuments
            .mockResolvedValueOnce(10)  // total
            .mockResolvedValueOnce(6);  // withQuiz
        Article.aggregate.mockResolvedValue([
            { _id: 'flood', count: 6 },
            { _id: 'general', count: 4 },
        ]);

        const res = mockRes();
        await getArticleStats(mockReq(), res);

        const body = res.json.mock.calls[0][0];
        expect(body.total).toBe(10);
        expect(body.withQuiz).toBe(6);
        expect(body.withoutQuiz).toBe(4);
        expect(body.byCategory).toHaveLength(2);
    });

    test('returns 500 on DB error', async () => {
        Article.countDocuments.mockRejectedValue(new Error('DB error'));

        const res = mockRes();
        await getArticleStats(mockReq(), res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});