const express = require("express");
const router = express.Router();
const { getReflections, upsertReflection, updateReflection } = require("../controllers/reflectionController");

router.get("/",          getReflections);
router.post("/",         upsertReflection);
router.patch("/:date",   updateReflection);

module.exports = router;
