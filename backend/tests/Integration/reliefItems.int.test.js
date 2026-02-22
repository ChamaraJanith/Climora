// tests/integration/reliefItems.int.test.js

const request = require("supertest");

jest.mock("../../models/Shelter");

// bypass auth/role checks
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
}));
jest.mock("../../middleware/roleMiddleware", () => ({
  allowRoles: () => (req, res, next) => next(),
}));

const Shelter = require("../../models/Shelter");
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

describe("GET /api/shelters/:id/items", () => {
  it("returns items for a shelter", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      name: "Shelter 1",
      district: "Kalutara",
      reliefItems: [{ name: "Rice", quantity: 10 }],
    };

    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(shelterDoc),
    });

    const res = await request(app)
      .get("/api/shelters/S-1/items")
      .expect(200);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(res.body).toEqual(
      expect.objectContaining({
        shelterId: "S-1",
        shelterName: "Shelter 1",
        district: "Kalutara",
        reliefItems: shelterDoc.reliefItems,
      })
    );
  });

  it("returns 404 if shelter not found", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .get("/api/shelters/S-99/items")
      .expect(404);

    expect(res.body).toEqual(
      expect.objectContaining({ error: "Shelter not found" })
    );
  });
});

describe("PUT /api/shelters/:id/items/:itemName", () => {
  it("adds new item when not exists", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);

    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [],
      save: saveMock,
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const res = await request(app)
      .put("/api/shelters/S-1/items/Water")
      .send({ name: "Water", quantity: 5, unit: "liters" })
      .expect(200);

    expect(shelterDoc.reliefItems.length).toBe(1);
    expect(shelterDoc.reliefItems[0]).toEqual(
      expect.objectContaining({ name: "Water", quantity: 5, unit: "liters" })
    );
    expect(saveMock).toHaveBeenCalled();
    expect(res.body).toEqual(
      expect.objectContaining({
        shelterId: "S-1",
        reliefItems: expect.any(Array),
      })
    );
  });

  it("updates existing item", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);

    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Rice", quantity: 10, unit: "kg" }],
      save: saveMock,
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const res = await request(app)
      .put("/api/shelters/S-1/items/Rice")
      .send({ name: "Rice", quantity: 20 })
      .expect(200);

    expect(shelterDoc.reliefItems[0].quantity).toBe(20);
    expect(saveMock).toHaveBeenCalled();
    expect(res.body.reliefItems[0].quantity).toBe(20);
  });
});

describe("PUT /api/shelters/:id/items/:itemName/increase", () => {
  it("increases quantity and returns item", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);

    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Rice", quantity: 10 }],
      save: saveMock,
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const res = await request(app)
      .put("/api/shelters/S-1/items/Rice/increase")
      .send({ amount: 5 })
      .expect(200);

    expect(shelterDoc.reliefItems[0].quantity).toBe(15);
    expect(saveMock).toHaveBeenCalled();
    expect(res.body).toEqual(
      expect.objectContaining({ name: "Rice", quantity: 15 })
    );
  });
});

describe("PUT /api/shelters/:id/items/:itemName/decrease", () => {
  it("decreases quantity but not below 0", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);

    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Rice", quantity: 3 }],
      save: saveMock,
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const res = await request(app)
      .put("/api/shelters/S-1/items/Rice/decrease")
      .send({ amount: 5 })
      .expect(200);

    expect(shelterDoc.reliefItems[0].quantity).toBe(0);
    expect(saveMock).toHaveBeenCalled();
    expect(res.body).toEqual(
      expect.objectContaining({ name: "Rice", quantity: 0 })
    );
  });
});

describe("DELETE /api/shelters/:id/items/:itemName", () => {
  it("removes item from shelter", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);

    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Rice", quantity: 10 }],
      save: saveMock,
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const res = await request(app)
      .delete("/api/shelters/S-1/items/Rice")
      .expect(200);

    expect(shelterDoc.reliefItems.length).toBe(0);
    expect(saveMock).toHaveBeenCalled();
    expect(res.body).toEqual(
      expect.objectContaining({ message: "Item removed from shelter" })
    );
  });
});
