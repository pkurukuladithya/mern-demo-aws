const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { normalizeEmail, serializeUser, signToken } = require("../utils/auth");
const authMiddleware = require("../middleware/authMiddleware");
const requireDb = require("../middleware/requireDb");

const router = express.Router();

router.post(
  "/register",
  requireDb,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const requestedRole = req.body.role || "parent";
    const role = ["parent", "responder", "admin"].includes(requestedRole)
      ? requestedRole
      : "parent";

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: normalizeEmail(email) });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizeEmail(email),
      passwordHash,
      role
    });

    return res.status(201).json({
      token: signToken(user),
      user: serializeUser(user)
    });
  })
);

router.post(
  "/login",
  requireDb,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      token: signToken(user),
      user: serializeUser(user)
    });
  })
);

router.get(
  "/me",
  authMiddleware,
  requireDb,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: serializeUser(user) });
  })
);

module.exports = router;
