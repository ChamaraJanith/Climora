const request = require('supertest');
const express = require('express');

jest.mock('../../models/Checklist');
jest.mock('../../models/UserChecklistProgress');

const Checklist = require('../../models/Checklist');
const UserChecklistProgress = require('../../models/UserChecklistProgress');

jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, _res, next) => {
        req.user = { userId: 'USR-TEST-001', role: 'user' };
        next();
    },
}));

const userChecklistRouter = require('../../routes/userChecklistRoutes');

const app = express();
app.use(express.json());
app.use('/api/user-checklists', userChecklistRouter);

// ── Shared mock data ─────────────────────────────────────────────────────────
const CHECKLIST_ID = 'CHL-260219-4521';
const USER_ID = 'USR-TEST-001';

const mockItems = [
    { _id: 'ITM-001', itemName: 'Water', category: 'water', quantity: 2, note: '' },
    { _id: 'ITM-002', itemName: 'First Aid Kit', category: 'medicine', quantity: 1, note: '' },
    { _id: 'ITM-003', itemName: 'Torch', category: 'tools', quantity: 1, note: '' },
];

const mockChecklist = {
    _id: CHECKLIST_ID,
    title: 'Flood Checklist',
    disasterType: 'flood',
    isActive: true,
    items: mockItems,
};

const mockProgress = {
    userId: USER_ID,
    checklistId: CHECKLIST_ID,
    markedItems: [
        { itemId: 'ITM-001', isChecked: true },
        { itemId: 'ITM-002', isChecked: false },
        { itemId: 'ITM-003', isChecked: false },
    ],
    save: jest.fn().mockResolvedValue(true),
};


// GET /api/user-checklists/:checklistId
describe('GET /api/user-checklists/:checklistId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns checklist with user progress merged in', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProgress),
        });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.checklistId).toBe(CHECKLIST_ID);
        expect(res.body.items).toHaveLength(3);

        // ITM-001 should be checked
        const waterItem = res.body.items.find((i) => i._id === 'ITM-001');
        expect(waterItem.isChecked).toBe(true);

        // ITM-002 should be unchecked
        const aidItem = res.body.items.find((i) => i._id === 'ITM-002');
        expect(aidItem.isChecked).toBe(false);
    });

    test('returns correct progress percentages', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProgress),
        });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.progress.total).toBe(3);
        expect(res.body.progress.checked).toBe(1);
        expect(res.body.progress.unchecked).toBe(2);
        expect(res.body.progress.percentage).toBeCloseTo(33.33, 1);
        expect(res.body.progress.isComplete).toBe(false);
    });

    test('auto-creates progress record on first visit', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        // Simulate create returning a new progress
        const newProgress = {
            userId: USER_ID,
            checklistId: CHECKLIST_ID,
            markedItems: mockItems.map((i) => ({ itemId: i._id, isChecked: false })),
        };
        UserChecklistProgress.create.mockResolvedValue(newProgress);

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}`);

        expect(res.statusCode).toBe(200);
        expect(UserChecklistProgress.create).toHaveBeenCalledWith(
            expect.objectContaining({ userId: USER_ID, checklistId: CHECKLIST_ID })
        );
        expect(res.body.progress.checked).toBe(0);
        expect(res.body.progress.percentage).toBe(0);
    });

    test('returns complete status when all items checked', async () => {
        const allChecked = {
            ...mockProgress,
            markedItems: mockItems.map((i) => ({ itemId: i._id, isChecked: true })),
        };
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(allChecked),
        });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.progress.isComplete).toBe(true);
        expect(res.body.progress.percentage).toBe(100);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/user-checklists/CHL-NOTFOUND');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});


// GET /api/user-checklists/:checklistId/progress
describe('GET /api/user-checklists/:checklistId/progress', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns progress summary', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProgress),
        });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}/progress`);

        expect(res.statusCode).toBe(200);
        expect(res.body.userId).toBe(USER_ID);
        expect(res.body.checklistId).toBe(CHECKLIST_ID);
        expect(res.body.total).toBe(3);
        expect(res.body.checked).toBe(1);
    });

    test('returns 0 progress when user has no record', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get(`/api/user-checklists/${CHECKLIST_ID}/progress`);

        expect(res.statusCode).toBe(200);
        expect(res.body.checked).toBe(0);
        expect(res.body.percentage).toBe(0);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/user-checklists/CHL-NOTFOUND/progress');

        expect(res.statusCode).toBe(404);
    });
});


