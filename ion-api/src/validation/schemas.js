const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const MOOD_VALUES = ["great", "good", "neutral", "bad", "awful"];

const taskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  intent: Joi.string().max(500).optional().allow(""),
  energyLevel: Joi.string().valid("low", "medium", "high").optional().allow(null),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  category: Joi.string().max(100).optional(),
  completed: Joi.boolean().optional(),
  alignmentScore: Joi.number().min(1).max(3).optional().allow(null),
  postMood: Joi.string().valid(...MOOD_VALUES).optional().allow(null),
  dueDate: Joi.date().optional().allow(null),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  intent: Joi.string().max(500).optional().allow(""),
  energyLevel: Joi.string().valid("low", "medium", "high").optional().allow(null),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  category: Joi.string().max(100).optional(),
  completed: Joi.boolean().optional(),
  alignmentScore: Joi.number().min(1).max(3).optional().allow(null),
  postMood: Joi.string().valid(...MOOD_VALUES).optional().allow(null),
  dueDate: Joi.date().optional().allow(null),
});

const habitSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  frequency: Joi.string().valid("daily", "weekly").optional(),
  description: Joi.string().max(500).optional().allow(""),
});

const habitUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  frequency: Joi.string().valid("daily", "weekly").optional(),
  description: Joi.string().max(500).optional().allow(""),
  active: Joi.boolean().optional(),
  cachedStreak: Joi.number().min(0).optional(),
});

// MoodEntry model uses string values: great, good, neutral, bad, awful
const moodSchema = Joi.object({
  mood: Joi.string().valid("great", "good", "neutral", "bad", "awful").required(),
  note: Joi.string().max(500).optional().allow(""),
  date: Joi.date().optional().allow(null),
});

const updateMeSchema = Joi.object({
  name:               Joi.string().min(2).max(50).optional(),
  onboardingComplete: Joi.boolean().optional(),
  focusAreas:         Joi.array().items(Joi.string().max(50)).max(10).optional(),
  baselineMood:       Joi.string().valid("great", "good", "neutral", "bad", "awful").optional().allow(null, ""),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const reflectionSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  predictedMood: Joi.string().valid("great", "good", "neutral", "bad", "awful").optional().allow(null),
  actualMood: Joi.string().valid("great", "good", "neutral", "bad", "awful").optional().allow(null),
  alignmentAverage: Joi.number().min(1).max(3).optional().allow(null),
  notes: Joi.string().max(2000).optional().allow(""),
});

const reflectionUpdateSchema = Joi.object({
  predictedMood: Joi.string().valid("great", "good", "neutral", "bad", "awful").optional().allow(null),
  actualMood: Joi.string().valid("great", "good", "neutral", "bad", "awful").optional().allow(null),
  alignmentAverage: Joi.number().min(1).max(3).optional().allow(null),
  notes: Joi.string().max(2000).optional().allow(""),
});

module.exports = {
  registerSchema,
  loginSchema,
  taskSchema,
  taskUpdateSchema,
  habitSchema,
  habitUpdateSchema,
  moodSchema,
  updateMeSchema,
  changePasswordSchema,
  reflectionSchema,
  reflectionUpdateSchema,
};
