// tests/unit/shelterController.test.js

jest.mock('../../models/Shelter');
jest.mock('../../models/ShelterCounter');

// Mock the routingService module
jest.mock("../../services/routingService", () => ({
  getTravelMatrix: jest.fn(),
}))

const Shelter = require('../../models/Shelter');
const ShelterCounter = require('../../models/ShelterCounter');
const shelterController = require('../../controller/shelterController');
const { getTravelMatrix } = require("../../services/routingService");
const { mockRequest, mockResponse } = require('./testUtils/mockExpress');

// common beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});

// silence controller logs during tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});


// helper to mock counter.increment
const makeCounterLean = (seqValue) => ({
  lean: jest.fn().mockResolvedValue({ key: 'KALUTARA-KL', seq: seqValue }),
});

// ============= getAllShelters =============
describe('getAllShelters', () => {
  it('should return all shelters with 200', async () => {
    const sheltersArray = [
      {
        _id: '1',
        shelterId: 'KALUTARA-KL0001',
        name: 'Shelter 1',
        description: 'Description 1',
        address: 'Address 1',
        district: 'Kalutara',
        capacityTotal: 100,
        capacityCurrent: 50,
        reliefItems: ['water'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    Shelter.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(sheltersArray),
    });

    const req = mockRequest();
    const res = mockResponse();

    await shelterController.getAllShelters(req, res);

    // just ensure it was called
    expect(Shelter.find).toHaveBeenCalled();          // <-- CHANGE HERE
    expect(res.json).toHaveBeenCalledWith(sheltersArray);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 500 if there is an error', async () => {
    Shelter.find.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const req = mockRequest();
    const res = mockResponse();

    await shelterController.getAllShelters(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to fetch shelters',
      })
    );
  });
});

// ============= getShelterById =============
describe('getShelterById', () => {
  it('should return shelter when found', async () => {
    const fakeShelter = { _id: '123', shelterId: 'S-001', name: 'Test' };

    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeShelter),
    });

    const req = mockRequest({}, { id: 'S-001' });
    const res = mockResponse();

    await shelterController.getShelterById(req, res);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: 'S-001' });
    expect(res.json).toHaveBeenCalledWith(fakeShelter);
  });

  it('should return 404 when shelter not found', async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { id: 'not-exist' });
    const res = mockResponse();

    await shelterController.getShelterById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: '❌ Shelter not found' })
    );
  });

  it('should return 400 on error', async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('CastError')),
    });

    const req = mockRequest({}, { id: 'bad-id' });
    const res = mockResponse();

    await shelterController.getShelterById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid shelter ID' })
    );
  });
});

// ============= createShelter =============
describe('createShelter', () => {
  it('should return 400 if district missing', async () => {
    const body = { name: 'Shelter A', address: 'X' }; // no district
    const req = mockRequest(body);
    const res = mockResponse();

    await shelterController.createShelter(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'District is required to generate shelterId',
      })
    );
    expect(ShelterCounter.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Shelter.create).not.toHaveBeenCalled();
  });

  it('should create shelter and return 201', async () => {
    const body = {
      name: 'Shelter A',
      address: 'X',
      district: 'Kalutara',
      lat: 6.5,
      lng: 80.1,
      capacityTotal: 100,
    };

    // mock counter increment
    ShelterCounter.findOneAndUpdate.mockReturnValue(
      makeCounterLean(1) // seq = 1
    );

    const createdShelter = {
      _id: '111',
      shelterId: 'KALUTARA-KL0001',
      ...body,
    };

    Shelter.create.mockResolvedValue(createdShelter);

    const req = mockRequest(body);
    const res = mockResponse();

    await shelterController.createShelter(req, res);

    expect(ShelterCounter.findOneAndUpdate).toHaveBeenCalledWith(
      { key: 'KALUTARA-KL' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // controller spreads req.body and adds generated shelterId
    expect(Shelter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        shelterId: 'KALUTARA-KL0001',
        name: 'Shelter A',
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdShelter);
  });

  it('should handle create error with 400', async () => {
    const body = {
      name: 'Shelter A',
      address: 'X',
      district: 'Kalutara',
      lat: 6.5,
      lng: 80.1,
      capacityTotal: 100,
    };

    ShelterCounter.findOneAndUpdate.mockReturnValue(
      makeCounterLean(1)
    );

    Shelter.create.mockRejectedValue(new Error('Validation failed'));

    const req = mockRequest(body);
    const res = mockResponse();

    await shelterController.createShelter(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Failed to create shelter' })
    );
  });
});

