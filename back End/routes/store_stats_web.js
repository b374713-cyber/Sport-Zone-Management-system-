// // routes/store_stats_web.js
// const express = require("express");
// const router = express.Router();
// const { getDatabase } = require("../config/database");

// router.get("/store/stats", async (req, res) => {
//   try {
//     const pool = await getDatabase();

//     const result = await pool.request().query(`
//       SELECT ISNULL(SUM(amount), 0) AS storeSales
//       FROM dbo.StoreReservationPayments
//       WHERE is_paid = 1
//     `);

//     const storeSales = result.recordset?.[0]?.storeSales ?? 0;
//     return res.json({ storeSales });
//   } catch (err) {
//     console.error("store stats error:", err);
//     return res.status(500).json({ error: "Failed to load store stats" });
//   }
// });

// module.exports = router;
// routes/store_stats_web.js
const express = require("express");
const router = express.Router();
const { getDatabase } = require("../config/database");

// helper like your bookingsHistory.js
const norm = (col) => `UPPER(LTRIM(RTRIM(${col})))`;

router.get("/store/stats", async (req, res) => {
  try {
    const pool = await getDatabase();

    const totalsRes = await pool.request().query(`
      SELECT
        -- Sports total paid (same logic as mobile but without customer filter)
        ISNULL((
          SELECT SUM(amount)
          FROM dbo.SportsReservationPayments
          WHERE (
            ${norm("status")} = 'PAID'
            OR ${norm("stripe_invoice_status")} = 'PAID'
          )
        ), 0) AS sports_total_paid,

        -- Gaming total paid
        ISNULL((
          SELECT SUM(amount)
          FROM dbo.GamingSessionPayments
          WHERE is_paid = 1
        ), 0) AS gaming_total_paid,

        -- Store total paid
        ISNULL((
          SELECT SUM(amount)
          FROM dbo.StoreReservationPayments
          WHERE is_paid = 1
        ), 0) AS store_total_paid
    `);

    const row = totalsRes.recordset?.[0] || {
      sports_total_paid: 0,
      gaming_total_paid: 0,
      store_total_paid: 0,
    };

    const sportsTotal = Number(row.sports_total_paid || 0);
    const gamingTotal = Number(row.gaming_total_paid || 0);
    const storeTotal  = Number(row.store_total_paid || 0);

    const grandTotal = sportsTotal + gamingTotal + storeTotal;

    // ✅ Keep storeSales for your current dashboard card (same field name)
    return res.json({
      storeSales: storeTotal,
      totals: {
        sports_total_paid: sportsTotal,
        gaming_total_paid: gamingTotal,
        store_total_paid: storeTotal,
        grand_total_paid: grandTotal,
      },
    });
  } catch (err) {
    console.error("store stats error:", err);
    return res.status(500).json({ error: "Failed to load store stats" });
  }
});

module.exports = router;
