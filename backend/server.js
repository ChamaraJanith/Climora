// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

//Add Shelter routes
const shelterRoutes = require("./routes/shelterRoutes");

const app = express();

// ====== Config ======
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ====== Middleware ======
app.use(cors());
app.use(express.json());

//Add Shelter routes
app.use("/api/shelters", shelterRoutes);

// ====== Example Mongoose Model (User) ======
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ====== Routes ======

// Health check
app.get("/", (req, res) => {
  res.json({ message: "MERN backend with MongoDB Atlas is running" });
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a new user
app.post("/api/users", async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: "username and email are required" });
    }

    const user = await User.create({ username, email });
    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ====== DB Connect + Server Start ======
const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB Atlas");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