// ============= updateShelterItem =============
describe('updateShelterItem', () => {
  it('should return 400 if name missing', async () => {
    const req = mockRequest({}, { id: '1' });
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Item name is required' })
    );
  });

  it('should return 404 if shelter not found', async () => {
    Shelter.findOne = jest.fn().mockResolvedValue(null);

    const req = mockRequest({ name: 'Rice' }, { id: 'S-1' });
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: 'S-1' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: '❌ Shelter not found' })
    );
  });

  it('should update existing item', async () => {
    const existingShelter = {
      _id: 's1',
      shelterId: 'S-1',
      reliefItems: [
        { name: 'Rice', quantity: 10, category: 'food', unit: 'kg' },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne = jest.fn().mockResolvedValue(existingShelter);

    const req = mockRequest(
      { name: 'Rice', quantity: 20 },
      { id: 'S-1' }
    );
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: 'S-1' });
    expect(existingShelter.reliefItems[0].quantity).toBe(20);
    expect(existingShelter.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(existingShelter);
  });

  it('should add new item when not exists', async () => {
    const existingShelter = {
      _id: 's1',
      shelterId: 'S-1',
      reliefItems: [],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne = jest.fn().mockResolvedValue(existingShelter);

    const req = mockRequest(
      { name: 'Water', quantity: 5, unit: 'liters' },
      { id: 'S-1' }
    );
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: 'S-1' });
    expect(existingShelter.reliefItems.length).toBe(1);
    expect(existingShelter.reliefItems[0].name).toBe('Water');
    expect(existingShelter.reliefItems[0].quantity).toBe(5);
    expect(existingShelter.reliefItems[0].unit).toBe('liters');
    expect(existingShelter.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(existingShelter);
  });

  it('should handle error with 400', async () => {
    Shelter.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

    const req = mockRequest(
      { name: 'Rice', quantity: 20 },
      { id: 'S-1' }
    );
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to update shelter item',
      })
    );
  });
});

// ============= getNearbyShelters =============
describe("getNearbyShelters", () => {
  it("should return shelters with distance and time sorted by travelTime", async () => {
    // mock shelters in DB
    const sheltersArray = [
      {
        _id: "1",
        shelterId: "KALUTARA-KL0002",
        name: "Kalutara Main Evacuation Shelter",
        district: "Kalutara",
        lat: 6.585,
        lng: 79.96,
        capacityTotal: 500,
        capacityCurrent: 120,
        isActive: true,
      },
      {
        _id: "2",
        shelterId: "BADULLA-BD0001",
        name: "Badulla Main Evacuation Shelter",
        district: "Badulla",
        lat: 6.994263376830868,
        lng: 81.06167688425393,
        capacityTotal: 300,
        capacityCurrent: 0,
        isActive: true,
      },
    ];

    // Shelter.find({ isActive: true }).lean()
    Shelter.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(sheltersArray),
    });

    // mock getTravelMatrix return distances/durations (Kalutara closer than Badulla)
    getTravelMatrix.mockResolvedValue([
      { distanceKm: 40_000, durationMin: 60 },  // Kalutara
      { distanceKm: 190_000, durationMin: 240 }, // Badulla
    ]);

    const req = mockRequest(
      {}, // body
      {}, // params
      { lat: "6.9271", lng: "79.8612", limit: "5" } // query
    );
    const res = mockResponse();

    await shelterController.getNearbyShelters(req, res);

    expect(Shelter.find).toHaveBeenCalledWith({ isActive: true });
    expect(getTravelMatrix).toHaveBeenCalledWith(
      { lat: 6.9271, lng: 79.8612 },
      [
        { lat: 6.585, lng: 79.96 },
        { lat: 6.994263376830868, lng: 81.06167688425393 },
      ]
    );

    // response check
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        shelterId: "KALUTARA-KL0002",
        distanceKm: 40_000,
        travelTimeMin: 60.0,
      }),
      expect.objectContaining({
        shelterId: "BADULLA-BD0001",
        distanceKm: 190_000,
        travelTimeMin: 240.0,
      }),
    ]);
  });

  it("should return 400 if lat/lng missing", async () => {
    const req = mockRequest(); // no query
    const res = mockResponse();

    await shelterController.getNearbyShelters(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "lat and lng query params are required",
      })
    );
  });

  it("should return [] when no active shelters", async () => {
    Shelter.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });

    const req = mockRequest({}, {}, { lat: "6.9", lng: "79.8" });
    const res = mockResponse();

    await shelterController.getNearbyShelters(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });
});
