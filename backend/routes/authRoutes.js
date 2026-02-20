const express = require('express');

const {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  updatePassword,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  createStaffUser,
} = require('../controller/authController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

const authRouter = express.Router();

// PUBLIC ROUTES
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/google', googleLogin);

// USER SELF ROUTES
authRouter.get('/profile', protect, getProfile);
authRouter.put('/profile', protect, updateProfile);
authRouter.put('/password', protect, updatePassword);

// ADMIN ROUTES
authRouter.get('/users', protect, adminOnly, getUsers);

// 🔐 ADMIN STAFF MANAGEMENT ROUTES
// create staff user (ADMIN / SHELTER_MANAGER / CONTENT_MANAGER)
authRouter.post('/users/staff', protect, adminOnly, createStaffUser);

// FUTURE: admin can update role via existing updateUserById (body.role)

// ADMIN OR SELF ROUTES
authRouter.get('/users/:id', protect, getUserById);
authRouter.put('/users/:id', protect, updateUserById);
authRouter.delete('/users/:id', protect, deleteUserById);

module.exports = authRouter;
