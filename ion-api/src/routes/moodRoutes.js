const express = require("express");
const {
  getMoods,
  createMood,
  updateMood,
  deleteMood,
} = require("../controllers/moodController");
const validate = require("../middleware/validate");
const { moodSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", getMoods);
router.post("/", validate(moodSchema), createMood);
router.patch("/:id", updateMood);
router.delete("/:id", deleteMood);

module.exports = router;
