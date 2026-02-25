const request = require("supertest");

jest.mock("../../models/Alert");
jest.mock("../../services/weatherService");

jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
}));

const Alert = require("../../models/Alert");
const weatherService = require("../../services/weatherService");
const { createTestApp } = require("../utils/testApp");

let app;

beforeAll(() => {
  app = createTestApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

/* ================= ALERTS + RISK ================= */

describe("GET /api/dashboard/alerts-risk", () => {
  it("returns combined dashboard data", async () => {
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

    const res = await request(app)
      .get("/api/dashboard/alerts-risk")
      .query({ lat: "6.9", lon: "79.8" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("riskLevel");
  });

  it("returns 400 if lat/lon missing", async () => {
    const res = await request(app)
      .get("/api/dashboard/alerts-risk")
      .expect(400);

    expect(res.body.message).toBe("Latitude and Longitude are required");
  });
});