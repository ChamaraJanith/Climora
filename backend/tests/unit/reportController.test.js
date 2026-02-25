// tests/unit/reportController.test.js

jest.mock("../../models/Report");
jest.mock("../../models/Vote");
jest.mock("../../config/cloudinary", () => ({
  uploader: { upload: jest.fn() },
}));
jest.mock("fs", () => ({
  unlinkSync: jest.fn(),
}));
jest.mock("../../services/weatherService", () => ({
  getOneCallData: jest.fn(),
}));

const Report = require("../../models/Report");
const Vote = require("../../models/Vote");
const cloudinary = require("../../config/cloudinary");
const fs = require("fs");
const { getOneCallData } = require("../../services/weatherService");

const reportController = require("../../controller/reportController");
const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

beforeEach(() => {
  jest.clearAllMocks();
});

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

// ===============================
// createReport
// ===============================
describe("createReport", () => {
  it("should return 401 if no req.user.userId", async () => {
    const req = mockRequest(
      {
        title: "T",
        description: "D",
        category: "FLOOD",
        severity: "HIGH",
        location: { district: "Colombo", city: "Colombo" },
      },
      {},
      {},
      { user: undefined, method: "POST", originalUrl: "/api/reports" }
    );
    const res = mockResponse();

    await reportController.createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Not authorized") })
    );
    expect(Report.create).not.toHaveBeenCalled();
  });

  it("should parse location JSON string if provided (form-data style)", async () => {
    Report.create.mockResolvedValue({ _id: "Report-00001" });

    const req = mockRequest(
      {
        title: "Flood report",
        description: "Desc",
        category: "OTHER",
        severity: "LOW",
        location: JSON.stringify({ district: "Galle", city: "Galle", lat: 6.0, lon: 80.0 }),
      },
      {},
      {},
      {
        user: { userId: "User-00001", role: "USER" },
        method: "POST",
        originalUrl: "/api/reports",
      }
    );
    const res = mockResponse();

    await reportController.createReport(req, res);

    expect(Report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.objectContaining({ district: "Galle", city: "Galle" }),
        userId: "User-00001",
        createdBy: "User-00001",
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should upload photos to cloudinary and unlink temp files", async () => {
    cloudinary.uploader.upload
      .mockResolvedValueOnce({ secure_url: "http://img1" })
      .mockResolvedValueOnce({ secure_url: "http://img2" });

    Report.create.mockResolvedValue({ _id: "Report-00002" });

    const req = mockRequest(
      {
        title: "Storm",
        description: "Desc",
        category: "STORM",
        severity: "MEDIUM",
        location: { district: "Matara", city: "Matara" },
      },
      {},
      {},
      {
        user: { userId: "User-00002", role: "USER" },
        files: [{ path: "/tmp/a.jpg" }, { path: "/tmp/b.jpg" }],
        method: "POST",
        originalUrl: "/api/reports",
      }
    );
    const res = mockResponse();

    await reportController.createReport(req, res);

    expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(2);
    expect(fs.unlinkSync).toHaveBeenCalledTimes(2);

    expect(Report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        photos: ["http://img1", "http://img2"],
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should attach weatherContext only for FLOOD + lat/lon", async () => {
    getOneCallData.mockResolvedValue({
      daily: [{ rain: 82 }],
      current: { rain: { "1h": 5 } },
    });

    Report.create.mockResolvedValue({ _id: "Report-00003", weatherContext: { summary: "Heavy Rain" } });

    const req = mockRequest(
      {
        title: "Flood area",
        description: "Desc",
        category: "FLOOD",
        severity: "HIGH",
        location: { district: "Kalutara", city: "Kalutara", lat: 6.9, lon: 79.9 },
      },
      {},
      {},
      { user: { userId: "User-00003", role: "USER" }, method: "POST", originalUrl: "/api/reports" }
    );
    const res = mockResponse();

    await reportController.createReport(req, res);

    expect(getOneCallData).toHaveBeenCalledWith(6.9, 79.9);
    expect(Report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        weatherContext: expect.objectContaining({
          summary: expect.stringContaining("Heavy Rain"),
          rain24hMm: 82,
          rain1hMm: 5,
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should ignore weatherContext errors (still create report)", async () => {
    getOneCallData.mockRejectedValue(new Error("Weather fail"));
    Report.create.mockResolvedValue({ _id: "Report-00004" });

    const req = mockRequest(
      {
        title: "Flood",
        description: "Desc",
        category: "FLOOD",
        severity: "HIGH",
        location: { district: "Colombo", city: "Colombo", lat: 6.9, lon: 79.8 },
      },
      {},
      {},
      { user: { userId: "User-00004", role: "USER" }, method: "POST", originalUrl: "/api/reports" }
    );
    const res = mockResponse();

    await reportController.createReport(req, res);

    expect(Report.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should return 400 on create error", async () => {
    Report.create.mockRejectedValue(new Error("Validation failed"));

    const req = mockRequest(
      {
        title: "X",
        description: "Y",
        category: "OTHER",
        severity: "LOW",
        location: { district: "Kandy", city: "Kandy" },
      },
      {},
      {},
      { user: { userId: "User-00010", role: "USER" }, method: "POST", originalUrl: "/api/reports" }
    );
    const res = mockResponse();

    await reportController.createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Validation failed" }));
  });
});

// ===============================
// getReports (public verified only)
// ===============================
describe("getReports", () => {
  it("should return reports with ADMIN_VERIFIED filter", async () => {
    const fake = [{ _id: "Report-1" }];

    Report.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(fake),
    });

    const req = mockRequest({}, {}, { category: "FLOOD", search: "abc" });
    const res = mockResponse();

    await reportController.getReports(req, res);

    expect(Report.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ADMIN_VERIFIED",
        category: "FLOOD",
        $or: expect.any(Array),
      })
    );
    expect(res.json).toHaveBeenCalledWith(fake);
  });

  it("should return 500 on error", async () => {
    Report.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockRequest();
    const res = mockResponse();

    await reportController.getReports(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB error" }));
  });
});

// ===============================
// getAllReportsAdmin
// ===============================
describe("getAllReportsAdmin", () => {
  it("should return reports with filters", async () => {
    const fake = [{ _id: "Report-2" }];

    Report.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(fake),
    });

    const req = mockRequest(
      {},
      {},
      { status: "PENDING", days: "7", district: "Colombo", search: "x" },
      { user: { userId: "User-Admin", role: "ADMIN" }, originalUrl: "/api/reports/admin/all" }
    );
    const res = mockResponse();

    await reportController.getAllReportsAdmin(req, res);

    expect(Report.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "PENDING",
        "location.district": "Colombo",
        $or: expect.any(Array),
        createdAt: expect.any(Object),
      })
    );
    expect(res.json).toHaveBeenCalledWith(fake);
  });

  it("should return 500 on error", async () => {
    Report.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockRequest({}, {}, {}, { user: { userId: "User-Admin", role: "ADMIN" } });
    const res = mockResponse();

    await reportController.getAllReportsAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB error" }));
  });
});

