const CalendarEvent = require("../models/CalendarEvent");
const asyncHandler = require("../utils/asyncHandler");

const getEvents = asyncHandler(async (req, res) => {
  const events = await CalendarEvent.find({ user: req.user._id }).sort({ date: 1, time: 1 });
  res.status(200).json({ success: true, data: events });
});

const createEvent = asyncHandler(async (req, res) => {
  const { title, date, time, expectedFeeling, clientId } = req.body || {};

  // Upsert by clientId to prevent duplicates during localStorage migration
  if (clientId) {
    const event = await CalendarEvent.findOneAndUpdate(
      { user: req.user._id, clientId },
      { title, date, time: time || "", expectedFeeling: expectedFeeling || null, clientId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json({ success: true, data: event });
  }

  const event = await CalendarEvent.create({
    user: req.user._id,
    title,
    date,
    time: time || "",
    expectedFeeling: expectedFeeling || null,
  });

  res.status(201).json({ success: true, data: event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  res.status(200).json({ success: true, data: event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  res.status(200).json({ success: true, data: { message: "Event deleted" } });
});

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
