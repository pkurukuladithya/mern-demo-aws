const express = require("express");
const { isDbConnected } = require("../config/db");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "Saviya backend",
    dbConnected: isDbConnected()
  });
});

module.exports = router;
