const express = require('express');

const {
    register,
    login,
    googleLogin,
    getProfile,
    updateProfile,
    updatePassword,
    getUsers,
    adminUpdateUser,
    deleteUser,
} = require('../controller/authController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/google', googleLogin);

authRouter.get('/profile', protect, getProfile);
authRouter.put('/profile', protect, updateProfile);
authRouter.put('/password', protect, updatePassword);

authRouter.get('/users', protect, adminOnly, getUsers);
authRouter.put('/users/:id', protect, adminOnly, adminUpdateUser);
authRouter.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = authRouter;