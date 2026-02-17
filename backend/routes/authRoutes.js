const express = require("express");
const authrouter = express.Router();
const authController = require("../controller/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

authrouter.post("/register", authController.register);
authrouter.post("/login", authController.login);
authrouter.post("/google", authController.googleLogin); 

authrouter.get("/profile", protect, authController.getProfile);

authrouter.get("/users", protect, adminOnly, authController.getUsers);
authrouter.delete("/users/:id", protect, adminOnly, authController.deleteUser);

module.exports = authrouter;