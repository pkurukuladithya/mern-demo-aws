const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.set("bufferCommands", false);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "saviya-local-development-jwt-secret-change-me-before-production";

if (!process.env.JWT_SECRET) {
  console.warn(
    "JWT_SECRET is missing. Using fallback secret; set JWT_SECRET in production."
  );
}

const isDbConnected = () => mongoose.connection.readyState === 1;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["parent", "responder", "admin"],
    default: "parent"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    senderRole: {
      type: String,
      enum: ["parent", "responder", "admin"],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    childName: {
      type: String,
      required: true,
      trim: true
    },
    grade: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting_parent", "resolved", "closed"],
      default: "open"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    createdByName: {
      type: String,
      required: true,
      trim: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    assignedToName: {
      type: String,
      default: "",
      trim: true
    },
    messages: {
      type: [messageSchema],
      default: []
    },
    aiSummary: {
      type: String,
      default: ""
    },
    aiSuggestedReply: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);

const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(`${req.method} ${req.originalUrl} error:`, error.message);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid resource id" });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Duplicate resource" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

const requireDb = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      message: "Database is currently unavailable",
      dbConnected: false
    });
  }

  next();
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Permission denied" });
  }

  next();
};

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canAccessTicket = (user, ticket) =>
  user.role === "responder" ||
  user.role === "admin" ||
  ticket.createdBy.toString() === user.id;

const generateTicketNo = () => `SAV-${Date.now().toString().slice(-8)}`;

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "Saviya / සවිය backend",
    dbConnected: isDbConnected()
  });
});

app.post(
  "/api/auth/register",
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

    res.status(201).json({
      token: signToken(user),
      user: serializeUser(user)
    });
  })
);

app.post(
  "/api/auth/login",
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

    res.json({
      token: signToken(user),
      user: serializeUser(user)
    });
  })
);

app.get(
  "/api/auth/me",
  authMiddleware,
  requireDb,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: serializeUser(user) });
  })
);

app.post(
  "/api/tickets",
  authMiddleware,
  requireDb,
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

    res.status(201).json(ticket);
  })
);

app.get(
  "/api/tickets",
  authMiddleware,
  requireDb,
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
    res.json(tickets);
  })
);

app.get(
  "/api/tickets/:id",
  authMiddleware,
  requireDb,
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    res.json(ticket);
  })
);

app.post(
  "/api/tickets/:id/messages",
  authMiddleware,
  requireDb,
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
    res.status(201).json(ticket);
  })
);

app.patch(
  "/api/tickets/:id/status",
  authMiddleware,
  requireDb,
  requireRole("responder", "admin"),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const statuses = [
      "open",
      "in_progress",
      "waiting_parent",
      "resolved",
      "closed"
    ];

    if (!statuses.includes(status)) {
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

    res.json(ticket);
  })
);

app.patch(
  "/api/tickets/:id/priority",
  authMiddleware,
  requireDb,
  requireRole("responder", "admin"),
  asyncHandler(async (req, res) => {
    const { priority } = req.body;
    const priorities = ["low", "medium", "high", "urgent"];

    if (!priorities.includes(priority)) {
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

    res.json(ticket);
  })
);

app.get(
  "/api/dashboard/stats",
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

    res.json({
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

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  console.error("Unhandled error:", error.message);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Saviya backend running on http://127.0.0.1:${PORT}`);
});

if (!MONGO_URI) {
  console.error("MONGO_URI is missing. DB routes will return 503.");
} else {
  mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    })
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
    });
}
