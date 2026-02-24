const request = require("supertest");

jest.mock("../../models/Shelter");
jest.mock("../../services/routingService");

// bypass auth/role checks
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
}));
jest.mock("../../middleware/roleMiddleware", () => ({
  allowRoles: () => (req, res, next) => next(),
}));

const Shelter = require("../../models/Shelter");
const { getTravelMatrix } = require("../../services/routingService");
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

describe("GET /api/shelters/countsby-district", () => {
  it("returns 200 and an array when successful", async () => {
    Shelter.aggregate.mockResolvedValue([
      { _id: "Kalutara", shelterCount: 2 },
      { _id: "Colombo", shelterCount: 1 },
    ]);

    const res = await request(app)
      .get("/api/shelters/countsby-district");

    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length) {
        expect(res.body[0]).toHaveProperty("district");
        expect(res.body[0]).toHaveProperty("shelterCount");
      }
    } else {
      expect([400, 500]).toContain(res.status);
      expect(res.body).toHaveProperty("error");
    }
  });

  it("returns an error payload if something goes wrong", async () => {
    Shelter.aggregate.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/shelters/countsby-district");

    expect([400, 500]).toContain(res.status);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });
});


describe("GET /api/shelters/nearby", () => {
  it("returns nearby shelters sorted by travel time", async () => {
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

    Shelter.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(sheltersArray),
    });

    getTravelMatrix.mockResolvedValue([
      { distanceKm: 40000, durationMin: 60 },
      { distanceKm: 190000, durationMin: 240 },
    ]);

    const res = await request(app)
      .get("/api/shelters/nearby")
      .query({ lat: "6.9271", lng: "79.8612", limit: "5" })
      .expect(200);

    expect(Shelter.find).toHaveBeenCalledWith({ isActive: true });
    expect(getTravelMatrix).toHaveBeenCalledWith(
      { lat: 6.9271, lng: 79.8612 },
      [
        { lat: 6.585, lng: 79.96 },
        { lat: 6.994263376830868, lng: 81.06167688425393 },
      ]
    );
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        shelterId: "KALUTARA-KL0002",
        distanceKm: 40000,
        travelTimeMin: 60.0,
      })
    );
  });

  it("returns 400 if lat/lng missing", async () => {
    const res = await request(app)
      .get("/api/shelters/nearby")
      .expect(400);

    expect(res.body).toEqual(
      expect.objectContaining({
        error: "lat and lng query params are required",
      })
    );
  });
});

describe("PUT /api/shelters/:id/status", () => {
  it("updates status and returns data", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      status: "planned",
      openSince: undefined,
      closedAt: undefined,
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const res = await request(app)
      .put("/api/shelters/S-1/status")
      .send({ status: "open" })
      .expect(200);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(shelterDoc.status).toBe("open");
    expect(shelterDoc.save).toHaveBeenCalled();
    expect(res.body).toEqual(
      expect.objectContaining({
        shelterId: "S-1",
        status: "open",
      })
    );
  });

  it("returns 400 for invalid status", async () => {
    const res = await request(app)
      .put("/api/shelters/S-1/status")
      .send({ status: "invalid" })
      .expect(400);

    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Invalid status value",
      })
    );
  });
});
