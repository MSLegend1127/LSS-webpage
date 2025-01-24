const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb://localhost/auth-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, // Admin field
});

// Hash the password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", userSchema);

// Admin Login
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ error: "Invalid username or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid username or password" });
  }

  if (user.isAdmin) {
    const token = jwt.sign({ userId: user._id, role: "admin" }, "secretkey", { expiresIn: "1h" });
    return res.json({ message: "Admin login successful", token });
  } else {
    return res.status(403).json({ error: "You are not authorized to access admin resources" });
  }
});

// Middleware to authenticate admin users
const authenticateAdmin = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ error: "Authentication token missing" });
  }

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err || decoded.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Create New User
app.post("/admin/create-user", authenticateAdmin, async (req, res) => {
  const { username, email, password, isAdmin } = req.body;

  try {
    const newUser = new User({ username, email, password, isAdmin });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create New Admin (only if an admin is logged in)
app.post("/admin/create-admin", authenticateAdmin, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: true
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin creation script to ensure an admin exists on first run
async function createAdmin() {
  const existingAdmin = await User.findOne({ username: "admin" });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("12345678", 10);
    const adminUser = new User({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      isAdmin: true,
    });

    await adminUser.save();
    console.log("Admin created!");
  } else {
    console.log("Admin already exists.");
  }
}

// Ensure at least one admin exists when the server starts
createAdmin();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
