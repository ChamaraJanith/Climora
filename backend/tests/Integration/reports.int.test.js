const request = require("supertest");

/**
 * ================================
 * ✅ MOCKS (Models + Services)
 * ================================
 */
jest.mock("../../models/Report");
jest.mock("../../models/Vote");
jest.mock("../../models/ReportComment");

// Weather service is used when creating FLOOD reports with lat/lon
jest.mock("../../services/weatherService", () => ({
  getOneCallData: jest.fn(),
}));

// Cloudinary is required by controller (only used if files exist)
jest.mock("../../config/cloudinary", () => ({
  uploader: {
    upload: jest.fn(),
  },
}));

/**
 * ================================
 * ✅ BYPASS MIDDLEWARE (Auth + Upload)
 * ================================
 * Your routes use:
 * - protect
 * - adminOnly
 * - upload.array("photos", 5)
 * We bypass them for integration tests.
 */
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => {
    // default user for most tests
    req.user = { userId: "User-00001", role: "USER" };
    next();
  },
  adminOnly: (req, res, next) => {
    // elevate role when adminOnly is applied
    req.user = req.user || { userId: "Admin-00001" };
    req.user.role = "ADMIN";
    next();
  },
}));

jest.mock("../../middleware/uploadMiddleware", () => ({
  array: () => (req, res, next) => {
    // controller checks req.files; ensure it exists
    req.files = [];
    next();
  },
}));

const Report = require("../../models/Report");
const Vote = require("../../models/Vote");
const ReportComment = require("../../models/ReportComment");
const { getOneCallData } = require("../../services/weatherService");
const { createTestApp } = require("../utils/testApp");

let app;

beforeAll(() => {
  app = createTestApp();
});

beforeEach(() => {
  jest.clearAllMocks();

  // silence logs (your controllers log a lot)
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});

/**
 * =====================================================
 * ✅ GET /api/reports  (Public list - verified only)
 * =====================================================
 */
describe("GET /api/reports", () => {
  it("returns 200 and list of verified reports", async () => {
    const fakeReports = [
      {
        _id: "Report-00001",
        title: "Flood near river",
        status: "ADMIN_VERIFIED",
        category: "FLOOD",
      },
    ];

    // controller does: Report.find(filter).sort({createdAt:-1})
    Report.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(fakeReports),
    });

    const res = await request(app).get("/api/reports").expect(200);

    expect(Report.find).toHaveBeenCalledWith({ status: "ADMIN_VERIFIED" });
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("_id", "Report-00001");
  });

  it("returns 500 when DB fails", async () => {
    Report.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const res = await request(app).get("/api/reports");

    expect([500]).toContain(res.status);
    expect(res.body).toHaveProperty("error");
  });
});

/**
 * =====================================================
 * ✅ POST /api/reports (Create report)
 * - Requires req.user.userId
 * - If FLOOD + lat/lon => Weather Context attached
 * =====================================================
 */
describe("POST /api/reports", () => {
  it("creates report (201) with weatherContext for FLOOD + lat/lon", async () => {
    // mock weather service response (controller reads daily[0].rain, current.rain["1h"])
    getOneCallData.mockResolvedValue({
      daily: [{ rain: 82 }],
      current: { rain: { "1h": 2 } },
    });

    const created = {
      _id: "Report-00007",
      title: "Flood in town",
      description: "Water level rising",
      category: "FLOOD",
      severity: "HIGH",
      location: { district: "Colombo", city: "Wellawatte", lat: 6.87, lon: 79.86 },
      status: "PENDING",
      userId: "User-00001",
      createdBy: "User-00001",
      weatherContext: {
        summary: "Heavy Rain (82mm in last 24h)",
        rain24hMm: 82,
        rain1hMm: 2,
        source: "openweather",
      },
    };

    Report.create.mockResolvedValue(created);

    const res = await request(app)
      .post("/api/reports")
      .send({
        title: "Flood in town",
        description: "Water level rising",
        category: "FLOOD",
        severity: "HIGH",
        location: { district: "Colombo", city: "Wellawatte", lat: 6.87, lon: 79.86 },
      })
      .expect(201);

    expect(getOneCallData).toHaveBeenCalledWith(6.87, 79.86);
    expect(Report.create).toHaveBeenCalled();
    expect(res.body).toHaveProperty("_id", "Report-00007");
    expect(res.body).toHaveProperty("weatherContext");
    expect(res.body.weatherContext.summary).toContain("Heavy Rain");
  });

  it("returns 400 if create fails", async () => {
    Report.create.mockRejectedValue(new Error("Validation failed"));

    const res = await request(app)
      .post("/api/reports")
      .send({
        title: "X",
        description: "Y",
        category: "FLOOD",
        severity: "HIGH",
        location: { district: "Colombo", city: "Wellawatte" },
      });

    expect([400]).toContain(res.status);
    expect(res.body).toHaveProperty("error");
  });
});

