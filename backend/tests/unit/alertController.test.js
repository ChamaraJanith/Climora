jest.mock("../../models/Alert");

const Alert = require("../../models/Alert");
const alertController = require("../../controller/alertController");
const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

beforeEach(() => {
  jest.clearAllMocks();
});

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

/* ================= CREATE ALERT ================= */

describe("createAlert", () => {
  it("should return 400 if required fields missing", async () => {
    const req = mockRequest({ title: "Test" });
    const res = mockResponse();

    await alertController.createAlert(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Missing required fields",
      })
    );
  });

  it("should create alert and return 201", async () => {
    Alert.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });

    Alert.create.mockResolvedValue({ alertId: "ALERT-00001" });

    const req = mockRequest({
      title: "Flood Warning",
      description: "Heavy flood",
      category: "FLOOD",
      severity: "HIGH",
      area: { district: "Colombo" },
      startAt: new Date(),
    });

    const res = mockResponse();

    await alertController.createAlert(req, res);

    expect(Alert.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

/* ================= GET ALERTS ================= */

describe("getAlerts", () => {
  it("should return alerts with pagination", async () => {
    Alert.countDocuments.mockResolvedValue(1);

    Alert.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ alertId: "ALERT-1" }]),
    });

    const req = mockRequest({}, {}, { page: "1", limit: "10" });
    const res = mockResponse();

    await alertController.getAlerts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  it("should return 400 for invalid page", async () => {
    const req = mockRequest({}, {}, { page: "0", limit: "10" });
    const res = mockResponse();

    await alertController.getAlerts(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

/* ================= GET ALERT BY ID ================= */

describe("getAlertById", () => {
  it("should return alert when found", async () => {
    Alert.findOne.mockResolvedValue({ alertId: "ALERT-1" });

    const req = mockRequest({}, { id: "ALERT-1" });
    const res = mockResponse();

    await alertController.getAlertById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("should return 404 if not found", async () => {
    Alert.findOne.mockResolvedValue(null);

    const req = mockRequest({}, { id: "X" });
    const res = mockResponse();

    await alertController.getAlertById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

/* ================= UPDATE ALERT ================= */

describe("updateAlert", () => {
  it("should update alert", async () => {
    Alert.findOneAndUpdate.mockResolvedValue({ alertId: "ALERT-1" });

    const req = mockRequest({ severity: "LOW" }, { id: "ALERT-1" });
    const res = mockResponse();

    await alertController.updateAlert(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("should return 404 if not found", async () => {
    Alert.findOneAndUpdate.mockResolvedValue(null);

    const req = mockRequest({}, { id: "X" });
    const res = mockResponse();

    await alertController.updateAlert(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

/* ================= DELETE ALERT ================= */

describe("deleteAlert", () => {
  it("should deactivate alert", async () => {
    Alert.findOneAndUpdate.mockResolvedValue({ alertId: "ALERT-1" });

    const req = mockRequest({}, { id: "ALERT-1" });
    const res = mockResponse();

    await alertController.deleteAlert(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Alert deactivated successfully",
      })
    );
  });
});

/* ================= GET MY ALERTS ================= */

describe("getMyAlerts", () => {
  it("should return alerts for user's district", async () => {
    Alert.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ alertId: "ALERT-1" }]),
    });

    const req = mockRequest();
    req.user = { location: { district: "Colombo" } };

    const res = mockResponse();

    await alertController.getMyAlerts(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        district: "Colombo",
      })
    );
  });

  it("should return 400 if user location missing", async () => {
    const req = mockRequest();
    req.user = {};

    const res = mockResponse();

    await alertController.getMyAlerts(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});