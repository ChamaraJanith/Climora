// tests/unit/authController.test.js

jest.mock("../../models/User");

// jwt mock
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

/**
 * ✅ IMPORTANT:
 * Jest hoists jest.mock() factories.
 * To safely reference a variable inside the factory, the variable name must start with "mock".
 */
let mockVerifyIdToken;

jest.mock("google-auth-library", () => {
  mockVerifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const authController = require("../../controller/authController");
const { mockRequest, mockResponse } = require("./testUtils/mockExpress");

// silence logs during tests
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AUTH Controller", () => {
  // ========================
  // REGISTER
  // ========================
  describe("register", () => {
    it("should return 400 if email already exists", async () => {
      User.findOne.mockResolvedValue({ _id: "mongo1" });

      const req = mockRequest({
        username: "A",
        email: "a@test.com",
        password: "123456",
      });
      const res = mockResponse();

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: "a@test.com" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
    });

    it("should create user and return 201 with token", async () => {
      User.findOne.mockResolvedValue(null);

      const createdUser = {
        _id: "mongo2",
        userId: "User-00001",
        username: "A",
        email: "a@test.com",
        provider: "LOCAL",
      };

      User.create.mockResolvedValue(createdUser);
      jwt.sign.mockReturnValue("token123");

      const req = mockRequest(
        { username: "A", email: "a@test.com", password: "123456" },
        {},
        {},
        { method: "POST", originalUrl: "/api/auth/register" }
      );
      const res = mockResponse();

      await authController.register(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "A",
          email: "a@test.com",
          password: "123456",
          provider: "LOCAL",
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: "token123",
          user: createdUser,
        })
      );
    });

    it("should return 400 on error (Node 22 safe)", async () => {
      User.findOne.mockImplementation(() => {
        throw new Error("DB error");
      });

      const req = mockRequest({
        username: "A",
        email: "a@test.com",
        password: "123456",
      });
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "DB error" }));
    });
  });

  // ========================
  // LOGIN
  // ========================
  describe("login", () => {
    it("should return 401 if user not found", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = mockRequest({ email: "a@test.com", password: "123456" });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return 401 if provider is not LOCAL", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "mongo1",
          provider: "GOOGLE",
          comparePassword: jest.fn(),
        }),
      });

      const req = mockRequest({ email: "a@test.com", password: "123456" });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return 401 if password mismatch", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "mongo1",
          provider: "LOCAL",
          comparePassword: jest.fn().mockResolvedValue(false),
        }),
      });

      const req = mockRequest({ email: "a@test.com", password: "wrong" });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return success with token on valid login", async () => {
      const userDoc = {
        _id: "mongo1",
        userId: "User-00001",
        provider: "LOCAL",
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userDoc),
      });

      jwt.sign.mockReturnValue("token123");

      const req = mockRequest(
        { email: "a@test.com", password: "123456" },
        {},
        {},
        { method: "POST", originalUrl: "/api/auth/login" }
      );
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: "token123",
          user: userDoc,
        })
      );
    });

    it("should return 500 on server error (Node 22 safe)", async () => {
      User.findOne.mockImplementation(() => {
        throw new Error("Crash");
      });

      const req = mockRequest({ email: "a@test.com", password: "123" });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Crash" }));
    });
  });

  // ========================
  // GOOGLE LOGIN ✅ FIXED
  // ========================
  describe("googleLogin", () => {
    it("should create new GOOGLE user if not exists", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: "googleSub",
          email: "g@test.com",
          name: "GUser",
        }),
      });

      User.findOne.mockResolvedValue(null);

      const created = {
        _id: "mongoG",
        userId: "User-00010",
        email: "g@test.com",
        provider: "GOOGLE",
      };

      User.create.mockResolvedValue(created);
      jwt.sign.mockReturnValue("tokenG");

      const req = mockRequest(
        { idToken: "idtoken" },
        {},
        {},
        { method: "POST", originalUrl: "/api/auth/google" }
      );
      const res = mockResponse();

      await authController.googleLogin(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "GUser",
          email: "g@test.com",
          provider: "GOOGLE",
          googleId: "googleSub",
        })
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: "tokenG",
          user: created,
        })
      );
    });

    it("should login existing user (no create)", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: "googleSub",
          email: "g@test.com",
          name: "GUser",
        }),
      });

      const existing = {
        _id: "mongoG",
        userId: "User-00010",
        email: "g@test.com",
      };
      User.findOne.mockResolvedValue(existing);

      jwt.sign.mockReturnValue("tokenG");

      const req = mockRequest({ idToken: "idtoken" });
      const res = mockResponse();

      await authController.googleLogin(req, res);

      expect(User.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: "tokenG",
          user: existing,
        })
      );
    });

    it("should return 401 if google auth fails", async () => {
      mockVerifyIdToken.mockImplementation(() => {
        throw new Error("Bad token");
      });

      const req = mockRequest({ idToken: "bad" });
      const res = mockResponse();

      await authController.googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Google authentication failed",
          details: "Bad token",
        })
      );
    });
  });
});