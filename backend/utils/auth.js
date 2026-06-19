const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: "7d" }
  );

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

module.exports = {
  normalizeEmail,
  serializeUser,
  signToken
};
