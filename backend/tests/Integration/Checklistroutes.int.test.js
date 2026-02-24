/**
 * INTEGRATION TESTS — Checklist Routes + User Checklist Routes
 * Tests HTTP layer end-to-end (router → middleware → controller)
 * Path: tests/integration/checklistRoutes.test.js
 */

const request = require('supertest');
const express = require('express');

jest.mock('../../models/Checklist');
jest.mock('../../models/UserChecklistProgress');

const Checklist = require('../../models/Checklist');
const UserChecklistProgress = require('../../models/UserChecklistProgress');

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

const checklistRouter = require('../../routes/checklistRoutes');
const userChecklistRouter = require('../../routes/userChecklistRoutes');

const app = express();
app.use(express.json());
app.use('/api/checklists', checklistRouter);
app.use('/api/user-checklists', userChecklistRouter);

// ── Shared test data ───────────────────────────────────────────────────────
const CHECKLIST_ID = 'CHL-260219-4521';
const USER_ID = 'USR-TEST-001';

const mockItems = [
    { _id: 'ITM-001', itemName: 'Water', category: 'water', quantity: 2, note: '' },
    { _id: 'ITM-002', itemName: 'First Aid Kit', category: 'medicine', quantity: 1, note: '' },
    { _id: 'ITM-003', itemName: 'Torch', category: 'tools', quantity: 1, note: '' },
];

const makeChecklist = (extra = {}) => ({
    _id: CHECKLIST_ID,
    title: 'Flood Emergency Checklist',
    disasterType: 'flood',
    isActive: true,
    createdBy: 'USR-ADMIN-001',
    items: mockItems,
    save: jest.fn().mockResolvedValue(true),
    ...extra,
});

const makeProgress = (checkedMap = {}) => ({
    userId: USER_ID,
    checklistId: CHECKLIST_ID,
    markedItems: mockItems.map(i => ({ itemId: i._id, isChecked: checkedMap[i._id] || false })),
    save: jest.fn().mockResolvedValue(true),
});

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC CHECKLIST ROUTES
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/checklists', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns active checklists', async () => {
        Checklist.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([makeChecklist()]) });

        const res = await request(app).get('/api/checklists');

        expect(res.status).toBe(200);
        expect(res.body.checklists).toHaveLength(1);
        expect(res.body.total).toBe(1);
    });

    test('200 — returns empty list when none exist', async () => {
        Checklist.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

        const res = await request(app).get('/api/checklists');
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(0);
    });

    test('500 — DB error returns 500', async () => {
        Checklist.find.mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB down')) });

        const res = await request(app).get('/api/checklists');
        expect(res.status).toBe(500);
    });
});

