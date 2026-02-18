const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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

// ========================
// CREATE - REGISTER
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
// ========================
// GOOGLE LOGIN
// ========================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // 1️ Check if idToken exists
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    console.log("Received Google idToken...");

    // 2️ Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    console.log("Google Payload:", payload);

    const { sub, email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: "Email not provided by Google" });
    }

    // 3️ Check if user exists
    let user = await User.findOne({ email });

    // 4️ Create user if not exists
    if (!user) {
      console.log("Creating new Google user...");

      user = await User.create({
        username: name,
        email,
        provider: "GOOGLE",
        googleId: sub,
      });
    }

    // 5️ Prevent login if user deactivated
    if (user.isActive === false) {
      return res.status(403).json({ error: "User account is deactivated" });
    }

    // 6️ Generate JWT
    const token = generateToken(user);

    res.status(200).json({
      message: "Google login successful",
      token,
      user,
    });

  } catch (err) {
    console.error("🔥 FULL GOOGLE LOGIN ERROR:", err);
    res.status(401).json({
      error: "Google authentication failed",
      details: err.message,
    });
  }
};


// ========================
// READ - PROFILE
// ========================
exports.getProfile = async (req, res) => {
  res.json(req.user);
};

// ========================
// UPDATE - PROFILE
// ========================
exports.updateProfile = async (req, res) => {
  try {
    const { username, location } = req.body;

    const user = await User.findById(req.user._id);

    if (username) user.username = username;
    if (location) user.location = location;

    await user.save();

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ========================
// UPDATE - PASSWORD
// ========================
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ error: "Current password incorrect" });

    user.password = newPassword;
    await user.save();

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

    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ========================
// ADMIN - DELETE (HARD DELETE)
// ========================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User permanently deleted from database",
    });

  } catch (err) {
    res.status(500).json({
      error: "Failed to delete user",
      details: err.message,
    });
  }
};