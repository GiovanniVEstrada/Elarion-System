const express = require("express");
const { getEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/calendarController");

const router = express.Router();

router.get("/",        getEvents);
router.post("/",       createEvent);
router.patch("/:id",   updateEvent);
router.delete("/:id",  deleteEvent);

module.exports = router;