describe('[INTEGRATION] GET /api/checklists/:checklistId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns single checklist', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });

        const res = await request(app).get(`/api/checklists/${CHECKLIST_ID}`);
        expect(res.status).toBe(200);
        expect(res.body._id).toBe(CHECKLIST_ID);
        expect(res.body.items).toHaveLength(3);
    });

    test('404 — checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/checklists/NOPE');
        expect(res.status).toBe(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED CHECKLIST ROUTES (ADMIN / CONTENT_MANAGER only)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] POST /api/checklists — role check', () => {
    beforeEach(() => jest.clearAllMocks());

    test('403 — USER role cannot create checklist', async () => {
        const res = await request(app).post('/api/checklists').send({ title: 'New', disasterType: 'flood' });
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] POST /api/checklists/:id/items — role check', () => {
    test('403 — USER role cannot add items', async () => {
        const res = await request(app)
            .post(`/api/checklists/${CHECKLIST_ID}/items`)
            .send({ itemName: 'Torch' });
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] PUT /api/checklists/:id/items/:itemId — role check', () => {
    test('403 — USER role cannot update items', async () => {
        const res = await request(app)
            .put(`/api/checklists/${CHECKLIST_ID}/items/ITM-001`)
            .send({ itemName: 'Updated' });
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] DELETE /api/checklists/:id/items/:itemId — role check', () => {
    test('403 — USER role cannot delete items', async () => {
        const res = await request(app).delete(`/api/checklists/${CHECKLIST_ID}/items/ITM-001`);
        expect(res.status).toBe(403);
    });
});

describe('[INTEGRATION] DELETE /api/checklists/:id — role check', () => {
    test('403 — USER role cannot delete checklist', async () => {
        const res = await request(app).delete(`/api/checklists/${CHECKLIST_ID}`);
        expect(res.status).toBe(403);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER CHECKLIST ROUTES (all protected — any logged-in user)
// ══════════════════════════════════════════════════════════════════════════════
describe('[INTEGRATION] GET /api/user-checklists/:checklistId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns merged checklist with user progress', async () => {
        const progress = makeProgress({ 'ITM-001': true });
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(progress) });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}`);

        expect(res.status).toBe(200);
        expect(res.body.checklistId).toBe(CHECKLIST_ID);
        expect(res.body.items).toHaveLength(3);
        expect(res.body.items.find(i => i._id === 'ITM-001').isChecked).toBe(true);
        expect(res.body.items.find(i => i._id === 'ITM-002').isChecked).toBe(false);
    });

    test('200 — progress shows correct percentage', async () => {
        const progress = makeProgress({ 'ITM-001': true, 'ITM-002': true });
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(progress) });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}`);

        expect(res.status).toBe(200);
        expect(res.body.progress.checked).toBe(2);
        expect(res.body.progress.total).toBe(3);
        expect(res.body.progress.percentage).toBeCloseTo(66.67, 1);
    });

    test('200 — auto-creates progress on first visit', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        UserChecklistProgress.create.mockResolvedValue(makeProgress());

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}`);

        expect(res.status).toBe(200);
        expect(UserChecklistProgress.create).toHaveBeenCalled();
    });

    test('404 — checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/user-checklists/NOPE');
        expect(res.status).toBe(404);
    });
});

describe('[INTEGRATION] GET /api/user-checklists/:checklistId/progress', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — returns progress summary only', async () => {
        const progress = {
            markedItems: [
                { itemId: 'ITM-001', isChecked: true },
                { itemId: 'ITM-002', isChecked: false },
                { itemId: 'ITM-003', isChecked: false },
            ]
        };
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(progress) });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}/progress`);

        expect(res.status).toBe(200);
        expect(res.body.total).toBe(3);
        expect(res.body.checked).toBe(1);
        expect(res.body.percentage).toBeCloseTo(33.33, 1);
    });

    test('200 — 0 progress when user has no record', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}/progress`);

        expect(res.status).toBe(200);
        expect(res.body.checked).toBe(0);
        expect(res.body.percentage).toBe(0);
    });

    test('404 — checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/user-checklists/NOPE/progress');
        expect(res.status).toBe(404);
    });
});

describe('[INTEGRATION] PATCH /api/user-checklists/:checklistId/items/:itemId/toggle', () => {
    beforeEach(() => jest.clearAllMocks());

    const makeProgressMutable = (checkedMap = {}) => {
        const items = mockItems.map(i => ({ itemId: i._id, isChecked: checkedMap[i._id] || false }));
        return { markedItems: items, save: jest.fn().mockResolvedValue(true) };
    };

    test('200 — toggles item from unchecked to checked', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });
        UserChecklistProgress.findOne.mockResolvedValue(makeProgressMutable());

        const res = await request(app).patch(`/api/user-checklists/${CHECKLIST_ID}/items/ITM-001/toggle`);

        expect(res.status).toBe(200);
        expect(res.body.itemId).toBe('ITM-001');
        expect(res.body.isChecked).toBe(true);
    });

    test('200 — toggles item from checked to unchecked', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });
        UserChecklistProgress.findOne.mockResolvedValue(makeProgressMutable({ 'ITM-001': true }));

        const res = await request(app).patch(`/api/user-checklists/${CHECKLIST_ID}/items/ITM-001/toggle`);

        expect(res.status).toBe(200);
        expect(res.body.isChecked).toBe(false);
    });

    test('404 — checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).patch('/api/user-checklists/NOPE/items/ITM-001/toggle');
        expect(res.status).toBe(404);
    });

    test('404 — item not in checklist', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(makeChecklist()) });

        const res = await request(app).patch(`/api/user-checklists/${CHECKLIST_ID}/items/ITM-GHOST/toggle`);
        expect(res.status).toBe(404);
    });
});

describe('[INTEGRATION] PATCH /api/user-checklists/:checklistId/reset', () => {
    beforeEach(() => jest.clearAllMocks());

    test('200 — resets all items to unchecked', async () => {
        const progress = {
            markedItems: [
                { itemId: 'ITM-001', isChecked: true },
                { itemId: 'ITM-002', isChecked: true },
                { itemId: 'ITM-003', isChecked: false },
            ],
            save: jest.fn().mockResolvedValue(true),
        };
        UserChecklistProgress.findOne.mockResolvedValue(progress);

        const res = await request(app).patch(`/api/user-checklists/${CHECKLIST_ID}/reset`);

        expect(res.status).toBe(200);
        progress.markedItems.forEach(item => expect(item.isChecked).toBe(false));
    });

    test('404 — no progress record found', async () => {
        UserChecklistProgress.findOne.mockResolvedValue(null);

        const res = await request(app).patch(`/api/user-checklists/${CHECKLIST_ID}/reset`);
        expect(res.status).toBe(404);
    });
});