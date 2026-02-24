// Back_end/controllers/gamingStatisticsController.js
const sql = require("mssql");
const { getDatabase } = require("../config/database");

exports.getGamingStatistics = async (req, res) => {
  try {
    const pool = await getDatabase();

    // 1) Total income from completed sessions
    const incomeResult = await pool.request().query(`
      SELECT ISNULL(SUM(final_amount), 0) AS totalIncome
      FROM dbo.GamingSessions
      WHERE status = 'Completed'
    `);

    // 2) Most played devices (by count)
    const mostPlayedDevicesResult = await pool.request().query(`
      SELECT TOP 5
        d.device_type,
        COUNT(*) AS playCount,
        ISNULL(SUM(s.hours_played), 0) AS totalHours,
        ISNULL(SUM(s.final_amount), 0) AS totalIncome
      FROM dbo.GamingSessions s
      JOIN dbo.GamingDevices d ON d.device_id = s.device_id
      WHERE s.status = 'Completed'
      GROUP BY d.device_type
      ORDER BY playCount DESC
    `);

    // 3) Most time played (by hours)
    const mostTimePlayedResult = await pool.request().query(`
      SELECT TOP 5
        d.device_type,
        ISNULL(SUM(s.hours_played), 0) AS totalHours,
        COUNT(*) AS playCount,
        ISNULL(SUM(s.final_amount), 0) AS totalIncome
      FROM dbo.GamingSessions s
      JOIN dbo.GamingDevices d ON d.device_id = s.device_id
      WHERE s.status = 'Completed'
      GROUP BY d.device_type
      ORDER BY totalHours DESC
    `);

    return res.json({
      statistics: {
        totalIncome: incomeResult.recordset[0].totalIncome,
        mostPlayedDevices: mostPlayedDevicesResult.recordset,
        mostTimePlayed: mostTimePlayedResult.recordset,
      },
    });
  } catch (err) {
    console.error("Gaming statistics error:", err);
    res.status(500).json({ error: "Failed to load gaming statistics" });
  }
};
