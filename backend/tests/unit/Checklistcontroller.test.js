/**
 * UNIT TESTS — checklistController.js
 * Path: tests/unit/checklistController.test.js
 */

jest.mock('../../models/Checklist');
jest.mock('../../models/UserChecklistProgress');

const Checklist = require('../../models/Checklist');
const UserChecklistProgress = require('../../models/UserChecklistProgress');

const {
    getAllChecklists,
    getChecklistById,
    createChecklist,
    adminAddItem,
    adminUpdateItem,
    adminDeleteItem,
    deleteChecklist,
} = require('../../controller/checklistController');

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
const mockReq = (o = {}) => ({
    query: {},
    params: {},
    body: {},
    user: { userId: 'USR-ADMIN-001', role: 'ADMIN' },
    ...o,
});

const mockItem = {
    _id: 'ITM-260219-1001',
    itemName: 'First Aid Kit',
    category: 'medicine',
    quantity: 1,
    note: '',
};

const makeChecklist = (overrides = {}) => ({
    _id: 'CHL-260219-4521',
    title: 'Flood Emergency Checklist',
    disasterType: 'flood',
    isActive: true,
    createdBy: 'USR-ADMIN-001',
    items: [mockItem],
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// getAllChecklists
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getAllChecklists', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns active checklists', async () => {
        const cl = makeChecklist();
        Checklist.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([cl]) });

        const res = mockRes();
        await getAllChecklists(mockReq(), res);

        const body = res.json.mock.calls[0][0];
        expect(body.checklists).toHaveLength(1);
        expect(body.total).toBe(1);
        expect(Checklist.find).toHaveBeenCalledWith({ isActive: true });
    });

    test('returns 500 on DB error', async () => {
        Checklist.find.mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) });

        const res = mockRes();
        await getAllChecklists(mockReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getChecklistById
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getChecklistById', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns checklist by ID', async () => {
        const cl = makeChecklist();
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(cl) });

        const res = mockRes();
        await getChecklistById(mockReq({ params: { checklistId: 'CHL-260219-4521' } }), res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'CHL-260219-4521' }));
    });

    test('returns 404 when not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getChecklistById(mockReq({ params: { checklistId: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// createChecklist
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] createChecklist', () => {
    beforeEach(() => jest.clearAllMocks());

    test('creates checklist and returns 201', async () => {
        const cl = makeChecklist();
        Checklist.create.mockResolvedValue(cl);

        const res = mockRes();
        await createChecklist(mockReq({ body: { title: 'Flood Emergency Checklist', disasterType: 'flood' } }), res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(Checklist.create).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Flood Emergency Checklist',
            createdBy: 'USR-ADMIN-001',
        }));
    });

    test('returns 400 when title missing', async () => {
        const res = mockRes();
        await createChecklist(mockReq({ body: { disasterType: 'flood' } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('defaults disasterType to general', async () => {
        Checklist.create.mockResolvedValue(makeChecklist({ disasterType: 'general' }));

        await createChecklist(mockReq({ body: { title: 'General Checklist' } }), mockRes());

        expect(Checklist.create).toHaveBeenCalledWith(expect.objectContaining({ disasterType: 'general' }));
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// adminAddItem
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] adminAddItem', () => {
    beforeEach(() => jest.clearAllMocks());

    test('adds item to checklist', async () => {
        const pushMock = jest.fn();
        const cl = { ...makeChecklist(), items: { push: pushMock }, save: jest.fn().mockResolvedValue(true) };
        Checklist.findById.mockResolvedValue(cl);

        const res = mockRes();
        await adminAddItem(mockReq({
            params: { checklistId: 'CHL-260219-4521' },
            body: { itemName: 'Water Bottle', category: 'water', quantity: 3 },
        }), res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(pushMock).toHaveBeenCalledWith(expect.objectContaining({ itemName: 'Water Bottle' }));
    });

    test('returns 400 when itemName missing', async () => {
        const res = mockRes();
        await adminAddItem(mockReq({ params: { checklistId: 'CHL-260219-4521' }, body: {} }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = mockRes();
        await adminAddItem(mockReq({ params: { checklistId: 'NOPE' }, body: { itemName: 'X' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('defaults category to other and quantity to 1', async () => {
        const pushMock = jest.fn();
        const cl = { ...makeChecklist(), items: { push: pushMock }, save: jest.fn().mockResolvedValue(true) };
        Checklist.findById.mockResolvedValue(cl);

        await adminAddItem(mockReq({ params: { checklistId: 'CHL-260219-4521' }, body: { itemName: 'Rope' } }), mockRes());

        expect(pushMock).toHaveBeenCalledWith(expect.objectContaining({ category: 'other', quantity: 1 }));
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// adminUpdateItem
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] adminUpdateItem', () => {
    beforeEach(() => jest.clearAllMocks());

    test('updates item fields', async () => {
        const itemMock = { ...mockItem };
        const cl = { ...makeChecklist(), items: { id: jest.fn().mockReturnValue(itemMock) }, save: jest.fn().mockResolvedValue(true) };
        Checklist.findById.mockResolvedValue(cl);

        const res = mockRes();
        await adminUpdateItem(mockReq({
            params: { checklistId: 'CHL-260219-4521', itemId: 'ITM-260219-1001' },
            body: { itemName: 'Advanced First Aid Kit', quantity: 2 },
        }), res);

        expect(itemMock.itemName).toBe('Advanced First Aid Kit');
        expect(itemMock.quantity).toBe(2);
        expect(res.json).toHaveBeenCalled();
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = mockRes();
        await adminUpdateItem(mockReq({ params: { checklistId: 'NOPE', itemId: 'ITM-001' }, body: {} }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 404 when item not found in checklist', async () => {
        const cl = { ...makeChecklist(), items: { id: jest.fn().mockReturnValue(null) }, save: jest.fn() };
        Checklist.findById.mockResolvedValue(cl);

        const res = mockRes();
        await adminUpdateItem(mockReq({ params: { checklistId: 'CHL-260219-4521', itemId: 'NOPE' }, body: {} }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// adminDeleteItem
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] adminDeleteItem', () => {
    beforeEach(() => jest.clearAllMocks());

    test('removes item from checklist', async () => {
        const pullMock = jest.fn();
        const cl = {
            ...makeChecklist(),
            items: { id: jest.fn().mockReturnValue(mockItem), pull: pullMock },
            save: jest.fn().mockResolvedValue(true),
        };
        Checklist.findById.mockResolvedValue(cl);

        const res = mockRes();
        await adminDeleteItem(mockReq({ params: { checklistId: 'CHL-260219-4521', itemId: 'ITM-260219-1001' } }), res);

        expect(pullMock).toHaveBeenCalledWith('ITM-260219-1001');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Item deleted' }));
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = mockRes();
        await adminDeleteItem(mockReq({ params: { checklistId: 'NOPE', itemId: 'ITM-001' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 404 when item not found', async () => {
        const cl = { ...makeChecklist(), items: { id: jest.fn().mockReturnValue(null) }, save: jest.fn() };
        Checklist.findById.mockResolvedValue(cl);

        const res = mockRes();
        await adminDeleteItem(mockReq({ params: { checklistId: 'CHL-260219-4521', itemId: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// deleteChecklist (soft delete)
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] deleteChecklist', () => {
    beforeEach(() => jest.clearAllMocks());

    test('sets isActive=false (soft delete)', async () => {
        const cl = makeChecklist({ isActive: true });
        Checklist.findById.mockResolvedValue(cl);

        const res = mockRes();
        await deleteChecklist(mockReq({ params: { checklistId: 'CHL-260219-4521' } }), res);

        expect(cl.isActive).toBe(false);
        expect(cl.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Checklist deleted successfully' }));
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockResolvedValue(null);

        const res = mockRes();
        await deleteChecklist(mockReq({ params: { checklistId: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});