const Task = require("../models/Task");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const getTasks = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };

  if (req.query.completed !== undefined) {
    filter.completed = req.query.completed === "true";
  }
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  if (req.query.search && req.query.search.trim()) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ title: pattern }, { intent: pattern }];
  }

  const sortField = req.query.sort || "-createdAt";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sortField).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(tasks, total));
});

const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    completed,
    priority,
    category,
    dueDate,
    energyLevel,
    intent,
    alignmentScore,
    postMood,
  } =
    req.body || {};

  const task = await Task.create({
    user: req.user._id,
    title,
    completed,
    priority,
    category,
    dueDate,
    energyLevel,
    intent,
    alignmentScore,
    postMood,
  });

  res.status(201).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const updatedTask = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { returnDocument: "after", runValidators: true }
  );

  if (!updatedTask) {
    return res.status(404).json({ success: false, message: "Task not found", errors: [] });
  }

  res.status(200).json({ success: true, data: updatedTask });
});

const deleteTask = asyncHandler(async (req, res) => {
  const deletedTask = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!deletedTask) {
    return res.status(404).json({ success: false, message: "Task not found", errors: [] });
  }

  res.status(200).json({ success: true, data: { message: "Task deleted successfully" } });
});

module.exports = { getTasks, createTask, updateTask, deleteTask };
