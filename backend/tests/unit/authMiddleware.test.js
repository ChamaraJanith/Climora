// tests/unit/authMiddleware.test.js

jest.mock("../../models/User");

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const User = require("../../models/User");
const jwt = require("jsonwebtoken");

const { protect, adminOnly } = require("../../middleware/authMiddleware");
const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AUTH Middleware", () => {
  // ========================
  // protect
  // ========================
  describe("protect", () => {
    it("should return 401 if no token", async () => {
      const req = mockRequest({}, {}, {}, { headers: {} });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Not authorized. No token provided." })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token invalid", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const req = mockRequest({}, {}, {}, { headers: { authorization: "Bearer badtoken" } });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid or expired token" })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if user not found", async () => {
      jwt.verify.mockReturnValue({ id: "mongo1" });

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = mockRequest({}, {}, {}, { headers: { authorization: "Bearer token" } });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "User not found" }));
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 if account deactivated", async () => {
      jwt.verify.mockReturnValue({ id: "mongo1" });

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "mongo1",
          userId: "User-1",
          username: "A",
          email: "a@test.com",
          role: "USER",
          isActive: false,
          location: {},
        }),
      });

      const req = mockRequest({}, {}, {}, { headers: { authorization: "Bearer token" } });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Account is deactivated" }));
      expect(next).not.toHaveBeenCalled();
    });

    it("should attach req.user and call next on success", async () => {
      jwt.verify.mockReturnValue({ id: "mongo1" });

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "mongo1",
          userId: "User-1",
          username: "A",
          email: "a@test.com",
          role: "ADMIN",
          isActive: true,
          location: { district: "Colombo" },
        }),
      });

      const req = mockRequest({}, {}, {}, { headers: { authorization: "Bearer token" } });
      const res = mockResponse();
      const next = jest.fn();

      await protect(req, res, next);

      expect(req.user).toEqual(
        expect.objectContaining({
          _id: "mongo1",
          userId: "User-1",
          role: "ADMIN",
        })
      );

      expect(next).toHaveBeenCalled();
    });
  });

  // ========================
  // adminOnly
  // ========================
  describe("adminOnly", () => {
    it("should return 403 if not admin", () => {
      const req = mockRequest({}, {}, {}, { user: { role: "USER" } });
      const res = mockResponse();
      const next = jest.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Access denied. Admin only." })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next if admin", () => {
      const req = mockRequest({}, {}, {}, { user: { role: "ADMIN" } });
      const res = mockResponse();
      const next = jest.fn();

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});