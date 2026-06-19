const express = require("express");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middleware/authMiddleware");
const requireDb = require("../middleware/requireDb");
const requireRole = require("../middleware/requireRole");
const asyncHandler = require("../utils/asyncHandler");
const { canAccessTicket, escapeRegex, generateTicketNo } = require("../utils/tickets");

const router = express.Router();

router.use(authMiddleware, requireDb);

router.post(
  "/",
  requireRole("parent"),
  asyncHandler(async (req, res) => {
    const { title, description, childName, grade, category } = req.body;
    const priority = req.body.priority || "medium";

    if (!title || !description || !childName || !grade || !category) {
      return res.status(400).json({
        message:
          "Title, description, childName, grade, and category are required"
      });
    }

    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    const ticket = await Ticket.create({
      ticketNo: generateTicketNo(),
      title,
      description,
      childName,
      grade,
      category,
      priority,
      createdBy: req.user.id,
      createdByName: req.user.name,
      messages: [
        {
          sender: req.user.id,
          senderName: req.user.name,
          senderRole: req.user.role,
          text: description
        }
      ]
    });

    return res.status(201).json(ticket);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, category, priority, search } = req.query;
    const query = {};

    if (req.user.role === "parent") {
      query.createdBy = req.user.id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    if (search) {
      const pattern = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [
        { ticketNo: pattern },
        { title: pattern },
        { description: pattern },
        { childName: pattern },
        { createdByName: pattern }
      ];
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    return res.json(tickets);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    return res.json(ticket);
  })
);

router.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    ticket.messages.push({
      sender: req.user.id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text
    });

    if (
      ["responder", "admin"].includes(req.user.role) &&
      ticket.status === "open"
    ) {
      ticket.status = "in_progress";
    }

    await ticket.save();
    return res.status(201).json(ticket);
  })
);

router.patch(
  "/:id/status",
  requireRole("responder", "admin"),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = [
      "open",
      "in_progress",
      "waiting_parent",
      "resolved",
      "closed"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.json(ticket);
  })
);

router.patch(
  "/:id/priority",
  requireRole("responder", "admin"),
  asyncHandler(async (req, res) => {
    const { priority } = req.body;
    const validPriorities = ["low", "medium", "high", "urgent"];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.json(ticket);
  })
);

module.exports = router;
