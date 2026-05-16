const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Task = require("../models/Task");
const Habit = require("../models/Habit");
const JournalEntry = require("../models/JournalEntry");
const MoodEntry = require("../models/MoodEntry");
const CalendarEvent = require("../models/CalendarEvent");
const Reflection = require("../models/Reflection");
const asyncHandler = require("../utils/asyncHandler");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ success: false, message: "Email already registered", errors: [] });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      focusAreas: user.focusAreas,
      baselineMood: user.baselineMood,
      token: generateToken(user._id),
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password", errors: [] });
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      focusAreas: user.focusAreas,
      baselineMood: user.baselineMood,
      token: generateToken(user._id),
    },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

// PATCH /api/auth/me — update profile / onboarding fields
const updateMe = asyncHandler(async (req, res) => {
  const { name, onboardingComplete, focusAreas, baselineMood } = req.body;
  const updates = {};
  if (name             !== undefined) updates.name              = name;
  if (onboardingComplete !== undefined) updates.onboardingComplete = onboardingComplete;
  if (focusAreas       !== undefined) updates.focusAreas        = focusAreas;
  if (baselineMood     !== undefined) updates.baselineMood      = baselineMood;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json({ success: true, data: user });
});

// PATCH /api/auth/password — change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: "Password updated" });
});

// DELETE /api/auth/me — delete account + all user data
const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Promise.all([
    Task.deleteMany({ user: userId }),
    Habit.deleteMany({ user: userId }),
    JournalEntry.deleteMany({ user: userId }),
    MoodEntry.deleteMany({ user: userId }),
    CalendarEvent.deleteMany({ user: userId }),
    Reflection.deleteMany({ user: userId }),
    User.findByIdAndDelete(userId),
  ]);

  res.status(200).json({ success: true, message: "Account deleted" });
});

// GET /api/auth/export — download all user data as JSON
const exportData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [tasks, habits, journal, moods, calendar] = await Promise.all([
    Task.find({ user: userId }).select("-user -__v"),
    Habit.find({ user: userId }).select("-user -__v"),
    JournalEntry.find({ user: userId }).select("-user -__v"),
    MoodEntry.find({ user: userId }).select("-user -__v"),
    CalendarEvent.find({ user: userId }).select("-user -__v"),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { name: req.user.name, email: req.user.email },
    tasks,
    habits,
    journal,
    moods,
    calendar,
  };

  res.setHeader("Content-Disposition", `attachment; filename="elarion-export-${Date.now()}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(payload);
});

module.exports = { register, login, getMe, updateMe, changePassword, deleteMe, exportData };
