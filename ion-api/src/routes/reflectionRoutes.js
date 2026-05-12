const express = require("express");
const router = express.Router();
const { getReflections, upsertReflection, updateReflection } = require("../controllers/reflectionController");
const validate = require("../middleware/validate");
const { reflectionSchema, reflectionUpdateSchema } = require("../validation/schemas");

router.get("/",          getReflections);
router.post("/",         validate(reflectionSchema), upsertReflection);
router.patch("/:date",   validate(reflectionUpdateSchema), updateReflection);

module.exports = router;
