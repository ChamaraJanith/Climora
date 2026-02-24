const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===================================
// 🔐 PROTECT ROUTES (JWT VERIFY)
// ===================================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Extract token
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

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Find user (only necessary fields)
    const user = await User.findById(decoded.id).select(
      "_id userId username email role isActive"
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

    // 4️⃣ Attach both IDs clearly
    req.user = {
      _id: user._id,           // Mongo ObjectId
      userId: user.userId,     // 🔥 Custom ID (User-00001)
      username: user.username,
      email: user.email,
      role: user.role,
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
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

