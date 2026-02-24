/**
 * UNIT TESTS — userChecklistController.js
 * Path: tests/unit/userChecklistController.test.js
 */

jest.mock('../../models/Checklist');
jest.mock('../../models/UserChecklistProgress');

const Checklist             = require('../../models/Checklist');
const UserChecklistProgress = require('../../models/UserChecklistProgress');

const {
    getMyChecklist,
    toggleItem,
    resetProgress,
    getProgress,
} = require('../../controller/userChecklistController');

// ── Helpers ────────────────────────────────────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
};
const mockReq = (o = {}) => ({
    query:  {},
    params: {},
    body:   {},
    user:   { userId: 'USR-TEST-001' },
    ...o,
});

const CHECKLIST_ID = 'CHL-260219-4521';
const USER_ID      = 'USR-TEST-001';

const mockItems = [
    { _id: 'ITM-001', itemName: 'Water',         category: 'water',    quantity: 2, note: '' },
    { _id: 'ITM-002', itemName: 'First Aid Kit',  category: 'medicine', quantity: 1, note: '' },
    { _id: 'ITM-003', itemName: 'Torch',          category: 'tools',    quantity: 1, note: '' },
];

const mockChecklist = {
    _id:         CHECKLIST_ID,
    title:       'Flood Checklist',
    disasterType:'flood',
    isActive:    true,
    items:       mockItems,
};

const makeProgress = (checkedMap = {}) => ({
    userId:      USER_ID,
    checklistId: CHECKLIST_ID,
    markedItems: mockItems.map(i => ({
        itemId:    i._id,
        isChecked: checkedMap[i._id] || false,
    })),
    save: jest.fn().mockResolvedValue(true),
});

// ══════════════════════════════════════════════════════════════════════════════
// getMyChecklist
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getMyChecklist', () => {
    beforeEach(() => jest.clearAllMocks());

    test('merges admin items with user checked status', async () => {
        const progress = makeProgress({ 'ITM-001': true });
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(progress) });

        const res = mockRes();
        await getMyChecklist(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.items).toHaveLength(3);
        expect(body.items.find(i => i._id === 'ITM-001').isChecked).toBe(true);
        expect(body.items.find(i => i._id === 'ITM-002').isChecked).toBe(false);
    });

    test('calculates correct progress percentage', async () => {
        const progress = makeProgress({ 'ITM-001': true, 'ITM-002': true });
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(progress) });

        const res = mockRes();
        await getMyChecklist(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.progress.checked).toBe(2);
        expect(body.progress.total).toBe(3);
        expect(body.progress.percentage).toBeCloseTo(66.67, 1);
        expect(body.progress.isComplete).toBe(false);
    });

    test('isComplete is true when all items checked', async () => {
        const progress = makeProgress({ 'ITM-001': true, 'ITM-002': true, 'ITM-003': true });
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(progress) });

        const res = mockRes();
        await getMyChecklist(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.progress.isComplete).toBe(true);
        expect(body.progress.percentage).toBe(100);
    });

    test('auto-creates progress record on first visit', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        const newProgress = makeProgress();
        UserChecklistProgress.create.mockResolvedValue(newProgress);

        const res = mockRes();
        await getMyChecklist(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);

        expect(UserChecklistProgress.create).toHaveBeenCalledWith(expect.objectContaining({
            userId:      USER_ID,
            checklistId: CHECKLIST_ID,
        }));
        expect(res.json).toHaveBeenCalled();
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getMyChecklist(mockReq({ params: { checklistId: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// toggleItem
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] toggleItem', () => {
    beforeEach(() => jest.clearAllMocks());

    const makeProgressMutable = (checkedMap = {}) => {
        const items = mockItems.map(i => ({ itemId: i._id, isChecked: checkedMap[i._id] || false }));
        return {
            userId:      USER_ID,
            checklistId: CHECKLIST_ID,
            markedItems: items,
            save:        jest.fn().mockResolvedValue(true),
        };
    };

    test('toggles unchecked item to checked', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        const progress = makeProgressMutable({});
        UserChecklistProgress.findOne.mockResolvedValue(progress);

        const res = mockRes();
        await toggleItem(mockReq({ params: { checklistId: CHECKLIST_ID, itemId: 'ITM-001' } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.isChecked).toBe(true);
        expect(progress.save).toHaveBeenCalled();
    });

    test('toggles checked item to unchecked', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        const progress = makeProgressMutable({ 'ITM-001': true });
        UserChecklistProgress.findOne.mockResolvedValue(progress);

        const res = mockRes();
        await toggleItem(mockReq({ params: { checklistId: CHECKLIST_ID, itemId: 'ITM-001' } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.isChecked).toBe(false);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await toggleItem(mockReq({ params: { checklistId: 'NOPE', itemId: 'ITM-001' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 404 when item not in checklist', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });

        const res = mockRes();
        await toggleItem(mockReq({ params: { checklistId: CHECKLIST_ID, itemId: 'ITM-NOTEXIST' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('auto-creates progress when user has no record yet', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockResolvedValue(null);

        const newProgress = makeProgressMutable();
        UserChecklistProgress.create.mockResolvedValue(newProgress);

        const res = mockRes();
        await toggleItem(mockReq({ params: { checklistId: CHECKLIST_ID, itemId: 'ITM-001' } }), res);

        expect(UserChecklistProgress.create).toHaveBeenCalled();
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// resetProgress
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] resetProgress', () => {
    beforeEach(() => jest.clearAllMocks());

    test('unchecks all items and saves', async () => {
        const progress = {
            markedItems: [
                { itemId: 'ITM-001', isChecked: true  },
                { itemId: 'ITM-002', isChecked: true  },
                { itemId: 'ITM-003', isChecked: false },
            ],
            save: jest.fn().mockResolvedValue(true),
        };
        UserChecklistProgress.findOne.mockResolvedValue(progress);

        const res = mockRes();
        await resetProgress(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);

        progress.markedItems.forEach(item => expect(item.isChecked).toBe(false));
        expect(progress.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    test('returns 404 when no progress record found', async () => {
        UserChecklistProgress.findOne.mockResolvedValue(null);

        const res = mockRes();
        await resetProgress(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// getProgress
// ══════════════════════════════════════════════════════════════════════════════
describe('[UNIT] getProgress', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns progress summary with correct percentages', async () => {
        const progress = { markedItems: [
            { itemId: 'ITM-001', isChecked: true  },
            { itemId: 'ITM-002', isChecked: false },
            { itemId: 'ITM-003', isChecked: false },
        ]};
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(progress) });

        const res = mockRes();
        await getProgress(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.total).toBe(3);
        expect(body.checked).toBe(1);
        expect(body.unchecked).toBe(2);
        expect(body.percentage).toBeCloseTo(33.33, 1);
        expect(body.isComplete).toBe(false);
    });

    test('returns 0 progress when no record exists', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChecklist) });
        UserChecklistProgress.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getProgress(mockReq({ params: { checklistId: CHECKLIST_ID } }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.checked).toBe(0);
        expect(body.percentage).toBe(0);
    });

    test('returns 404 when checklist not found', async () => {
        Checklist.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

        const res = mockRes();
        await getProgress(mockReq({ params: { checklistId: 'NOPE' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});