// ===============================
// getReportById (public verified only)
// ===============================
describe("getReportById", () => {
  it("should return 404 if not found", async () => {
    Report.findById.mockResolvedValue(null);

    const req = mockRequest({}, { id: "Report-404" });
    const res = mockResponse();

    await reportController.getReportById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Report not found" }));
  });

  it("should hide non-verified report (404)", async () => {
    Report.findById.mockResolvedValue({ _id: "Report-1", status: "PENDING" });

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await reportController.getReportById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return report if ADMIN_VERIFIED", async () => {
    const doc = { _id: "Report-1", status: "ADMIN_VERIFIED" };
    Report.findById.mockResolvedValue(doc);

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await reportController.getReportById(req, res);

    expect(res.json).toHaveBeenCalledWith(doc);
  });
});

// ===============================
// getReportByIdAdmin
// ===============================
describe("getReportByIdAdmin", () => {
  it("should return report any status", async () => {
    const doc = { _id: "Report-2", status: "PENDING" };
    Report.findById.mockResolvedValue(doc);

    const req = mockRequest({}, { id: "Report-2" }, {}, { user: { role: "ADMIN", userId: "User-Admin" } });
    const res = mockResponse();

    await reportController.getReportByIdAdmin(req, res);

    expect(res.json).toHaveBeenCalledWith(doc);
  });

  it("should return 404 if not found", async () => {
    Report.findById.mockResolvedValue(null);

    const req = mockRequest({}, { id: "X" }, {}, { user: { role: "ADMIN", userId: "User-Admin" } });
    const res = mockResponse();

    await reportController.getReportByIdAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ===============================
// updateReport
// ===============================
describe("updateReport", () => {
  it("should return 404 if report not found", async () => {
    Report.findById.mockResolvedValue(null);

    const req = mockRequest({ title: "New" }, { id: "Report-9" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await reportController.updateReport(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 403 if status not PENDING", async () => {
    Report.findById.mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED", createdBy: "User-1" });

    const req = mockRequest({ title: "New" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await reportController.updateReport(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Cannot update after review" }));
  });

  it("should return 403 if not owner", async () => {
    Report.findById.mockResolvedValue({ _id: "Report-1", status: "PENDING", createdBy: "User-AAA" });

    const req = mockRequest({ title: "New" }, { id: "Report-1" }, {}, { user: { userId: "User-BBB" } });
    const res = mockResponse();

    await reportController.updateReport(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Not owner" }));
  });

  it("should block sensitive fields and update allowed fields", async () => {
    const reportDoc = {
      _id: "Report-1",
      status: "PENDING",
      createdBy: "User-1",
      title: "Old",
      confirmCount: 10,
      save: jest.fn().mockResolvedValue(true),
    };

    Report.findById.mockResolvedValue(reportDoc);

    const req = mockRequest(
      { title: "New", status: "ADMIN_VERIFIED", confirmCount: 999 }, // should be blocked
      { id: "Report-1" },
      {},
      { user: { userId: "User-1" } }
    );
    const res = mockResponse();

    await reportController.updateReport(req, res);

    expect(reportDoc.title).toBe("New");
    expect(reportDoc.status).toBe("PENDING"); // unchanged
    expect(reportDoc.confirmCount).toBe(10); // unchanged
    expect(reportDoc.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(reportDoc);
  });

  it("should return 400 on error", async () => {
    Report.findById.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({ title: "New" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await reportController.updateReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB error" }));
  });
});

// ===============================
// deleteReport
// ===============================
describe("deleteReport", () => {
  it("should allow owner delete if PENDING", async () => {
    const reportDoc = {
      _id: "Report-1",
      status: "PENDING",
      createdBy: "User-1",
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Report.findById.mockResolvedValue(reportDoc);

    const req = mockRequest({}, { id: "Report-1" }, {}, { user: { userId: "User-1", role: "USER" } });
    const res = mockResponse();

    await reportController.deleteReport(req, res);

    expect(reportDoc.deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Report deleted" }));
  });

  it("should allow admin delete", async () => {
    const reportDoc = {
      _id: "Report-2",
      status: "ADMIN_VERIFIED",
      createdBy: "User-1",
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Report.findById.mockResolvedValue(reportDoc);

    const req = mockRequest({}, { id: "Report-2" }, {}, { user: { userId: "User-Admin", role: "ADMIN" } });
    const res = mockResponse();

    await reportController.deleteReport(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Report deleted" }));
  });

  it("should return 403 if not allowed", async () => {
    const reportDoc = {
      _id: "Report-3",
      status: "ADMIN_VERIFIED",
      createdBy: "User-1",
      deleteOne: jest.fn(),
    };
    Report.findById.mockResolvedValue(reportDoc);

    const req = mockRequest({}, { id: "Report-3" }, {}, { user: { userId: "User-2", role: "USER" } });
    const res = mockResponse();

    await reportController.deleteReport(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Not allowed" }));
  });

  it("should return 404 if not found", async () => {
    Report.findById.mockResolvedValue(null);

    const req = mockRequest({}, { id: "Report-X" }, {}, { user: { userId: "User-1", role: "USER" } });
    const res = mockResponse();

    await reportController.deleteReport(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ===============================
// getVoteSummary
// ===============================
describe("getVoteSummary", () => {
  it("should return 404 if report not found", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await reportController.getVoteSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should hide non-verified report (404)", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "Report-1",
        status: "PENDING",
        confirmCount: 1,
        denyCount: 2,
      }),
    });

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await reportController.getVoteSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return vote summary for verified report", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "Report-1",
        status: "ADMIN_VERIFIED",
        confirmCount: 3,
        denyCount: 1,
      }),
    });

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await reportController.getVoteSummary(req, res);

    expect(res.json).toHaveBeenCalledWith({
      reportId: "Report-1",
      upVotes: 3,
      downVotes: 1,
      totalVotes: 4,
    });
  });
});

// ===============================
// getReportSummary
// ===============================
describe("getReportSummary", () => {
  it("should return 404 if report not found", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await reportController.getReportSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should hide non-verified report (404)", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "Report-1",
        status: "PENDING",
      }),
    });

    const req = mockRequest({}, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await reportController.getReportSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should include myVote if user exists", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "Report-1",
        title: "Title",
        status: "ADMIN_VERIFIED",
        confirmCount: 2,
        denyCount: 0,
        commentCount: 5,
        weatherContext: { summary: "Light Rain" },
        createdAt: new Date("2026-01-01"),
      }),
    });

    Vote.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ voteType: "UP" }),
    });

    const req = mockRequest({}, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await reportController.getReportSummary(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: "Report-1",
        votes: expect.objectContaining({ myVote: "UP", total: 2 }),
        comments: { total: 5 },
      })
    );
  });

  it("should set myVote null when no vote", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "Report-1",
        title: "Title",
        status: "ADMIN_VERIFIED",
        confirmCount: 0,
        denyCount: 1,
        commentCount: 0,
        createdAt: new Date(),
      }),
    });

    Vote.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { id: "Report-1" }, {}, { user: { userId: "User-2" } });
    const res = mockResponse();

    await reportController.getReportSummary(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        votes: expect.objectContaining({ myVote: null, total: 1 }),
      })
    );
  });
});

