const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    category: {
      type: String,
      default: "general",
    },
    dueDate: {
      type: Date,
    },
    energyLevel: {
      type: String,
      enum: ["low", "medium", "high", null],
      default: null,
    },
    intent: {
      type: String,
      default: null,
    },
    alignmentScore: {
      type: Number,
      min: 1,
      max: 3,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);