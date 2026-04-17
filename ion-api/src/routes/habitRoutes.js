const express = require("express");
const {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
} = require("../controllers/habitController");
const validate = require("../middleware/validate");
const { habitSchema, habitUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", getHabits);
router.post("/", validate(habitSchema), createHabit);
router.patch("/:id", validate(habitUpdateSchema), updateHabit);
router.delete("/:id", deleteHabit);
router.post("/:id/complete", completeHabit);

module.exports = router;
