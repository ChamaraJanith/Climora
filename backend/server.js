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
  res.json({ message: "Climate Disaster Preparedness API is running " });
});

// Auth Routes
app.use("/api/auth", authRoutes);

// Shelter Routes
app.use("/api/shelters", shelterRoutes);

// Article Routes
app.use("/api/articles", articleRoutes);

// ====== Global Error Handler ======
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong",
  });
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
    console.error(" Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();