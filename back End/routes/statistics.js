// Back_end/routes/statistics.js
const express = require("express");
const sql = require("mssql");
const { getDatabase } = require("../config/database");

const router = express.Router();

/**
 * GET /api/statistics/reservations-calendar?year=2025
 * Returns:
 * {
 *   year: 2025,
 *   days: [
 *     { day: "2025-11-05", reservations_count: 2 },
 *     ...
 *   ]
 * }
 */
router.get("/reservations-calendar", async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const pool = await getDatabase();

    const result = await pool.request()
      .input("year", sql.Int, year)
      .query(`
        SELECT
          CONVERT(varchar(10), CAST(reservation_date AS date), 23) AS day,
          COUNT(*) AS reservations_count
        FROM dbo.MatchReservations
        WHERE YEAR(CAST(reservation_date AS date)) = @year
        GROUP BY CAST(reservation_date AS date)
        ORDER BY day;
      `);

    res.json({
      year,
      days: result.recordset || []
    });
  } catch (err) {
    console.error("❌ reservations-calendar error:", err);
    res.status(500).json({ error: "Failed to load reservations calendar" });
  }
});
/**
 * GET /api/statistics/matches-income
 * Returns:
 * { matchesIncome: 1234.56 }
 */
router.get("/matches-income", async (req, res) => {
  try {
    const pool = await getDatabase();

    const result = await pool.request().query(`
      SELECT ISNULL(SUM(total_price), 0) AS matchesIncome
      FROM dbo.MatchReservations
      WHERE status IN ('Confirmed', 'Completed')
    `);

    res.json({ matchesIncome: result.recordset[0].matchesIncome });
  } catch (err) {
    console.error("❌ matches-income error:", err);
    res.status(500).json({ error: "Failed to load matches income" });
  }
});

module.exports = router;
