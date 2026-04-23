const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    completedDates: {
      type: [Date],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    cachedStreak: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

habitSchema.index({ user: 1, createdAt: -1 });
habitSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model("Habit", habitSchema);
