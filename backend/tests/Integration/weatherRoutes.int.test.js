const request = require("supertest");

jest.mock("../../services/weatherService");
jest.mock("../../models/Alert");

jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
}));

const weatherService = require("../../services/weatherService");
const Alert = require("../../models/Alert");
const { createTestApp } = require("../utils/testApp");

let app;

beforeAll(() => {
  app = createTestApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

/* ================= CURRENT WEATHER ================= */

describe("GET /api/weather/current", () => {
  it("returns weather data", async () => {
    weatherService.getOneCallData.mockResolvedValue({
      current: {
        temp: 30,
        humidity: 60,
        wind_speed: 5,
        weather: [{ description: "clear sky" }],
      },
    });

    const res = await request(app)
      .get("/api/weather/current")
      .query({ lat: "6.9", lon: "79.8" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.temperature).toBe(30);
  });

  it("returns 400 if lat/lon missing", async () => {
    const res = await request(app)
      .get("/api/weather/current")
      .expect(400);

    expect(res.body.message).toBe("Latitude and Longitude are required");
  });
});

/* ================= RISK LEVEL ================= */

describe("GET /api/weather/risk", () => {
  it("calculates risk level", async () => {
    weatherService.getOneCallData.mockResolvedValue({
      current: {
        temp: 39,
        wind_speed: 15,
        wind_gust: 25,
        rain: { "1h": 12 },
      },
      alerts: [{}],
    });

    const res = await request(app)
      .get("/api/weather/risk")
      .query({ lat: "6.9", lon: "79.8" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("riskLevel");
  });
});

/* ================= EXTERNAL ALERTS ================= */

describe("GET /api/weather/external-alerts", () => {
  it("auto-saves external alerts", async () => {
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

    const res = await request(app)
      .get("/api/weather/external-alerts")
      .query({ lat: "6.9", lon: "79.8" })
      .expect(200);

    expect(Alert.create).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
  });
});