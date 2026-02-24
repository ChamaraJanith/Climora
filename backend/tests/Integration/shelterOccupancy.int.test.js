const request = require("supertest");

jest.mock("../../models/Shelter");
jest.mock("../../models/ShelterOccupancy");
// Optionally mock auth/role middlewares to always allow:
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
}));
jest.mock("../../middleware/roleMiddleware", () => ({
  allowRoles: () => (req, res, next) => next(),
}));

const Shelter = require("../../models/Shelter");
const ShelterOccupancy = require("../../models/ShelterOccupancy");
const { createTestApp } = require("../utils/testApp");

let app;

beforeAll(() => {
  app = createTestApp();
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});

describe("POST /api/shelters/:id/occupancy", () => {
  it("creates snapshot via route and returns 201", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ shelterId: "S-1", capacityTotal: 100 }),
    });

    const saveMock = jest.fn().mockResolvedValue(true);
    ShelterOccupancy.mockImplementation((data) => ({
      ...data,
      save: saveMock,
    }));

    const res = await request(app)
      .post("/api/shelters/S-1/occupancy")
      .send({
        capacityTotal: 100,
        currentOccupancy: 50,
        safeThresholdPercent: 90,
        childrenCount: 10,
        elderlyCount: 5,
        specialNeedsCount: 2,
        recordedBy: "admin",
      })
      .expect(201);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(ShelterOccupancy).toHaveBeenCalledWith(
      expect.objectContaining({
        shelterId: "S-1",
        capacityTotal: 100,
        currentOccupancy: 50,
      })
    );
    expect(saveMock).toHaveBeenCalled();
    expect(res.body).toEqual(
      expect.objectContaining({
        message: "Shelter occupancy snapshot created",
      })
    );
  });
});

describe("GET /api/shelters/:id/occupancy", () => {
  it("returns latest occupancy via route", async () => {
    const doc = { shelterId: "S-1", currentOccupancy: 40 };

    ShelterOccupancy.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(doc),
      }),
    });

    const res = await request(app)
      .get("/api/shelters/S-1/occupancy")
      .expect(200);

    expect(ShelterOccupancy.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(res.body).toEqual(doc);
  });
});

describe("PUT /api/shelters/:id/occupancy/current", () => {
  it("updates current occupancy via route", async () => {
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

    const res = await request(app)
      .put("/api/shelters/S-1/occupancy/current")
      .send({ currentOccupancy: 80 })
      .expect(200);

    expect(existingDoc.currentOccupancy).toBe(80);
    expect(existingDoc.save).toHaveBeenCalled();
    expect(res.body).toEqual(
      expect.objectContaining({
        shelterId: "S-1",
        currentOccupancy: 80,
        isOverCapacity: expect.any(Boolean),
      })
    );
  });
});
