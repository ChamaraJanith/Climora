// authController.js

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ========================
// GENERATE JWT
// ========================
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, userId: user.userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// ========================
// LOG HELPER
// ========================
const logAction = (method, route, message) => {
  console.log("==============================================");
  console.log(`📥 ${method} ${route}`);
  console.log(`✅ ${message}`);
  console.log("==============================================");
};

// ========================
// REGISTER
// ========================
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({
      username,
      email,
      password,
      provider: "LOCAL",
    });

    logAction("POST", "/api/auth/register", `USER CREATED: ${user.userId}`);

    res.status(201).json({
      success: true,
      token: generateToken(user),
      user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ========================
// LOGIN
// ========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || user.provider !== "LOCAL")
      return res.status(401).json({ message: "Invalid credentials" });

    if (!(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    logAction("POST", "/api/auth/login", `LOGIN SUCCESS: ${user.userId}`);

    res.json({
      success: true,
      token: generateToken(user),
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================
// GOOGLE LOGIN
// ========================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: name,
        email,
        provider: "GOOGLE",
        googleId: sub,
      });

      logAction("POST", "/api/auth/google", `GOOGLE USER CREATED: ${user.userId}`);
    } else {
      logAction("POST", "/api/auth/google", `GOOGLE LOGIN SUCCESS: ${user.userId}`);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    res.status(401).json({
      message: "Google authentication failed",
      details: err.message,
    });
  }
};

// ========================
// GET PROFILE
// ========================
exports.getProfile = async (req, res) => {
  logAction("GET", "/api/auth/profile", `PROFILE VIEWED: ${req.user.userId}`);
  res.json({
    success: true,
    user: req.user,
  });
};

// ========================
// UPDATE PROFILE
// ========================
exports.updateProfile = async (req, res) => {
  try {
    const { username, location } = req.body;

    const user = await User.findById(req.user._id);

    if (username) user.username = username;
    if (location) user.location = location;

    await user.save();

    logAction("PUT", "/api/auth/profile", `PROFILE UPDATED: ${user.userId}`);

    res.json({
      success: true,
      message: "Profile updated",
      user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ========================
// UPDATE PASSWORD
// ========================
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: "Current password incorrect" });

    user.password = newPassword;
    await user.save();

    logAction("PUT", "/api/auth/password", `PASSWORD UPDATED: ${user.userId}`);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ========================
// ADMIN - GET ALL USERS
// ========================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();

    logAction(
      "GET",
      "/api/auth/users",
      `ADMIN (${req.user.userId}) FETCHED ALL USERS`
    );

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================
// GET USER BY MONGO ID
// ========================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (
      req.user.role !== "ADMIN" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    logAction(
      "GET",
      "/api/auth/users/:id",
      `USER FETCHED: ${user.userId}`
    );

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(400).json({ message: "Invalid user ID" });
  }
};

// ========================
// UPDATE USER BY MONGO ID
// ========================
exports.updateUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (
      req.user.role !== "ADMIN" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { username, role, isActive } = req.body;

    if (username) user.username = username;

    if (req.user.role === "ADMIN") {
      if (role) user.role = role;
      if (typeof isActive !== "undefined") user.isActive = isActive;
    }

    await user.save();

    logAction(
      "PUT",
      "/api/auth/users/:id",
      `USER UPDATED: ${user.userId}`
    );

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ========================
// DELETE USER BY MONGO ID
// ========================
exports.deleteUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (
      req.user.role !== "ADMIN" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await user.deleteOne();

    logAction(
      "DELETE",
      "/api/auth/users/:id",
      `USER DELETED: ${user.userId}`
    );

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete user",
      details: err.message,
    });
  }
};


// POST /api/auth/users/staff  (ADMIN only)
exports.createStaffUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!["ADMIN", "SHELTER_MANAGER", "CONTENT_MANAGER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
      provider: "LOCAL",
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
