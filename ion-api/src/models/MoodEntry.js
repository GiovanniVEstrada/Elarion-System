const mongoose = require("mongoose");

const moodEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "awful"],
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
  },
  {
    timestamps: true,
  }
);

moodEntrySchema.index({ user: 1, date: -1 });
moodEntrySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("MoodEntry", moodEntrySchema);
