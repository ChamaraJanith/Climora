// tests/unit/commentController.test.js

jest.mock("../../models/ReportComment");
jest.mock("../../models/Report");

const ReportComment = require("../../models/ReportComment");
const Report = require("../../models/Report");

const commentController = require("../../controller/commentController");
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
// addComment
// ===============================
describe("addComment", () => {
  it("should return 401 if not authorized", async () => {
    const req = mockRequest({ text: "hi" }, { id: "Report-1" }, {}, { user: undefined });
    const res = mockResponse();

    await commentController.addComment(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Not authorized" }));
  });

  it("should return 400 if text missing", async () => {
    const req = mockRequest({ text: "   " }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await commentController.addComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "text is required" }));
  });

  it("should return 404 if report not found", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ text: "ok" }, { id: "Report-404" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await commentController.addComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Report not found" }));
  });

  it("should return 403 if report not ADMIN_VERIFIED", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "PENDING" }),
    });

    const req = mockRequest({ text: "ok" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await commentController.addComment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Comments allowed only for ADMIN_VERIFIED reports" })
    );
  });

  it("should create comment and inc commentCount", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });

    ReportComment.create.mockResolvedValue({ _id: "Comment-1", text: "ok" });
    Report.findByIdAndUpdate.mockResolvedValue(true);

    const req = mockRequest({ text: "ok" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await commentController.addComment(req, res);

    expect(ReportComment.create).toHaveBeenCalledWith({
      reportId: "Report-1",
      userId: "User-1",
      text: "ok",
    });
    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith("Report-1", { $inc: { commentCount: 1 } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: "Comment-1" }));
  });

  it("should return 400 on error", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });
    ReportComment.create.mockRejectedValue(new Error("Create fail"));

    const req = mockRequest({ text: "ok" }, { id: "Report-1" }, {}, { user: { userId: "User-1" } });
    const res = mockResponse();

    await commentController.addComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Create fail" }));
  });
});

// ===============================
// getComments
// ===============================
describe("getComments", () => {
  it("should return 404 if report not found", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { id: "Report-404" });
    const res = mockResponse();

    await commentController.getComments(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Report not found" }));
  });

  it("should hide comments when report not ADMIN_VERIFIED (404)", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "PENDING" }),
    });

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await commentController.getComments(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Report not found" }));
  });

  it("should return sorted comments list", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });

    ReportComment.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: "C1" }, { _id: "C2" }]),
    });

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await commentController.getComments(req, res);

    expect(ReportComment.find).toHaveBeenCalledWith({ reportId: "Report-1" });
    expect(res.json).toHaveBeenCalledWith([{ _id: "C1" }, { _id: "C2" }]);
  });

  it("should return 500 on error", async () => {
    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });

    ReportComment.find.mockImplementation(() => {
      throw new Error("DB fail");
    });

    const req = mockRequest({}, { id: "Report-1" });
    const res = mockResponse();

    await commentController.getComments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB fail" }));
  });
});

// ===============================
// deleteComment
// ===============================
describe("deleteComment", () => {
  it("should return 401 if not authorized", async () => {
    const req = mockRequest({}, { commentId: "Comment-1" }, {}, { user: undefined });
    const res = mockResponse();

    await commentController.deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 404 if comment not found", async () => {
    ReportComment.findById.mockResolvedValue(null);

    const req = mockRequest({}, { commentId: "Comment-X" }, {}, { user: { userId: "User-1", role: "USER" } });
    const res = mockResponse();

    await commentController.deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Comment not found" }));
  });

  it("should return 403 if not owner/admin", async () => {
    ReportComment.findById.mockResolvedValue({ _id: "Comment-1", userId: "User-A", reportId: "Report-1" });

    const req = mockRequest({}, { commentId: "Comment-1" }, {}, { user: { userId: "User-B", role: "USER" } });
    const res = mockResponse();

    await commentController.deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Not allowed" }));
  });

  it("should return 404 if report not found", async () => {
    ReportComment.findById.mockResolvedValue({ _id: "Comment-1", userId: "User-1", reportId: "Report-404", deleteOne: jest.fn() });

    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({}, { commentId: "Comment-1" }, {}, { user: { userId: "User-1", role: "USER" } });
    const res = mockResponse();

    await commentController.deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Report not found" }));
  });

  it("should return 403 if report not verified and user not admin", async () => {
    ReportComment.findById.mockResolvedValue({ _id: "Comment-1", userId: "User-1", reportId: "Report-1", deleteOne: jest.fn() });

    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "PENDING" }),
    });

    const req = mockRequest({}, { commentId: "Comment-1" }, {}, { user: { userId: "User-1", role: "USER" } });
    const res = mockResponse();

    await commentController.deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Cannot manage comments unless report is ADMIN_VERIFIED" })
    );
  });

  it("should delete comment and dec commentCount (owner)", async () => {
    const commentDoc = {
      _id: "Comment-1",
      userId: "User-1",
      reportId: "Report-1",
      deleteOne: jest.fn().mockResolvedValue(true),
    };

    ReportComment.findById.mockResolvedValue(commentDoc);

    Report.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "Report-1", status: "ADMIN_VERIFIED" }),
    });

    Report.findByIdAndUpdate.mockResolvedValue(true);

    const req = mockRequest({}, { commentId: "Comment-1" }, {}, { user: { userId: "User-1", role: "USER" } });
    const res = mockResponse();

    await commentController.deleteComment(req, res);

    expect(commentDoc.deleteOne).toHaveBeenCalled();
    expect(Report.findByIdAndUpdate).toHaveBeenCalledWith("Report-1", { $inc: { commentCount: -1 } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Comment deleted successfully" }));
  });

  it("should return 500 on error", async () => {
    ReportComment.findById.mockRejectedValue(new Error("DB error"));

    const req = mockRequest({}, { commentId: "Comment-1" }, {}, { user: { userId: "User-1", role: "USER" } });
    const res = mockResponse();

    await commentController.deleteComment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "DB error" }));
  });
});