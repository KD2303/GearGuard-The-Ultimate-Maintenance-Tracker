const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const requestController = require("../controllers/requestController");

router.use(protect);
router.get("/", requestController.getAnalytics);
router.get("/leaderboard", requestController.getLeaderboard);
router.get("/root-cause", requestController.getRootCauseAnalytics);

module.exports = router;
