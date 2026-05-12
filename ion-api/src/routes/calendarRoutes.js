const express = require("express");
const { getEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/calendarController");
const validate = require("../middleware/validate");
const { calendarEventSchema, calendarEventUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/",        getEvents);
router.post("/",       validate(calendarEventSchema), createEvent);
router.patch("/:id",   validate(calendarEventUpdateSchema), updateEvent);
router.delete("/:id",  deleteEvent);

module.exports = router;
