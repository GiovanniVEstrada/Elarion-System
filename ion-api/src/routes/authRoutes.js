const express = require("express");
const {
  register, login, getMe,
  updateMe, changePassword, deleteMe, exportData,
} = require("../controllers/authController");
const protect = require("../middleware/protect");
const validate = require("../middleware/validate");
const {
  registerSchema, loginSchema,
  updateMeSchema, changePasswordSchema,
} = require("../validation/schemas");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);
router.get("/me",        protect, getMe);
router.patch("/me",      protect, validate(updateMeSchema), updateMe);
router.patch("/password", protect, validate(changePasswordSchema), changePassword);
router.delete("/me",     protect, deleteMe);
router.get("/export",    protect, exportData);

module.exports = router;
