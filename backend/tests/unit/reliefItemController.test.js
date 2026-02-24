jest.mock("../../models/Shelter");

const Shelter = require("../../models/Shelter");
const {
  getShelterItems,
  updateShelterItem,
  increaseShelterItem,
  decreaseShelterItem,
  deleteShelterItem,
} = require("../../controller/reliefItemController");
const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

// common beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});

// silence controller logs during tests
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

// ============= getShelterItems =============
describe("getShelterItems", () => {
  it("should return items for a shelter", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      name: "Shelter 1",
      district: "Kalutara",
      reliefItems: [{ name: "Rice", quantity: 10 }],
    };

    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(shelterDoc),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await getShelterItems(req, res);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(res.json).toHaveBeenCalledWith({
      shelterId: "S-1",
      shelterName: "Shelter 1",
      district: "Kalutara",
      reliefItems: shelterDoc.reliefItems,
    });
  });

  it("should return 404 if shelter not found", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { id: "S-99" });
    const res = mockResponse();

    await getShelterItems(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Shelter not found" })
    );
  });

  it("should return 500 on error", async () => {
    Shelter.findOne.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockRequest({}, { id: "S-1" });
    const res = mockResponse();

    await getShelterItems(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "❌ Failed to fetch shelter items",
      })
    );
  });
});

// ============= updateShelterItem =============
describe("updateShelterItem", () => {
  it("should return 400 if name missing", async () => {
    const req = mockRequest({}, { id: "1" });
    const res = mockResponse();

    await updateShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Item name is required" })
    );
  });

  it("should return 404 if shelter not found", async () => {
    Shelter.findOne.mockResolvedValue(null);

    const req = mockRequest({ name: "Rice" }, { id: "S-1" });
    const res = mockResponse();

    await updateShelterItem(req, res);

    expect(Shelter.findOne).toHaveBeenCalledWith({ shelterId: "S-1" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "❌ Shelter not found" })
    );
  });

  it("should update existing item", async () => {
    const existingShelter = {
      shelterId: "S-1",
      reliefItems: [{ name: "Rice", quantity: 10 }],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(existingShelter);

    const req = mockRequest({ name: "Rice", quantity: 20 }, { id: "S-1" });
    const res = mockResponse();

    await updateShelterItem(req, res);

    expect(existingShelter.reliefItems[0].quantity).toBe(20);
    expect(existingShelter.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      shelterId: "S-1",
      reliefItems: existingShelter.reliefItems,
    });
  });

  it("should add new item when not exists", async () => {
    const existingShelter = {
      shelterId: "S-1",
      reliefItems: [],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(existingShelter);

    const req = mockRequest(
      { name: "Water", quantity: 5, unit: "liters" },
      { id: "S-1" }
    );
    const res = mockResponse();

    await updateShelterItem(req, res);

    expect(existingShelter.reliefItems.length).toBe(1);
    expect(existingShelter.reliefItems[0].name).toBe("Water");
    expect(existingShelter.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      shelterId: "S-1",
      reliefItems: existingShelter.reliefItems,
    });
  });

  it("should handle error with 400", async () => {
    Shelter.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({ name: "Rice", quantity: 20 }, { id: "S-1" });
    const res = mockResponse();

    await updateShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to update shelter item",
      })
    );
  });
});

// ============= increaseShelterItem =============
describe("increaseShelterItem", () => {
  it("should return 400 for invalid amount", async () => {
    const req = mockRequest({ amount: -5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await increaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "amount must be a positive number" })
    );
  });

  it("should return 404 if shelter not found", async () => {
    Shelter.findOne.mockResolvedValue(null);

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await increaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Shelter not found" })
    );
  });

  it("should return 404 if item not found", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Water", quantity: 10 }],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await increaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Item not found in shelter" })
    );
  });

  it("should increase quantity and return item", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Rice", quantity: 10 }],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await increaseShelterItem(req, res);

    expect(shelterDoc.reliefItems[0].quantity).toBe(15);
    expect(shelterDoc.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Rice", quantity: 15 })
    );
  });

  it("should handle error with 400", async () => {
    Shelter.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await increaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to increase shelter item",
      })
    );
  });
});

// ============= decreaseShelterItem =============
describe("decreaseShelterItem", () => {
  it("should return 400 for invalid amount", async () => {
    const req = mockRequest({ amount: 0 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await decreaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "amount must be a positive number" })
    );
  });

  it("should return 404 if shelter not found", async () => {
    Shelter.findOne.mockResolvedValue(null);

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await decreaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Shelter not found" })
    );
  });

  it("should return 404 if item not found", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Water", quantity: 10 }],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await decreaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Item not found in shelter" })
    );
  });

  it("should decrease quantity but not below 0", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Rice", quantity: 3 }],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await decreaseShelterItem(req, res);

    expect(shelterDoc.reliefItems[0].quantity).toBe(0);
    expect(shelterDoc.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Rice", quantity: 0 })
    );
  });

  it("should handle error with 400", async () => {
    Shelter.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({ amount: 5 }, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await decreaseShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to decrease shelter item",
      })
    );
  });
});

// ============= deleteShelterItem =============
describe("deleteShelterItem", () => {
  it("should return 404 if shelter not found", async () => {
    Shelter.findOne.mockResolvedValue(null);

    const req = mockRequest({}, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await deleteShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Shelter not found" })
    );
  });

  it("should return 404 if item not found in shelter", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [{ name: "Water", quantity: 10 }],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const req = mockRequest({}, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await deleteShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Item not found in shelter" })
    );
  });

  it("should delete item and return success message", async () => {
    const shelterDoc = {
      shelterId: "S-1",
      reliefItems: [
        { name: "Rice", quantity: 10 },
        { name: "Water", quantity: 5 },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findOne.mockResolvedValue(shelterDoc);

    const req = mockRequest({}, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await deleteShelterItem(req, res);

    expect(shelterDoc.reliefItems.length).toBe(1);
    expect(shelterDoc.reliefItems[0].name).toBe("Water");
    expect(shelterDoc.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Item removed from shelter" })
    );
  });

  it("should handle error with 400", async () => {
    Shelter.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({}, { id: "S-1", itemName: "Rice" });
    const res = mockResponse();

    await deleteShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to delete shelter item",
      })
    );
  });
});
