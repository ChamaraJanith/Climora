const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===================================
// 🔐 PROTECT ROUTES (JWT VERIFY)
// ===================================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Extract token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user INCLUDING location, profileImage, and notifications
    const user = await User.findById(decoded.id).select(
      "_id userId username email role isActive location profileImage notifications"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Attach user object
    req.user = {
      _id: user._id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role,
      location: user.location,
      profileImage: user.profileImage, // Important for persistence
      notifications: user.notifications || [],
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ===================================
// 🛡 ADMIN ONLY ACCESS
// ===================================
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

