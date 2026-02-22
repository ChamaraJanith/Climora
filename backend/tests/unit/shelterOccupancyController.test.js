// tests/unit/shelterOccupancyController.test.js

jest.mock("../../models/Shelter");
jest.mock("../../models/ShelterOccupancy");

const Shelter = require("../../models/Shelter");
const ShelterOccupancy = require("../../models/ShelterOccupancy");
const {
  getShelterOccupancyHistory,
  createShelterOccupancy,
  getLatestShelterOccupancy,
  updateCurrentOccupancy,
} = require("../../controller/shelterOccupancyController");

const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

beforeEach(() => {
  jest.clearAllMocks();
});

// mute logs
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});

describe("createShelterOccupancy", () => {
  it("returns 404 if shelter not found", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await createShelterOccupancy(req, res);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Shelter not found" })
    );
  });

  it("creates snapshot and returns 201", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ shelterId: "S-1" }),
    });

    const saveMock = jest.fn().mockResolvedValue(true);
    ShelterOccupancy.mockImplementation((data) => ({
      ...data,
      save: saveMock,
    }));

    const body = {
      capacityTotal: 100,
      currentOccupancy: 50,
      safeThresholdPercent: 90,
      childrenCount: 10,
      elderlyCount: 5,
      specialNeedsCount: 2,
      recordedBy: "admin",
    };

    const req = mockRequest(body, { id: "S-1" });
    const res = mockResponse();

    await createShelterOccupancy(req, res);

    expect(ShelterOccupancy).toHaveBeenCalledWith(
      expect.objectContaining({
        shelterId: "S-1",
        capacityTotal: 100,
        currentOccupancy: 50,
      })
    );
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Shelter occupancy snapshot created",
      })
    );
  });

  it("handles error with 400", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await createShelterOccupancy(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to create shelter occupancy",
      })
    );
  });
});

describe("getLatestShelterOccupancy", () => {
  it("returns 404 if no occupancy", async () => {
    ShelterOccupancy.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await getLatestShelterOccupancy(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "No occupancy data for this shelter",
      })
    );
  });

  it("returns latest occupancy", async () => {
    const doc = { shelterId: "S-1", currentOccupancy: 40 };

    ShelterOccupancy.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(doc),
      }),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await getLatestShelterOccupancy(req, res);

    expect(ShelterOccupancy.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(res.json).toHaveBeenCalledWith(doc);
  });

  it("handles error with 400", async () => {
    ShelterOccupancy.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await getLatestShelterOccupancy(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to fetch latest shelter occupancy",
      })
    );
  });
});

describe("getShelterOccupancyHistory", () => {
  it("returns history without filters", async () => {
    const history = [{ shelterId: "S-1", currentOccupancy: 10 }];

    ShelterOccupancy.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(history),
      }),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await getShelterOccupancyHistory(req, res);

    expect(ShelterOccupancy.find).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(res.json).toHaveBeenCalledWith(history);
  });

  it("applies from/to filters", async () => {
    const history = [{ shelterId: "S-1", currentOccupancy: 10 }];

    const findMock = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(history),
      }),
    });
    ShelterOccupancy.find = findMock;

    const req = mockRequest(
      {},
      { id: "S-1" },
      { from: "2024-01-01", to: "2024-01-31" }
    );
    const res = mockResponse();

    await getShelterOccupancyHistory(req, res);

    expect(findMock).toHaveBeenCalledWith(
      expect.objectContaining({ shelterId: "S-1", recordedAt: expect.any(Object) })
    );
    expect(res.json).toHaveBeenCalledWith(history);
  });

  it("handles error with 400", async () => {
    ShelterOccupancy.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await getShelterOccupancyHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to fetch shelter occupancy history",
      })
    );
  });
});

describe("updateCurrentOccupancy", () => {
  it("returns 400 if currentOccupancy missing", async () => {
    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await updateCurrentOccupancy(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "currentOccupancy is required",
      })
    );
  });

  it("returns 404 if shelter not found", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ currentOccupancy: 50 }, { id: "S-1" });
    const res = mockResponse();

    await updateCurrentOccupancy(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Shelter not found" })
    );
  });

  it("creates new snapshot when none exists", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        shelterId: "S-1",
        capacityTotal: 100,
      }),
    });

    const saveMock = jest.fn().mockResolvedValue(true);

    const findOneChainMock = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });

    ShelterOccupancy.findOne = findOneChainMock;

    ShelterOccupancy.mockImplementation((data) => ({
      ...data,
      save: saveMock,
    }));

    const req = mockRequest({ currentOccupancy: 40 }, { id: "S-1" });
    const res = mockResponse();

    await updateCurrentOccupancy(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        shelterId: "S-1",
        currentOccupancy: 40,
        capacityTotal: expect.any(Number),
        isOverCapacity: expect.any(Boolean),
      })
    );
  });

  it("updates existing snapshot", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        shelterId: "S-1",
        capacityTotal: 100,
      }),
    });

    const existingDoc = {
      shelterId: "S-1",
      capacityTotal: 100,
      currentOccupancy: 20,
      safeThresholdPercent: 90,
      childrenCount: 0,
      elderlyCount: 0,
      specialNeedsCount: 0,
      recordedBy: "system",
      save: jest.fn().mockResolvedValue(true),
    };

    ShelterOccupancy.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(existingDoc),
    });

    const req = mockRequest({ currentOccupancy: 80 }, { id: "S-1" });
    const res = mockResponse();

    await updateCurrentOccupancy(req, res);

    expect(existingDoc.currentOccupancy).toBe(80);
    expect(existingDoc.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        shelterId: "S-1",
        currentOccupancy: 80,
      })
    );
  });

  it("handles error with 400", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockRequest({ currentOccupancy: 10 }, { id: "S-1" });
    const res = mockResponse();

    await updateCurrentOccupancy(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to update current occupancy",
      })
    );
  });
});
