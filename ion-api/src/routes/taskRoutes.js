const express = require("express");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const validate = require("../middleware/validate");
const { taskSchema, taskUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", getTasks);
router.post("/", validate(taskSchema), createTask);
router.patch("/:id", validate(taskUpdateSchema), updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
