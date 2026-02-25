jest.mock("../../services/weatherService");
jest.mock("../../models/Alert");

const weatherService = require("../../services/weatherService");
const Alert = require("../../models/Alert");
const weatherController = require("../../controller/weatherController");
const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

beforeEach(() => {
  jest.clearAllMocks();
});

/* ================= GET CURRENT WEATHER ================= */

describe("getCurrentWeather", () => {
  it("should return 400 if lat/lon missing", async () => {
    const req = mockRequest();
    const res = mockResponse();

    await weatherController.getCurrentWeather(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return formatted weather data", async () => {
    weatherService.getOneCallData.mockResolvedValue({
      current: {
        temp: 30,
        humidity: 60,
        wind_speed: 5,
        weather: [{ description: "clear sky" }],
      },
    });

    const req = mockRequest({}, {}, { lat: "6.9", lon: "79.8" });
    const res = mockResponse();

    await weatherController.getCurrentWeather(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});

/* ================= GET RISK LEVEL ================= */

describe("getRiskLevel", () => {
  it("should calculate HIGH risk", async () => {
    weatherService.getOneCallData.mockResolvedValue({
      current: {
        temp: 39,
        wind_speed: 15,
        wind_gust: 25,
        rain: { "1h": 12 },
      },
      alerts: [{}],
    });

    const req = mockRequest({}, {}, { lat: "6.9", lon: "79.8" });
    const res = mockResponse();

    await weatherController.getRiskLevel(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          riskLevel: expect.any(String),
        }),
      })
    );
  });
});

/* ================= EXTERNAL ALERTS ================= */

describe("getExternalWeatherAlerts", () => {
  it("should auto-save new external alerts", async () => {
    weatherService.getOneCallData.mockResolvedValue({
      alerts: [
        {
          event: "Storm Warning",
          description: "Heavy storm",
          start: 1700000000,
          end: 1700003600,
        },
      ],
    });

    Alert.findOne.mockResolvedValue(null);
    Alert.create.mockResolvedValue({});

    const req = mockRequest({}, {}, { lat: "6.9", lon: "79.8" });
    const res = mockResponse();

    await weatherController.getExternalWeatherAlerts(req, res);

    expect(Alert.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});