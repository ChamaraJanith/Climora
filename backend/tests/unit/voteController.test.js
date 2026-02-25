// tests/unit/voteController.test.js

jest.mock("../../models/Report");
jest.mock("../../models/Vote");

const Report = require("../../models/Report");
const Vote = require("../../models/Vote");

const voteController = require("../../controller/voteController");
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

describe("voteReport", () => {
  it("should return 401 if not authorized", async () => {
    const req = mockRequest({ voteType: "UP" }, { id: "Report-1" }, {}, { user: undefined });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Not authorized" }));
  });

  it("should return 400 for invalid voteType", async () => {
    const req = mockRequest({ voteType: "X" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid vote type" }));
  });

  it("should return 404 if report not found", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ voteType: "UP" }, { id: "Report-404" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Report not found" }));
  });

  it("should return 403 if report not ADMIN_VERIFIED", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "PENDING" }),
    });

    const req = mockRequest({ voteType: "UP" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Voting allowed only for ADMIN_VERIFIED reports" })
    );
  });

  it("should create vote if no existing vote (UP)", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });

    Vote.findOne.mockResolvedValue(null);
    Vote.create.mockResolvedValue({ _id: "Vote-1" });
    Report.findByIdAndUpdate.mockResolvedValue(true);

    const req = mockRequest({ voteType: "UP" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(Vote.create).toHaveBeenCalledWith({ reportId: "Report-1", userId: "User-1", voteType: "UP" });
    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith("Report-1", { $inc: { confirmCount: 1 } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Vote added" });
  });

  it("should toggle remove if same vote again", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });

    Vote.findOne.mockResolvedValue({ _id: "Vote-1", voteType: "DOWN" });
    Vote.deleteOne.mockResolvedValue(true);
    Report.findByIdAndUpdate.mockResolvedValue(true);

    const req = mockRequest({ voteType: "DOWN" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(Vote.deleteOne).toHaveBeenCalledWith({ _id: "Vote-1" });
    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith("Report-1", { $inc: { denyCount: -1 } });
    expect(res.json).toHaveBeenCalledWith({ message: "Vote removed" });
  });

  it("should switch vote type and update counts", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });

    const existing = { _id: "Vote-1", voteType: "DOWN", save: jest.fn().mockResolvedValue(true) };
    Vote.findOne.mockResolvedValue(existing);
    Report.findByIdAndUpdate.mockResolvedValue(true);

    const req = mockRequest({ voteType: "UP" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(existing.voteType).toBe("UP");
    expect(existing.save).toHaveBeenCalled();
    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith("Report-1", {
      $inc: { confirmCount: 1, denyCount: -1 },
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Vote switched" });
  });

  it("should return 500 on error", async () => {
    Report.findById.mockImplementation(() => {
      throw new Error("DB fail");
    });

    const req = mockRequest({ voteType: "UP" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await voteController.voteReport(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB fail" }));
  });
});