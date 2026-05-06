const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const requestController = require("../controllers/requestController");

router.use(protect);
router.get("/", requestController.getAnalytics);

module.exports = router;