// ===============================
// updateReportStatusAdmin
// ===============================
describe("updateReportStatusAdmin", () => {
  it("should return 400 for invalid status", async () => {
    const req = mockRequest({ status: "BAD" }, { id: "Report-1" }, {}, { user: { role: "ADMIN" } });
    const res = mockResponse();

    await reportController.updateReportStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid status value" }));
  });

  it("should return 404 if report not found", async () => {
    Report.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockRequest({ status: "ADMIN_VERIFIED" }, { id: "Report-X" }, {}, { user: { role: "ADMIN" } });
    const res = mockResponse();

    await reportController.updateReportStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should update status and return report", async () => {
    const updated = { _id: "Report-1", status: "ADMIN_VERIFIED" };
    Report.findByIdAndUpdate.mockResolvedValue(updated);

    const req = mockRequest({ status: "ADMIN_VERIFIED" }, { id: "Report-1" }, {}, { user: { role: "ADMIN" } });
    const res = mockResponse();

    await reportController.updateReportStatusAdmin(req, res);

    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
      "Report-1",
      { status: "ADMIN_VERIFIED" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it("should return 500 on error", async () => {
    Report.findByIdAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({ status: "ADMIN_VERIFIED" }, { id: "Report-1" }, {}, { user: { role: "ADMIN" } });
    const res = mockResponse();

    await reportController.updateReportStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB error" }));
  });
});