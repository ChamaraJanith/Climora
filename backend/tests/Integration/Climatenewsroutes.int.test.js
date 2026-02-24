/**
 * INTEGRATION TESTS — Climate News Routes
 * Tests HTTP layer end-to-end (router → middleware → controller)
 * Path: tests/integration/climateNewsRoutes.test.js
 */

const request = require('supertest');
const express = require('express');

jest.mock('../../models/ClimateNews');
jest.mock('axios');

const ClimateNews = require('../../models/ClimateNews');
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

// ── Middleware mocks ───────────────────────────────────────────────────────
jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, _res, next) => {
        req.user = { userId: 'USR-TEST-001', role: 'USER' };
        next();
    },
}));

jest.mock('../../middleware/roleMiddleware', () => ({
    allowRoles: (...roles) => (req, res, next) => {
        if (roles.includes(req.user?.role)) return next();
        return res.status(403).json({ error: 'Forbidden' });
    },
}));

const climateNewsRouter = require('../../routes/climateNewsRoutes');

const app = express();
app.use(express.json());
app.use('/api/climate-news', climateNewsRouter);

// ── Shared test data ───────────────────────────────────────────────────────
const recentDate = new Date(Date.now() - 5 * 60 * 1000);   // 5 min ago (fresh)
const staleDate = new Date(Date.now() - 60 * 60 * 1000);  // 1 hour ago (stale)

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

