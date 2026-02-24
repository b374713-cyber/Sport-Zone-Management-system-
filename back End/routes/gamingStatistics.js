// Back_end/routes/gamingStatistics.js
const express = require("express");
const router = express.Router();

const {
  getGamingStatistics,
} = require("../controllers/gamingStatisticsController");

// IMPORTANT:
// because app.js mounts this router at:
// app.use("/api/gaming/statistics", gamingStatsRoutes);
// so here we ONLY use "/"
router.get("/", getGamingStatistics);

module.exports = router;
