const express = require("express");
const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middleware/authMiddleware");
const requireDb = require("../middleware/requireDb");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  requireDb,
  asyncHandler(async (req, res) => {
    const baseQuery =
      req.user.role === "parent"
        ? { createdBy: new mongoose.Types.ObjectId(req.user.id) }
        : {};

    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      urgent,
      categoryAgg,
      recentTickets
    ] = await Promise.all([
      Ticket.countDocuments(baseQuery),
      Ticket.countDocuments({ ...baseQuery, status: "open" }),
      Ticket.countDocuments({ ...baseQuery, status: "in_progress" }),
      Ticket.countDocuments({ ...baseQuery, status: "resolved" }),
      Ticket.countDocuments({ ...baseQuery, status: "closed" }),
      Ticket.countDocuments({ ...baseQuery, priority: "urgent" }),
      Ticket.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ]),
      Ticket.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("ticketNo title category priority status createdAt createdByName")
    ]);

    const categoryCounts = categoryAgg.reduce((counts, item) => {
      counts[item._id] = item.count;
      return counts;
    }, {});

    return res.json({
      total,
      open,
      inProgress,
      resolved,
      closed,
      urgent,
      categoryCounts,
      recentTickets
    });
  })
);

module.exports = router;
