const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin); 

router.get("/profile", protect, authController.getProfile);

router.get("/users", protect, adminOnly, authController.getUsers);
router.delete("/users/:id", protect, adminOnly, authController.deleteUser);

module.exports = router;