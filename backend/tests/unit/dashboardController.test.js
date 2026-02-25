jest.mock("../../models/Alert");
jest.mock("../../services/weatherService");

const Alert = require("../../models/Alert");
const weatherService = require("../../services/weatherService");
const dashboardController = require("../../controller/dashboardController");
const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

beforeEach(() => {
  jest.clearAllMocks();
});

/* ================= GET ALERTS AND RISK ================= */

describe("getAlertsAndRisk", () => {
  it("should return dashboard data", async () => {
    Alert.find.mockResolvedValue([{ alertId: "A1" }]);

    weatherService.getOneCallData.mockResolvedValue({
      current: {
        temp: 36,
        humidity: 60,
        wind_speed: 13,
        weather: [{ description: "rain" }],
      },
      alerts: [{}],
    });

    const req = mockRequest({}, {}, { lat: "6.9", lon: "79.8" });
    const res = mockResponse();

    await dashboardController.getAlertsAndRisk(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });
});

/* ================= GET MY STATUS ================= */

describe("getMyStatus", () => {
  it("should return personalized dashboard", async () => {
    Alert.find.mockResolvedValue([{ alertId: "A1" }]);

    weatherService.getOneCallData.mockResolvedValue({
      current: {
        temp: 34,
        humidity: 70,
        wind_speed: 10,
        weather: [{ description: "cloudy" }],
      },
      alerts: [],
    });

    const req = mockRequest();
    req.user = {
      location: { lat: 6.9, lon: 79.8, district: "Colombo" },
    };

    const res = mockResponse();

    await dashboardController.getMyStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        location: "Colombo",
      })
    );
  });
});