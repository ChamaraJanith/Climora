/**
 * UNIT TESTS — climateNewsController.js
 * Tests controller functions and helper logic in isolation.
 * Path: tests/unit/climateNewsController.test.js
 */

jest.mock('../../models/ClimateNews');
jest.mock('axios');

const ClimateNews = require('../../models/ClimateNews');
const axios = require('axios');

const {
    getClimateNews,
    getLatestClimateNews,
    getClimateNewsStats,
    manualRefresh,
} = require('../../controller/climateNewsController');

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

// ── Helpers ────────────────────────────────────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockReq = (o = {}) => ({ query: {}, params: {}, body: {}, user: { userId: 'USR-001', role: 'ADMIN' }, ...o });

const recentDate = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago (fresh cache)
const staleDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago (stale cache)

const mockNewsItem = {
    _id: 'NEWS-260219-1001',
    articleId: 'newsdata-abc123',
    title: 'Major flood hits Southern Sri Lanka',
    description: 'Heavy rains cause flooding across Galle district.',
    climateCategory: 'flood',
    isSriLanka: true,
    publishedAt: new Date('2025-06-01'),
    createdAt: recentDate,
};

// chain helpers
const sortSkipLimit = (data) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
});

const sortLimit = (data) => ({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
});

// ══════════════════════════════════════════════════════════════════════════════
// getLatestClimateNews
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getLatestClimateNews', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns up to 6 latest articles', async () => {
        ClimateNews.find.mockReturnValue(sortLimit([mockNewsItem]));

        const res = mockRes();
        await getLatestClimateNews(mockReq(), res);

        const body = res.json.mock.calls[0][0];
        expect(body.news).toHaveLength(1);
        expect(body.total).toBe(1);
    });

    test('returns 500 on DB error', async () => {
        ClimateNews.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockRejectedValue(new Error('DB down')),
        });

        const res = mockRes();
        await getLatestClimateNews(mockReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getClimateNewsStats
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getClimateNewsStats', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns category breakdown + sri lanka / world split', async () => {
        ClimateNews.aggregate.mockResolvedValue([
            { _id: 'flood', count: 10 },
            { _id: 'earthquake', count: 5 },
        ]);
        ClimateNews.countDocuments
            .mockResolvedValueOnce(8)   // sriLankaCount
            .mockResolvedValueOnce(7)   // worldCount
            .mockResolvedValueOnce(15); // total

        const res = mockRes();
        await getClimateNewsStats(mockReq(), res);

        const body = res.json.mock.calls[0][0];
        expect(body.total).toBe(15);
        expect(body.sriLanka).toBe(8);
        expect(body.world).toBe(7);
        expect(body.byCategory).toHaveLength(2);
        expect(body.byCategory[0].category).toBe('flood');
    });

    test('returns 500 on DB error', async () => {
        ClimateNews.aggregate.mockRejectedValue(new Error('agg fail'));

        const res = mockRes();
        await getClimateNewsStats(mockReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getClimateNews — cache logic
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getClimateNews — serves from cache when fresh', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEWSDATA_API_KEY = 'TEST_KEY';
    });
    afterAll(() => delete process.env.NEWSDATA_API_KEY);

    test('does NOT call external API when cache is fresh', async () => {
        // latestCached.createdAt is recent (within 30 min)
        ClimateNews.findOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ ...mockNewsItem, createdAt: recentDate }),
        });
        ClimateNews.countDocuments.mockResolvedValue(5);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockNewsItem]));

        const req = mockReq({ query: { category: 'all', type: 'all', page: '1', limit: '12' } });
        const res = mockRes();
        await getClimateNews(req, res);

        // axios should NOT be called since cache is fresh
        expect(axios.get).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });

    test('filters by category in DB query', async () => {
        ClimateNews.findOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ ...mockNewsItem, createdAt: recentDate }),
        });
        ClimateNews.countDocuments.mockResolvedValue(3);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockNewsItem]));

        const req = mockReq({ query: { category: 'flood', type: 'all' } });
        const res = mockRes();
        await getClimateNews(req, res);

        expect(ClimateNews.find).toHaveBeenCalledWith(expect.objectContaining({ climateCategory: 'flood' }));
    });

    test('filters by sri-lanka type', async () => {
        ClimateNews.findOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ ...mockNewsItem, createdAt: recentDate }),
        });
        ClimateNews.countDocuments.mockResolvedValue(2);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockNewsItem]));

        const req = mockReq({ query: { type: 'sri-lanka' } });
        const res = mockRes();
        await getClimateNews(req, res);

        expect(ClimateNews.find).toHaveBeenCalledWith(expect.objectContaining({ isSriLanka: true }));
    });

    test('filters by world type', async () => {
        ClimateNews.findOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ ...mockNewsItem, createdAt: recentDate }),
        });
        ClimateNews.countDocuments.mockResolvedValue(3);
        ClimateNews.find.mockReturnValue(sortSkipLimit([]));

        const req = mockReq({ query: { type: 'world' } });
        const res = mockRes();
        await getClimateNews(req, res);

        expect(ClimateNews.find).toHaveBeenCalledWith(expect.objectContaining({ isSriLanka: false }));
    });

    test('returns empty news list when cache is empty and API returns no results', async () => {
        // latestCached = null → stale → triggers fetch
        // fetchAndCacheNews catches per-keyword errors internally → returns savedCount:0 (no throw)
        // Controller then queries DB → returns empty list with 200 (not 503)
        // NOTE: 503 would only occur if fetchAndCacheNews itself throws (e.g. missing API key)
        ClimateNews.findOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        });
        axios.get.mockRejectedValue(new Error('API down')); // each keyword fails silently
        ClimateNews.countDocuments.mockResolvedValue(0);
        ClimateNews.find.mockReturnValue(sortSkipLimit([]));

        const req = mockReq({ query: { category: 'all', type: 'all', page: '1', limit: '12' } });
        const res = mockRes();
        await getClimateNews(req, res);

        // Controller returns 200 with empty list (API errors are swallowed per-keyword)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            news: [],
            pagination: expect.objectContaining({ total: 0 }),
        }));
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// manualRefresh
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] manualRefresh', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEWSDATA_API_KEY = 'TEST_KEY';
    });
    afterAll(() => delete process.env.NEWSDATA_API_KEY);

    test('calls API and returns savedCount', async () => {
        // fetchAndCacheNews makes axios calls for each keyword
        // Mock axios to return empty results (nothing to save → savedCount = 0)
        axios.get.mockResolvedValue({ data: { results: [] } });
        ClimateNews.findOne.mockResolvedValue(null); // no duplicates

        const res = mockRes();
        await manualRefresh(mockReq(), res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Refreshed'),
            newArticlesSaved: expect.any(Number),
        }));
    });

    test('returns 500 when NEWSDATA_API_KEY missing', async () => {
        delete process.env.NEWSDATA_API_KEY;

        const res = mockRes();
        await manualRefresh(mockReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});