const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing. Check backend/.env file.");
  process.exit(1);
}

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Task = mongoose.model("Task", taskSchema);

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    message: "MERN backend is working on AWS EC2"
  });
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error.message);
    res.status(500).json({ message: "Failed to get tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const task = await Task.create({ title });
    res.status(201).json(task);
  } catch (error) {
    console.error("POST /api/tasks error:", error.message);
    res.status(500).json({ message: "Failed to create task" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("DELETE /api/tasks error:", error.message);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Backend running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