// PATCH /api/user-checklists/:checklistId/items/:itemId/toggle
describe('PATCH /api/user-checklists/:checklistId/items/:itemId/toggle', () => {
    beforeEach(() => jest.clearAllMocks());

    test('toggles item from unchecked to checked', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });

        const progressInstance = {
            ...mockProgress,
            markedItems: [
                { itemId: 'ITM-001', isChecked: false }, // will be toggled
                { itemId: 'ITM-002', isChecked: false },
            ],
            save: jest.fn().mockResolvedValue(true),
        };
        // Make find return a mutatable object
        progressInstance.markedItems.find = Array.prototype.find.bind(progressInstance.markedItems);

        UserChecklistProgress.findOne.mockResolvedValue(progressInstance);

        const res = await request(app).patch(
            `/api/user-checklists/${CHECKLIST_ID}/items/ITM-001/toggle`
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.itemId).toBe('ITM-001');
        expect(res.body.isChecked).toBe(true);
        expect(progressInstance.save).toHaveBeenCalled();
    });

    test('toggles item from checked to unchecked', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });

        const progressInstance = {
            markedItems: [{ itemId: 'ITM-001', isChecked: true }],
            save: jest.fn().mockResolvedValue(true),
        };
        progressInstance.markedItems.find = Array.prototype.find.bind(progressInstance.markedItems);

        UserChecklistProgress.findOne.mockResolvedValue(progressInstance);

        const res = await request(app).patch(
            `/api/user-checklists/${CHECKLIST_ID}/items/ITM-001/toggle`
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.isChecked).toBe(false);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).patch(
            `/api/user-checklists/CHL-NOTFOUND/items/ITM-001/toggle`
        );

        expect(res.statusCode).toBe(404);
    });

    test('auto-creates progress when user visits for first time', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockResolvedValue(null);

        const newProgress = {
            markedItems: mockItems.map((i) => ({ itemId: i._id, isChecked: false })),
            save: jest.fn().mockResolvedValue(true),
        };
        newProgress.markedItems.find = Array.prototype.find.bind(newProgress.markedItems);

        UserChecklistProgress.create.mockResolvedValue(newProgress);

        const res = await request(app).patch(
            `/api/user-checklists/${CHECKLIST_ID}/items/ITM-001/toggle`
        );

        expect(res.statusCode).toBe(200);
        expect(UserChecklistProgress.create).toHaveBeenCalled();
    });
});


// PATCH /api/user-checklists/:checklistId/reset
describe('PATCH /api/user-checklists/:checklistId/reset', () => {
    beforeEach(() => jest.clearAllMocks());

    test('resets all items to unchecked', async () => {
        const progressInstance = {
            markedItems: [
                { itemId: 'ITM-001', isChecked: true },
                { itemId: 'ITM-002', isChecked: true },
                { itemId: 'ITM-003', isChecked: false },
            ],
            save: jest.fn().mockResolvedValue(true),
        };
        UserChecklistProgress.findOne.mockResolvedValue(progressInstance);

        const res = await request(app).patch(`/api/user-checklists/${CHECKLIST_ID}/reset`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/unchecked/i);

        // All items should now be unchecked
        progressInstance.markedItems.forEach((item) => {
            expect(item.isChecked).toBe(false);
        });
        expect(progressInstance.save).toHaveBeenCalled();
    });

    test('returns 404 when no progress record found', async () => {
        UserChecklistProgress.findOne.mockResolvedValue(null);

        const res = await request(app).patch(`/api/user-checklists/${CHECKLIST_ID}/reset`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});