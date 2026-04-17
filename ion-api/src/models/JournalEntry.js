const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "awful"],
      default: "neutral",
    },
    tags: {
      type: [String],
      default: [],
    },
    clarity: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    mentalState: {
      type: String,
      default: null,
    },
    folder: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
