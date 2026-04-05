const express = require('express');

const {
  register,
  login,
  googleAuthRedirect,
  googleAuthCallback,
  getProfile,
  updateProfile,
  updatePassword,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  createStaffUser,
  uploadProfileImage,
  memUpload,
} = require('../controller/authController');

const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User'); // ⬅️ meka add karanna

const authRouter = express.Router();

// PUBLIC ROUTES
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/google', googleAuthRedirect);
authRouter.get('/google/callback', googleAuthCallback);

// USER SELF ROUTES
authRouter.get('/profile', protect, getProfile);
authRouter.put('/profile', protect, updateProfile);
authRouter.put('/password', protect, updatePassword);
authRouter.post('/profile/image', protect, memUpload.single('image'), uploadProfileImage);

// 🔥 NEW: PROFILE BY CUSTOM USER ID (USER-00020)
authRouter.get('/profile/:userId', protect, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // allow ADMIN or same user only
    if (
      req.user.role !== 'ADMIN' &&
      req.user.userId !== req.params.userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log("==============================================");
    console.log("📥 GET /api/auth/profile/:userId");
    console.log(`✅ PROFILE VIEWED BY CODE: ${user.userId}`);
    console.log("==============================================");

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN ROUTES
authRouter.get('/users', protect, adminOnly, getUsers);

// 🔐 ADMIN STAFF MANAGEMENT ROUTES
authRouter.post('/users/staff', protect, adminOnly, createStaffUser);

// ADMIN OR SELF ROUTES (Mongo _id)
authRouter.get('/users/:id', protect, getUserById);
authRouter.put('/users/:id', protect, updateUserById);
authRouter.delete('/users/:id', protect, deleteUserById);

module.exports = authRouter;