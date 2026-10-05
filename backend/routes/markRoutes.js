const express = require("express");

const router = express.Router();

const {
  addMark,
  updateMark,
  deleteMark,
} = require("../controllers/markController");

router.post("/:id/marks", addMark);

router.put("/marks/:id", updateMark);

router.delete("/marks/:id", deleteMark);

module.exports = router;