/**
 * =====================================================
 * ✅ GET /api/reports/:id (Public single - verified only)
 * =====================================================
 */
describe("GET /api/reports/:id", () => {
  it("returns 200 if report is verified", async () => {
    Report.findById.mockResolvedValue({
      _id: "Report-00001",
      status: "ADMIN_VERIFIED",
      title: "Heatwave report",
    });

    const res = await request(app).get("/api/reports/Report-00001").expect(200);
    expect(res.body).toHaveProperty("_id", "Report-00001");
  });

  it("returns 404 if report is not verified", async () => {
    Report.findById.mockResolvedValue({
      _id: "Report-00001",
      status: "PENDING",
      title: "Pending report",
    });

    const res = await request(app).get("/api/reports/Report-00001").expect(404);
    expect(res.body).toHaveProperty("error");
  });
});

/**
 * =====================================================
 * ✅ POST /api/reports/:id/vote
 * - Only ADMIN_VERIFIED reports can be voted
 * - Handles add / toggle remove / switch
 * =====================================================
 */
describe("POST /api/reports/:id/vote", () => {
  it("returns 403 if report not verified", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-00001", status: "PENDING" }),
    });

    const res = await request(app)
      .post("/api/reports/Report-00001/vote")
      .send({ voteType: "UP" })
      .expect(403);

    expect(res.body).toHaveProperty("error");
  });

  it("adds vote when user has no existing vote", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-00001", status: "ADMIN_VERIFIED" }),
    });

    Vote.findOne.mockResolvedValue(null);
    Vote.create.mockResolvedValue({ _id: "Vote-00001" });
    Report.findByIdAndUpdate.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/reports/Report-00001/vote")
      .send({ voteType: "UP" })
      .expect(200);

    expect(Vote.create).toHaveBeenCalledWith({
      reportId: "Report-00001",
      userId: "User-00001",
      voteType: "UP",
    });
    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
      "Report-00001",
      { $inc: { confirmCount: 1 } }
    );
    expect(res.body).toEqual(expect.objectContaining({ message: "Vote added" }));
  });

  it("toggles vote removal if same vote repeated", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-00001", status: "ADMIN_VERIFIED" }),
    });

    Vote.findOne.mockResolvedValue({ _id: "Vote-00005", voteType: "DOWN" });
    Vote.deleteOne.mockResolvedValue(true);
    Report.findByIdAndUpdate.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/reports/Report-00001/vote")
      .send({ voteType: "DOWN" })
      .expect(200);

    expect(Vote.deleteOne).toHaveBeenCalledWith({ _id: "Vote-00005" });
    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
      "Report-00001",
      { $inc: { denyCount: -1 } }
    );
    expect(res.body).toEqual(expect.objectContaining({ message: "Vote removed" }));
  });
});

/**
 * =====================================================
 * ✅ COMMENTS
 * - POST /api/reports/:id/comments (verified only)
 * - GET  /api/reports/:id/comments (verified only)
 * =====================================================
 */
