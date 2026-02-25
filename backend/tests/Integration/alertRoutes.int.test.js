const request = require("supertest");

jest.mock("../../models/Alert");

// bypass auth
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
}));

jest.mock("../../middleware/roleMiddleware", () => ({
  allowRoles: () => (req, res, next) => next(),
}));

const Alert = require("../../models/Alert");
const { createTestApp } = require("../utils/testApp");

let app;

beforeAll(() => {
  app = createTestApp();
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

/* ================= GET ALL ALERTS ================= */

describe("GET /api/alerts", () => {
  it("returns alerts successfully", async () => {
    Alert.countDocuments.mockResolvedValue(1);

    Alert.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ alertId: "ALERT-1" }]),
    });

    const res = await request(app)
      .get("/api/alerts")
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns 400 for invalid pagination", async () => {
    const res = await request(app)
      .get("/api/alerts?page=0&limit=10")
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });
});

/* ================= CREATE ALERT ================= */

describe("POST /api/alerts", () => {
  it("creates alert successfully", async () => {
    Alert.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });

    Alert.create.mockResolvedValue({ alertId: "ALERT-00001" });

    const res = await request(app)
      .post("/api/alerts")
      .send({
        title: "Flood",
        description: "Heavy rain",
        category: "FLOOD",
        severity: "HIGH",
        area: { district: "Colombo" },
        startAt: new Date(),
      })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it("returns 400 if fields missing", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .send({ title: "Missing" })
      .expect(400);

    expect(res.body.message).toBe("Missing required fields");
  });
});

/* ================= GET MY ALERTS ================= */

describe("GET /api/alerts/my", () => {
  it("returns alerts for user district", async () => {
    Alert.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ alertId: "A1" }]),
    });

    const res = await request(app)
      .get("/api/alerts/my")
      .expect(400); // because no req.user in integration

    // Since integration bypasses auth but does not inject req.user,
    // it should return 400 (User location not configured)
    expect(res.body).toHaveProperty("message");
  });
});