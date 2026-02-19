const request = require('supertest');
const express = require('express');

jest.mock('../../models/Checklist');
jest.mock('../../models/UserChecklistProgress');

const Checklist = require('../../models/Checklist');

jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, _res, next) => {
        req.user = { userId: 'USR-ADMIN-001', role: 'admin' };
        next();
    },
    adminOnly: (_req, _res, next) => next(),
}));

const checklistRouter = require('../../routes/checklistRoutes');

const app = express();
app.use(express.json());
app.use('/api/checklists', checklistRouter);

// ── Shared mock data ─────────────────────────────────────────────────────────
const mockItem = {
    _id: 'ITM-260219-1001',
    itemName: 'First Aid Kit',
    category: 'medicine',
    quantity: 1,
    note: 'Keep in accessible place',
};

const mockChecklist = {
    _id: 'CHL-260219-4521',
    title: 'Flood Emergency Checklist',
    disasterType: 'flood',
    isActive: true,
    createdBy: 'USR-ADMIN-001',
    items: [mockItem],
    save: jest.fn().mockResolvedValue(true),
};

// GET /api/checklists
describe('GET /api/checklists', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns all active checklists', async () => {
        Checklist.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([mockChecklist]) });

        const res = await request(app).get('/api/checklists');

        expect(res.statusCode).toBe(200);
        expect(res.body.checklists).toHaveLength(1);
        expect(res.body.total).toBe(1);
        expect(res.body.checklists[0]._id).toBe('CHL-260219-4521');
    });

    test('returns empty array when no checklists exist', async () => {
        Checklist.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

        const res = await request(app).get('/api/checklists');

        expect(res.statusCode).toBe(200);
        expect(res.body.checklists).toHaveLength(0);
        expect(res.body.total).toBe(0);
    });

    test('returns 500 on database error', async () => {
        Checklist.find.mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
        });

        const res = await request(app).get('/api/checklists');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});


// GET /api/checklists/:checklistId
describe('GET /api/checklists/:checklistId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns single checklist by ID', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });

        const res = await request(app).get('/api/checklists/CHL-260219-4521');

        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe('CHL-260219-4521');
        expect(res.body.title).toBe('Flood Emergency Checklist');
        expect(res.body.items).toHaveLength(1);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = await request(app).get('/api/checklists/CHL-NOTFOUND');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});