describe("Comments", () => {
  it("POST /api/reports/:id/comments returns 201 when verified", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-00001", status: "ADMIN_VERIFIED" }),
    });

    ReportComment.create.mockResolvedValue({
      _id: "Comment-00001",
      reportId: "Report-00001",
      userId: "User-00001",
      text: "I saw this too",
    });

    Report.findByIdAndUpdate.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/reports/Report-00001/comments")
      .send({ text: "I saw this too" })
      .expect(201);

    expect(ReportComment.create).toHaveBeenCalled();
    expect(res.body).toHaveProperty("_id", "Comment-00001");
  });

  it("POST /api/reports/:id/comments returns 400 if text missing", async () => {
    const res = await request(app)
      .post("/api/reports/Report-00001/comments")
      .send({ text: "" })
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });

  it("GET /api/reports/:id/comments returns 200 with list when verified", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-00001", status: "ADMIN_VERIFIED" }),
    });

    ReportComment.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: "Comment-00002", text: "Stay safe!" },
      ]),
    });

    const res = await request(app)
      .get("/api/reports/Report-00001/comments")
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("_id");
  });

  it("GET /api/reports/:id/comments returns 404 if not verified", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-00001", status: "PENDING" }),
    });

    const res = await request(app)
      .get("/api/reports/Report-00001/comments")
      .expect(404);

    expect(res.body).toHaveProperty("error");
  });
});

/**
 * =====================================================
 * ✅ GET /api/reports/:id/votes/summary (verified only)
 * =====================================================
 */
describe("GET /api/reports/:id/votes/summary", () => {
  it("returns 200 and vote totals when verified", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "Report-00001",
        status: "ADMIN_VERIFIED",
        confirmCount: 5,
        denyCount: 2,
      }),
    });

    const res = await request(app)
      .get("/api/reports/Report-00001/votes/summary")
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        reportId: "Report-00001",
        upVotes: 5,
        downVotes: 2,
        totalVotes: 7,
      })
    );
  });
});

/**
 * =====================================================
 * ✅ GET /api/reports/:id/summary (verified only)
 * =====================================================
 */
describe("GET /api/reports/:id/summary", () => {
  it("returns 200 with summary and myVote", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "Report-00001",
        title: "Storm",
        status: "ADMIN_VERIFIED",
        confirmCount: 1,
        denyCount: 0,
        commentCount: 3,
        weatherContext: null,
        createdAt: new Date(),
      }),
    });

    // controller: Vote.findOne({ reportId, userId }).select("voteType")
    Vote.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ voteType: "UP" }),
    });

    const res = await request(app)
      .get("/api/reports/Report-00001/summary")
      .expect(200);

    expect(res.body).toHaveProperty("reportId", "Report-00001");
    expect(res.body).toHaveProperty("votes");
    expect(res.body.votes).toHaveProperty("myVote", "UP");
  });
});

/**
 * =====================================================
 * ✅ PATCH /api/reports/:id/status (admin)
 * =====================================================
 */
describe("PATCH /api/reports/:id/status", () => {
  it("returns 400 for invalid status", async () => {
    const res = await request(app)
      .patch("/api/reports/Report-00001/status")
      .send({ status: "INVALID_STATUS" })
      .expect(400);

    expect(res.body).toEqual(expect.objectContaining({ error: "Invalid status value" }));
  });

  it("updates status and returns report", async () => {
    Report.findByIdAndUpdate.mockResolvedValue({
      _id: "Report-00001",
      status: "ADMIN_VERIFIED",
    });

    const res = await request(app)
      .patch("/api/reports/Report-00001/status")
      .send({ status: "ADMIN_VERIFIED" })
      .expect(200);

    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
      "Report-00001",
      { status: "ADMIN_VERIFIED" },
      { new: true }
    );

    expect(res.body).toHaveProperty("_id", "Report-00001");
    expect(res.body).toHaveProperty("status", "ADMIN_VERIFIED");
  });
});