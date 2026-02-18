const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Helper function for clean logs
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
      return res.status(400).json({ error: "Email already exists" });

    const user = await User.create({
      username,
      email,
      password,
      provider: "LOCAL",
    });

    logAction("POST", "/api/auth/register", `USER CREATED: ${user.userId || user._id}`);

    res.status(201).json({
      token: generateToken(user),
      user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
      return res.status(401).json({ error: "Invalid credentials" });

    if (!(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid credentials" });

    logAction("POST", "/api/auth/login", `LOGIN SUCCESS: ${user.userId || user._id}`);

    res.json({
      token: generateToken(user),
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========================
// GOOGLE LOGIN
// ========================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken)
      return res.status(400).json({ error: "idToken is required" });

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

      logAction("POST", "/api/auth/google", `GOOGLE USER CREATED: ${user.userId || user._id}`);
    } else {
      logAction("POST", "/api/auth/google", `GOOGLE LOGIN SUCCESS: ${user.userId || user._id}`);
    }

    const token = generateToken(user);

    res.json({
      message: "Google login successful",
      token,
      user,
    });
  } catch (err) {
    res.status(401).json({
      error: "Google authentication failed",
      details: err.message,
    });
  }
};

// ========================
// GET PROFILE
// ========================
exports.getProfile = async (req, res) => {
  logAction("GET", "/api/auth/profile", `PROFILE VIEWED: ${req.user.userId || req.user._id}`);
  res.json(req.user);
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

    logAction("PUT", "/api/auth/profile", `PROFILE UPDATED: ${user.userId || user._id}`);

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
      return res.status(401).json({ error: "Current password incorrect" });

    user.password = newPassword;
    await user.save();

    logAction("PUT", "/api/auth/password", `PASSWORD UPDATED: ${user.userId || user._id}`);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ========================
// ADMIN - READ ALL USERS
// ========================
exports.getUsers = async (req, res) => {
  const users = await User.find();

  logAction("GET", "/api/auth/users", `ADMIN FETCHED ALL USERS`);

  res.json(users);
};

// ========================
// ADMIN - UPDATE USER
// ========================
exports.adminUpdateUser = async (req, res) => {
  try {
    const { username, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ error: "User not found" });

    if (username) user.username = username;
    if (role) user.role = role;
    if (typeof isActive !== "undefined") user.isActive = isActive;

    await user.save();

    logAction("PUT", "/api/auth/users/:id", `ADMIN UPDATED USER: ${user.userId || user._id}`);

    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ========================
// ADMIN - DELETE USER
// ========================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user)
      return res.status(404).json({ error: "User not found" });

    logAction("DELETE", "/api/auth/users/:id", `USER DELETED: ${user.userId || user._id}`);

    res.json({
      message: "User permanently deleted",
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to delete user",
      details: err.message,
    });
  }
};