const mockWorldItem = {
    ...mockNewsItem,
    _id: 'NEWS-260219-1002',
    articleId: 'newsdata-xyz456',
    title: 'Cyclone warning issued for Bay of Bengal',
    isSriLanka: false,
    climateCategory: 'cyclone',
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

const freshCacheMock = () =>
    ClimateNews.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockNewsItem, createdAt: recentDate }),
    });

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/climate-news  (public)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/climate-news', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEWSDATA_API_KEY = 'TEST_KEY';
    });

    test('200 — returns paginated news list from fresh cache', async () => {
        freshCacheMock();
        ClimateNews.countDocuments.mockResolvedValue(2);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockNewsItem, mockWorldItem]));

        const res = await request(app).get('/api/climate-news');

        expect(res.status).toBe(200);
        expect(res.body.news).toHaveLength(2);
        expect(res.body.pagination.total).toBe(2);
        expect(res.body).toHaveProperty('meta');
    });

    test('200 — filters by category=flood', async () => {
        freshCacheMock();
        ClimateNews.countDocuments.mockResolvedValue(1);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockNewsItem]));

        const res = await request(app).get('/api/climate-news?category=flood');

        expect(res.status).toBe(200);
        expect(ClimateNews.find).toHaveBeenCalledWith(
            expect.objectContaining({ climateCategory: 'flood' })
        );
    });

    test('200 — filters type=sri-lanka sets isSriLanka:true', async () => {
        freshCacheMock();
        ClimateNews.countDocuments.mockResolvedValue(1);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockNewsItem]));

        const res = await request(app).get('/api/climate-news?type=sri-lanka');

        expect(res.status).toBe(200);
        expect(ClimateNews.find).toHaveBeenCalledWith(
            expect.objectContaining({ isSriLanka: true })
        );
    });

    test('200 — filters type=world sets isSriLanka:false', async () => {
        freshCacheMock();
        ClimateNews.countDocuments.mockResolvedValue(1);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockWorldItem]));

        const res = await request(app).get('/api/climate-news?type=world');

        expect(res.status).toBe(200);
        expect(ClimateNews.find).toHaveBeenCalledWith(
            expect.objectContaining({ isSriLanka: false })
        );
    });

    test('200 — respects page and limit params', async () => {
        freshCacheMock();
        ClimateNews.countDocuments.mockResolvedValue(20);
        ClimateNews.find.mockReturnValue(sortSkipLimit([]));

        const res = await request(app).get('/api/climate-news?page=2&limit=5');

        expect(res.status).toBe(200);
        expect(res.body.pagination.page).toBe(2);
        expect(res.body.pagination.limit).toBe(5);
    });

    test('200 — does NOT call external API when cache is fresh', async () => {
        freshCacheMock();
        ClimateNews.countDocuments.mockResolvedValue(1);
        ClimateNews.find.mockReturnValue(sortSkipLimit([mockNewsItem]));

        await request(app).get('/api/climate-news');

        expect(axios.get).not.toHaveBeenCalled();
    });

    test('200 — returns empty list when no articles match filter', async () => {
        freshCacheMock();
        ClimateNews.countDocuments.mockResolvedValue(0);
        ClimateNews.find.mockReturnValue(sortSkipLimit([]));

        const res = await request(app).get('/api/climate-news?category=tsunami');

        expect(res.status).toBe(200);
        expect(res.body.news).toHaveLength(0);
        expect(res.body.pagination.total).toBe(0);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/climate-news/latest  (public)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/climate-news/latest', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns latest 6 articles', async () => {
        ClimateNews.find.mockReturnValue(sortLimit([mockNewsItem, mockWorldItem]));

        const res = await request(app).get('/api/climate-news/latest');

        expect(res.status).toBe(200);
        expect(res.body.news).toHaveLength(2);
        expect(res.body.total).toBe(2);
    });

    test('200 — returns empty list when no news exist', async () => {
        ClimateNews.find.mockReturnValue(sortLimit([]));

        const res = await request(app).get('/api/climate-news/latest');

        expect(res.status).toBe(200);
        expect(res.body.news).toHaveLength(0);
    });

    test('500 — DB error returns 500', async () => {
        ClimateNews.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockRejectedValue(new Error('DB down')),
        });

        const res = await request(app).get('/api/climate-news/latest');
        expect(res.status).toBe(500);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/climate-news/stats  (public)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/climate-news/stats', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns category + region breakdown', async () => {
        ClimateNews.aggregate.mockResolvedValue([
            { _id: 'flood', count: 10 },
            { _id: 'cyclone', count: 5 },
            { _id: 'tsunami', count: 3 },
        ]);
        ClimateNews.countDocuments
            .mockResolvedValueOnce(12)   // sriLanka
            .mockResolvedValueOnce(6)    // world
            .mockResolvedValueOnce(18);  // total

        const res = await request(app).get('/api/climate-news/stats');

        expect(res.status).toBe(200);
        expect(res.body.total).toBe(18);
        expect(res.body.sriLanka).toBe(12);
        expect(res.body.world).toBe(6);
        expect(res.body.byCategory).toHaveLength(3);
        expect(res.body.byCategory[0].category).toBe('flood');
        expect(res.body.byCategory[0].count).toBe(10);
    });

    test('500 — DB error returns 500', async () => {
        ClimateNews.aggregate.mockRejectedValue(new Error('agg error'));

        const res = await request(app).get('/api/climate-news/stats');
        expect(res.status).toBe(500);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/climate-news/refresh  (ADMIN / CONTENT_MANAGER only)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] POST /api/climate-news/refresh — role protected', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEWSDATA_API_KEY = 'TEST_KEY';
    });
    afterAll(() => delete process.env.NEWSDATA_API_KEY);

    test('403 — USER role cannot trigger refresh', async () => {
        const res = await request(app).post('/api/climate-news/refresh');
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/climate-news/cleanup  (ADMIN / CONTENT_MANAGER only)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] DELETE /api/climate-news/cleanup — role protected', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER role cannot trigger cleanup', async () => {
        const res = await request(app).delete('/api/climate-news/cleanup');
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN role — refresh and cleanup
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] POST /api/climate-news/refresh — ADMIN role', () => {
    let adminApp;

    beforeAll(() => {
        process.env.NEWSDATA_API_KEY = 'TEST_KEY';

        // Build a separate app with ADMIN role mocked
        jest.doMock('../../middleware/authMiddleware', () => ({
            protect: (req, _res, next) => {
                req.user = { userId: 'USR-ADMIN-001', role: 'ADMIN' };
                next();
            },
        }));
        jest.doMock('../../middleware/roleMiddleware', () => ({
            allowRoles: () => (_req, _res, next) => next(),
        }));

        adminApp = express();
        adminApp.use(express.json());
        // Use controller directly to avoid module cache issues
        const { manualRefresh } = require('../../controller/climateNewsController');
        adminApp.post('/api/climate-news/refresh', (_req, res) => manualRefresh(_req, res));
    });

    afterAll(() => delete process.env.NEWSDATA_API_KEY);

    beforeEach(() => jest.clearAllMocks());

    test('200 — refresh returns savedCount when API returns empty results', async () => {
        axios.get.mockResolvedValue({ data: { results: [] } });
        ClimateNews.findOne.mockResolvedValue(null);

        const res = await request(adminApp).post('/api/climate-news/refresh');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('newArticlesSaved');
        expect(res.body).toHaveProperty('message');
    });

    test('500 — refresh fails when NEWSDATA_API_KEY is missing', async () => {
        delete process.env.NEWSDATA_API_KEY;

        const res = await request(adminApp).post('/api/climate-news/refresh');
        expect(res.status).toBe(500);
    });
});