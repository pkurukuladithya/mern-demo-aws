require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "saviya-local-development-jwt-secret-change-me-before-production";

if (!process.env.JWT_SECRET) {
  console.warn(
    "JWT_SECRET is missing. Using fallback secret; set JWT_SECRET in production."
  );
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  jwtSecret: JWT_SECRET
};
