const { isDbConnected } = require("../config/db");

const requireDb = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      message: "Database is currently unavailable",
      dbConnected: false
    });
  }

  next();
};

module.exports = requireDb;
