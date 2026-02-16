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

// ========================
// REGISTER (LOCAL)
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
// LOGIN (LOCAL)
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
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { sub, email, name } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new Google user
      user = await User.create({
        username: name,
        email,
        provider: "GOOGLE",
        googleId: sub,
      });
    }

    res.json({
      token: generateToken(user),
      user,
    });
  } catch (err) {
    console.error("Google Login Error:", err.message);
    res.status(401).json({ error: "Google authentication failed" });
  }
};

// ========================
// PROFILE
// ========================
exports.getProfile = async (req, res) => {
  res.json(req.user);
};

// ========================
// ADMIN ROUTES
// ========================
exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};