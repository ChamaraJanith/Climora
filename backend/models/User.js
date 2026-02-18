const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Professional Custom ID
    userId: {
      type: String,
      unique: true,
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    provider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    location: {
      district: String,
      city: String,
      lat: Number,
      lon: Number,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

//
// =====================================
// AUTO GENERATE USER ID (NO next())
// =====================================
userSchema.pre("save", async function () {
  if (!this.isNew) return;

  const count = await mongoose.model("User").countDocuments();
  const nextNumber = count + 1;

  this.userId = `USER-${String(nextNumber).padStart(5, "0")}`;
});

//
// =====================================
// HASH PASSWORD (NO next())
// =====================================
userSchema.pre("save", async function () {
  if (this.provider !== "LOCAL") return;

  // Password required for LOCAL users
  if (this.isNew && !this.password) {
    throw new Error("Password is required for local users");
  }

  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//
// =====================================
// COMPARE PASSWORD METHOD
// =====================================
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);