const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: String, required: true },
    time: { type: String, default: "" },
    endTime: { type: String, default: "" },
    expectedFeeling: { type: String, default: null },
    actualFeeling: { type: String, default: null },
    clientId: { type: String, default: null },
  },
  { timestamps: true }
);

calendarEventSchema.index({ user: 1, date: 1 });
calendarEventSchema.index({ user: 1, createdAt: -1 });
calendarEventSchema.index({ user: 1, clientId: 1 }, { sparse: true });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