// POST /api/checklists  (admin only)
describe('POST /api/checklists', () => {
    beforeEach(() => jest.clearAllMocks());

    test('creates checklist with valid data', async () => {
        Checklist.create.mockResolvedValue(mockChecklist);

        const res = await request(app).post('/api/checklists').send({
            title: 'Flood Emergency Checklist',
            disasterType: 'flood',
            items: [],
        });

        expect(res.statusCode).toBe(201);
        expect(res.body._id).toBe('CHL-260219-4521');
        expect(Checklist.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Flood Emergency Checklist',
                createdBy: 'USR-ADMIN-001',
            })
        );
    });

    test('returns 400 when title is missing', async () => {
        const res = await request(app).post('/api/checklists').send({
            disasterType: 'flood',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test('defaults disasterType to general when not provided', async () => {
        Checklist.create.mockResolvedValue({ ...mockChecklist, disasterType: 'general' });

        const res = await request(app).post('/api/checklists').send({
            title: 'General Emergency Checklist',
        });

        expect(res.statusCode).toBe(201);
        expect(Checklist.create).toHaveBeenCalledWith(
            expect.objectContaining({ disasterType: 'general' })
        );
    });
});


// POST /api/checklists/:checklistId/items  (admin only)
describe('POST /api/checklists/:checklistId/items', () => {
    beforeEach(() => jest.clearAllMocks());

    test('adds item to checklist', async () => {
        const checklistInstance = {
            ...mockChecklist,
            items: { push: jest.fn() },
            save: jest.fn().mockResolvedValue(true),
        };
        Checklist.findById.mockResolvedValue(checklistInstance);

        const res = await request(app)
            .post('/api/checklists/CHL-260219-4521/items')
            .send({ itemName: 'Water Bottle', category: 'water', quantity: 5 });

        expect(res.statusCode).toBe(201);
        expect(checklistInstance.items.push).toHaveBeenCalledWith(
            expect.objectContaining({ itemName: 'Water Bottle' })
        );
    });

    test('returns 400 when itemName is missing', async () => {
        const res = await request(app)
            .post('/api/checklists/CHL-260219-4521/items')
            .send({ category: 'water' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/item name/i);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/checklists/CHL-NOTFOUND/items')
            .send({ itemName: 'First Aid Kit' });

        expect(res.statusCode).toBe(404);
    });
});


// PUT /api/checklists/:checklistId/items/:itemId  (admin only)
describe('PUT /api/checklists/:checklistId/items/:itemId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('updates existing item', async () => {
        const itemMock = { ...mockItem };
        const checklistInstance = {
            ...mockChecklist,
            items: { id: jest.fn().mockReturnValue(itemMock) },
            save: jest.fn().mockResolvedValue(true),
        };
        Checklist.findById.mockResolvedValue(checklistInstance);

        const res = await request(app)
            .put('/api/checklists/CHL-260219-4521/items/ITM-260219-1001')
            .send({ itemName: 'Updated First Aid Kit', quantity: 2 });

        expect(res.statusCode).toBe(200);
        expect(itemMock.itemName).toBe('Updated First Aid Kit');
        expect(itemMock.quantity).toBe(2);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = await request(app)
            .put('/api/checklists/CHL-NOTFOUND/items/ITM-001')
            .send({ itemName: 'Updated' });

        expect(res.statusCode).toBe(404);
    });

    test('returns 404 when item not found in checklist', async () => {
        const checklistInstance = {
            ...mockChecklist,
            items: { id: jest.fn().mockReturnValue(null) },
            save: jest.fn(),
        };
        Checklist.findById.mockResolvedValue(checklistInstance);

        const res = await request(app)
            .put('/api/checklists/CHL-260219-4521/items/ITM-NOTFOUND')
            .send({ itemName: 'Updated' });

        expect(res.statusCode).toBe(404);
    });
});

// DELETE /api/checklists/:checklistId/items/:itemId  (admin only)
describe('DELETE /api/checklists/:checklistId/items/:itemId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('deletes item from checklist', async () => {
        const checklistInstance = {
            ...mockChecklist,
            items: {
                id: jest.fn().mockReturnValue(mockItem),
                pull: jest.fn(),
            },
            save: jest.fn().mockResolvedValue(true),
        };
        Checklist.findById.mockResolvedValue(checklistInstance);

        const res = await request(app).delete(
            '/api/checklists/CHL-260219-4521/items/ITM-260219-1001'
        );

        expect(res.statusCode).toBe(200);
        expect(checklistInstance.items.pull).toHaveBeenCalledWith('ITM-260219-1001');
        expect(res.body.message).toMatch(/deleted/i);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = await request(app).delete('/api/checklists/CHL-NOTFOUND/items/ITM-001');

        expect(res.statusCode).toBe(404);
    });
});


// DELETE /api/checklists/:checklistId  (admin only — soft delete)
describe('DELETE /api/checklists/:checklistId', () => {
    beforeEach(() => jest.clearAllMocks());

    test('soft-deletes checklist by setting isActive = false', async () => {
        const checklistInstance = { ...mockChecklist, isActive: true, save: jest.fn() };
        Checklist.findById.mockResolvedValue(checklistInstance);

        const res = await request(app).delete('/api/checklists/CHL-260219-4521');

        expect(res.statusCode).toBe(200);
        expect(checklistInstance.isActive).toBe(false);
        expect(checklistInstance.save).toHaveBeenCalled();
        expect(res.body.message).toMatch(/deleted/i);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = await request(app).delete('/api/checklists/CHL-NOTFOUND');

        expect(res.statusCode).toBe(404);
    });
});