const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: {
      type: String,
      required: true,
    },
    predictedMood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "awful", null],
      default: null,
    },
    actualMood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "awful", null],
      default: null,
    },
    alignmentAverage: {
      type: Number,
      min: 1,
      max: 3,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

reflectionSchema.index({ user: 1, date: -1 }, { unique: true });

module.exports = mongoose.model("Reflection", reflectionSchema);
