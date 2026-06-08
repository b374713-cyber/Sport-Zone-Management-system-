// // // Back_end/routes/bookingsHistory.js
// // const express = require("express");
// // const router = express.Router();
// // const { sql, getDatabase } = require("../config/database");

// // // helper to normalize statuses
// // const norm = (col) => `UPPER(LTRIM(RTRIM(${col})))`;

// // /**
// //  * GET /api/bookings/summary/:customerId
// //  * Returns sports + gaming + store history + payments timeline + totals
// //  */
// // router.get("/summary/:customerId", async (req, res) => {
// //   try {
// //     const customerId = Number(req.params.customerId);
// //     if (!customerId) return res.status(400).json({ message: "Invalid customerId" });

// //     const pool = await getDatabase();

// //     /* ---------------- SPORTS HISTORY ---------------- */
// //     const sportsRes = await pool
// //       .request()
// //       .input("cid", sql.Int, customerId)
// //       .query(`
// //         SELECT
// //           mr.reservation_id,
// //           mr.reservation_date,
// //           mr.start_time,
// //           mr.end_time,
// //           mr.status AS reservation_status,
// //           mr.total_price,
// //           mr.created_at,

// //           st.stadium_id,
// //           st.stadium_name,
// //           st.location,

// //           sp.sport_id,
// //           sp.sport_name,

// //           pay.amount AS payment_amount,
// //           pay.currency AS payment_currency,
// //           pay.status AS payment_status,
// //           pay.stripe_invoice_status,
// //           pay.hosted_invoice_url,
// //           pay.invoice_pdf_url,
// //           pay.paid_at

// //         FROM dbo.MatchReservations mr
// //         LEFT JOIN dbo.Stadiums st ON st.stadium_id = mr.stadium_id
// //         LEFT JOIN dbo.Sports sp ON sp.sport_id = st.sport_id

// //         OUTER APPLY (
// //           SELECT TOP 1
// //             p.amount, p.currency, p.status, p.stripe_invoice_status,
// //             p.hosted_invoice_url, p.invoice_pdf_url, p.paid_at
// //           FROM dbo.SportsReservationPayments p
// //           WHERE p.reservation_id = mr.reservation_id
// //           ORDER BY p.sports_payment_id DESC
// //         ) pay

// //         WHERE mr.customer_id = @cid
// //         ORDER BY mr.reservation_date DESC, mr.start_time DESC
// //       `);

// //     /* ---------------- GAMING HISTORY ----------------
// //        GamingSessions doesn't store customer_id, so we join via GamingSessionPayments.customer_id
// //     */
// //  /* ---------------- GAMING HISTORY ----------------
// //    GamingRooms has NO room_name column in your DB.
// //    It has: section + room_number => we create a display name.
// // */
// // const gamingRes = await pool
// //   .request()
// //   .input("cid", sql.Int, customerId)
// //   .query(`
// //     SELECT
// //       gs.session_id,
// //       gs.session_type,
// //       gs.player_name,
// //       gs.start_time,
// //       gs.end_time,
// //       gs.hours_played,
// //       gs.final_amount,
// //       gs.status AS session_status,
// //       gs.created_at,

// //       gd.device_id,
// //       gd.device_name,
// //       gd.device_type,

// //       gr.room_id,
// //       CONCAT(gr.section, '-', gr.room_number) AS room_name,

// //       pay.amount AS payment_amount,
// //       pay.currency AS payment_currency,
// //       pay.is_paid,
// //       pay.stripe_status,
// //       pay.hosted_invoice_url,
// //       pay.invoice_pdf_url,
// //       pay.paid_at

// //     FROM dbo.GamingSessionPayments pay
// //     INNER JOIN dbo.GamingSessions gs ON gs.session_id = pay.session_id
// //     LEFT JOIN dbo.GamingDevices gd ON gd.device_id = gs.device_id
// //     LEFT JOIN dbo.GamingRooms gr ON gr.room_id = gd.room_id

// //     WHERE pay.customer_id = @cid
// //     ORDER BY gs.start_time DESC, gs.created_at DESC
// //   `);

// //     /* ---------------- STORE HISTORY ---------------- */
// //     // 1) get reservations (all statuses) + payment info
// //     const storeRes = await pool
// //       .request()
// //       .input("uid", sql.Int, customerId) // you use customer_id as user_id in mobile reserve flow
// //       .query(`
// //         SELECT
// //           sr.reservation_id,
// //           sr.reservation_code,
// //           sr.status,
// //           sr.reserved_at,
// //           sr.expires_at,
// //           sr.confirmed_at,
// //           sr.fee_amount,
// //           sr.base_price,
// //           sr.final_price,

// //           pay.amount AS payment_amount,
// //           pay.currency AS payment_currency,
// //           pay.is_paid,
// //           pay.stripe_status,
// //           pay.hosted_invoice_url,
// //           pay.invoice_pdf_url,
// //           pay.paid_at

// //         FROM dbo.StoreReservations sr
// //         OUTER APPLY (
// //           SELECT TOP 1
// //             p.amount, p.currency, p.is_paid, p.stripe_status,
// //             p.hosted_invoice_url, p.invoice_pdf_url, p.paid_at
// //           FROM dbo.StoreReservationPayments p
// //           WHERE p.reservation_id = sr.reservation_id
// //           ORDER BY p.payment_id DESC
// //         ) pay

// //         WHERE sr.user_id = @uid
// //         ORDER BY sr.reserved_at DESC
// //       `);

// //     const storeReservations = storeRes.recordset || [];
// //     const reservationIds = storeReservations.map((r) => r.reservation_id);

// //     // 2) get items for those reservations
// //     let itemsByReservation = {};
// //     if (reservationIds.length > 0) {
// //       const idsCsv = reservationIds.join(",");

// //       const itemsRes = await pool.request().query(`
// //         SELECT
// //           sri.reservation_id,
// //           sri.product_id,
// //           sri.quantity,
// //           sri.unit_price,
// //           pr.name,
// //           pr.category,
// //           pr.image_url,
// //           pr.price
// //         FROM dbo.StoreReservationItems sri
// //         LEFT JOIN dbo.Products pr ON pr.product_id = sri.product_id
// //         WHERE sri.reservation_id IN (${idsCsv})
// //         ORDER BY sri.reservation_id DESC, sri.item_id ASC
// //       `);

// //       itemsByReservation = (itemsRes.recordset || []).reduce((acc, row) => {
// //         acc[row.reservation_id] = acc[row.reservation_id] || [];
// //         acc[row.reservation_id].push(row);
// //         return acc;
// //       }, {});
// //     }

// //     const storeHistory = storeReservations.map((r) => ({
// //       ...r,
// //       items: itemsByReservation[r.reservation_id] || [],
// //     }));

// //     /* ---------------- PAYMENTS TIMELINE + TOTALS ---------------- */
// //     // Sports totals: Paid when status='Paid' OR stripe_invoice_status='paid'
// //     const totalsRes = await pool
// //       .request()
// //       .input("cid", sql.Int, customerId)
// //       .query(`
// //         SELECT
// //           -- sports
// //           ISNULL((
// //             SELECT SUM(amount)
// //             FROM dbo.SportsReservationPayments
// //             WHERE customer_id = @cid
// //               AND (
// //                 ${norm("status")} = 'PAID'
// //                 OR ${norm("stripe_invoice_status")} = 'PAID'
// //               )
// //           ), 0) AS sports_total_paid,

// //           -- gaming
// //           ISNULL((
// //             SELECT SUM(amount)
// //             FROM dbo.GamingSessionPayments
// //             WHERE customer_id = @cid AND is_paid = 1
// //           ), 0) AS gaming_total_paid,

// //           -- store
// //           ISNULL((
// //             SELECT SUM(amount)
// //             FROM dbo.StoreReservationPayments
// //             WHERE customer_id = @cid AND is_paid = 1
// //           ), 0) AS store_total_paid
// //       `);

// //     const totalsRow = totalsRes.recordset?.[0] || {
// //       sports_total_paid: 0,
// //       gaming_total_paid: 0,
// //       store_total_paid: 0,
// //     };

// //     const grandTotal =
// //       Number(totalsRow.sports_total_paid || 0) +
// //       Number(totalsRow.gaming_total_paid || 0) +
// //       Number(totalsRow.store_total_paid || 0);

// //     // Combined payments list (optional but very useful for UI)
// //     const paymentsTimelineRes = await pool
// //       .request()
// //       .input("cid", sql.Int, customerId)
// //       .query(`
// //         SELECT
// //           'sports' AS module,
// //           sports_payment_id AS id,
// //           reservation_id AS ref_id,
// //           amount,
// //           currency,
// //           status AS payment_status,
// //           stripe_invoice_status AS stripe_status,
// //           hosted_invoice_url,
// //           invoice_pdf_url,
// //           created_at,
// //           paid_at
// //         FROM dbo.SportsReservationPayments
// //         WHERE customer_id = @cid

// //         UNION ALL

// //         SELECT
// //           'gaming' AS module,
// //           payment_id AS id,
// //           session_id AS ref_id,
// //           amount,
// //           currency,
// //           CASE WHEN is_paid = 1 THEN 'Paid' ELSE 'Pending' END AS payment_status,
// //           stripe_status,
// //           hosted_invoice_url,
// //           invoice_pdf_url,
// //           created_at,
// //           paid_at
// //         FROM dbo.GamingSessionPayments
// //         WHERE customer_id = @cid

// //         UNION ALL

// //         SELECT
// //           'store' AS module,
// //           payment_id AS id,
// //           reservation_id AS ref_id,
// //           amount,
// //           currency,
// //           CASE WHEN is_paid = 1 THEN 'Paid' ELSE 'Pending' END AS payment_status,
// //           stripe_status,
// //           hosted_invoice_url,
// //           invoice_pdf_url,
// //           created_at,
// //           paid_at
// //         FROM dbo.StoreReservationPayments
// //         WHERE customer_id = @cid

// //         ORDER BY created_at DESC
// //       `);

// //     return res.json({
// //       sports: sportsRes.recordset || [],
// //       gaming: gamingRes.recordset || [],
// //       store: storeHistory,
// //       payments: paymentsTimelineRes.recordset || [],
// //       totals: {
// //         sports_total_paid: Number(totalsRow.sports_total_paid || 0),
// //         gaming_total_paid: Number(totalsRow.gaming_total_paid || 0),
// //         store_total_paid: Number(totalsRow.store_total_paid || 0),
// //         grand_total_paid: grandTotal,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("bookings summary error:", err);
// //     return res.status(500).json({ message: "Failed to load bookings history", details: err.message });
// //   }
// // });

// // module.exports = router;
// // Back_end/routes/bookingsHistory.js
// const express = require("express");
// const router = express.Router();
// const { sql, getDatabase } = require("../config/database");

// // helper to normalize statuses
// const norm = (col) => `UPPER(LTRIM(RTRIM(${col})))`;

// function buildBaseUrl(req) {
//   // if you use proxy, add: app.set('trust proxy', 1)
//   const proto = req.headers["x-forwarded-proto"] || req.protocol;
//   return `${proto}://${req.get("host")}`;
// }

// function toPublicImageUrl(req, raw) {
//   if (!raw) return null;

//   const s = String(raw).trim();

//   // already full url
//   if (s.startsWith("http://") || s.startsWith("https://")) return s;

//   // normalize slashes
//   const clean = s.replaceAll("\\", "/");

//   // If DB saved full local path like C:\...\uploads\store\file.jpg
//   // or .../uploads/store/file.jpg
//   const idx = clean.toLowerCase().lastIndexOf("/uploads/");
//   if (idx !== -1) {
//     return buildBaseUrl(req) + clean.slice(idx); // => http://host/uploads/store/file.jpg
//   }

//   // If DB saved just filename like file.jpg OR store/file.jpg
//   // Put it under /uploads/store/
//   if (clean.includes("/")) {
//     // e.g. store/file.jpg => /uploads/store/file.jpg if it doesn't include uploads
//     if (!clean.toLowerCase().includes("uploads/")) {
//       return `${buildBaseUrl(req)}/uploads/${clean.startsWith("/") ? clean.slice(1) : clean}`;
//     }
//   }

//   // fallback: treat as filename
//   return `${buildBaseUrl(req)}/uploads/store/${encodeURIComponent(clean)}`;
// }

// function paymentMethodFromStripeStatus(stripeStatus) {
//   const s = String(stripeStatus || "").toLowerCase().trim();
//   if (!s) return "unknown";
//   if (s === "cash") return "cash";
//   // common stripe values: paid, open, draft, void, uncollectible...
//   return "stripe";
// }

// /**
//  * GET /api/bookings/summary/:customerId
//  * Returns sports + gaming + store history + payments timeline + totals
//  */
// router.get("/summary/:customerId", async (req, res) => {
//   try {
//     const customerId = Number(req.params.customerId);
//     if (!customerId) return res.status(400).json({ message: "Invalid customerId" });

//     const pool = await getDatabase();

//     /* ---------------- SPORTS HISTORY ---------------- */
//     const sportsRes = await pool
//       .request()
//       .input("cid", sql.Int, customerId)
//       .query(`
//         SELECT
//           mr.reservation_id,
//           mr.reservation_date,
//           mr.start_time,
//           mr.end_time,
//           mr.status AS reservation_status,
//           mr.total_price,
//           mr.created_at,

//           st.stadium_id,
//           st.stadium_name,
//           st.location,

//           sp.sport_id,
//           sp.sport_name,

//           pay.amount AS payment_amount,
//           pay.currency AS payment_currency,
//           pay.status AS payment_status,
//           pay.stripe_invoice_status AS stripe_status,
//           pay.hosted_invoice_url,
//           pay.invoice_pdf_url,
//           pay.paid_at

//         FROM dbo.MatchReservations mr
//         LEFT JOIN dbo.Stadiums st ON st.stadium_id = mr.stadium_id
//         LEFT JOIN dbo.Sports sp ON sp.sport_id = st.sport_id

//         OUTER APPLY (
//           SELECT TOP 1
//             p.amount, p.currency, p.status, p.stripe_invoice_status,
//             p.hosted_invoice_url, p.invoice_pdf_url, p.paid_at
//           FROM dbo.SportsReservationPayments p
//           WHERE p.reservation_id = mr.reservation_id
//           ORDER BY p.sports_payment_id DESC
//         ) pay

//         WHERE mr.customer_id = @cid
//         ORDER BY mr.reservation_date DESC, mr.start_time DESC
//       `);

//     const sportsHistory = (sportsRes.recordset || []).map((r) => ({
//       ...r,
//       payment_method: paymentMethodFromStripeStatus(r.stripe_status),
//     }));

//     /* ---------------- GAMING HISTORY ----------------
//        GamingRooms has NO room_name column in your DB.
//        It has: section + room_number => we create a display name.
//     */
//     const gamingRes = await pool
//       .request()
//       .input("cid", sql.Int, customerId)
//       .query(`
//         SELECT
//           gs.session_id,
//           gs.session_type,
//           gs.player_name,
//           gs.start_time,
//           gs.end_time,
//           gs.hours_played,
//           gs.final_amount,
//           gs.status AS session_status,
//           gs.created_at,

//           gd.device_id,
//           gd.device_name,
//           gd.device_type,

//           gr.room_id,
//           CONCAT(gr.section, '-', gr.room_number) AS room_name,

//           pay.amount AS payment_amount,
//           pay.currency AS payment_currency,
//           pay.is_paid,
//           pay.stripe_status,
//           pay.hosted_invoice_url,
//           pay.invoice_pdf_url,
//           pay.paid_at

//         FROM dbo.GamingSessionPayments pay
//         INNER JOIN dbo.GamingSessions gs ON gs.session_id = pay.session_id
//         LEFT JOIN dbo.GamingDevices gd ON gd.device_id = gs.device_id
//         LEFT JOIN dbo.GamingRooms gr ON gr.room_id = gd.room_id

//         WHERE pay.customer_id = @cid
//         ORDER BY gs.start_time DESC, gs.created_at DESC
//       `);

//     const gamingHistory = (gamingRes.recordset || []).map((r) => ({
//       ...r,
//       payment_method: paymentMethodFromStripeStatus(r.stripe_status),
//     }));

//     /* ---------------- STORE HISTORY ---------------- */
// const storeRes = await pool
//   .request()
//   .input("cid", sql.Int, customerId)
//   .query(`
//     SELECT
//       sr.reservation_id,
//       sr.reservation_code,
//       sr.status,
//       sr.reserved_at,
//       sr.expires_at,
//       sr.confirmed_at,
//       sr.fee_amount,
//       sr.base_price,
//       sr.final_price,

//       pay.amount AS payment_amount,
//       pay.currency AS payment_currency,
//       pay.is_paid,
//       pay.stripe_status,
//       pay.hosted_invoice_url,
//       pay.invoice_pdf_url,
//       pay.paid_at

//     FROM dbo.StoreReservations sr
//     OUTER APPLY (
//       SELECT TOP 1
//         p.amount, p.currency, p.is_paid, p.stripe_status,
//         p.hosted_invoice_url, p.invoice_pdf_url, p.paid_at
//       FROM dbo.StoreReservationPayments p
//       WHERE p.reservation_id = sr.reservation_id
//       ORDER BY p.payment_id DESC
//     ) pay

//     WHERE sr.customer_id = @cid  // ✅ FIXED - Use customer_id
//     ORDER BY sr.reserved_at DESC
//   `);

//     const storeReservations = storeRes.recordset || [];
//     const reservationIds = storeReservations.map((r) => r.reservation_id);

//     let itemsByReservation = {};
//     if (reservationIds.length > 0) {
//       const idsCsv = reservationIds.join(",");

//       const itemsRes = await pool.request().query(`
//         SELECT
//           sri.reservation_id,
//           sri.product_id,
//           sri.quantity,
//           sri.unit_price,
//           pr.name,
//           pr.category,
//           pr.image_url,
//           pr.price
//         FROM dbo.StoreReservationItems sri
//         LEFT JOIN dbo.Products pr ON pr.product_id = sri.product_id
//         WHERE sri.reservation_id IN (${idsCsv})
//         ORDER BY sri.reservation_id DESC, sri.item_id ASC
//       `);

//       const rows = (itemsRes.recordset || []).map((row) => ({
//         ...row,
//         image_url: toPublicImageUrl(req, row.image_url),
//       }));

//       itemsByReservation = rows.reduce((acc, row) => {
//         acc[row.reservation_id] = acc[row.reservation_id] || [];
//         acc[row.reservation_id].push(row);
//         return acc;
//       }, {});
//     }

//     const storeHistory = storeReservations.map((r) => ({
//       ...r,
//       payment_method: paymentMethodFromStripeStatus(r.stripe_status),
//       items: itemsByReservation[r.reservation_id] || [],
//     }));

//     /* ---------------- TOTALS ---------------- */
//     const totalsRes = await pool
//       .request()
//       .input("cid", sql.Int, customerId)
//       .query(`
//         SELECT
//           ISNULL((
//             SELECT SUM(amount)
//             FROM dbo.SportsReservationPayments
//             WHERE customer_id = @cid
//               AND (
//                 ${norm("status")} = 'PAID'
//                 OR ${norm("stripe_invoice_status")} = 'PAID'
//               )
//           ), 0) AS sports_total_paid,

//           ISNULL((
//             SELECT SUM(amount)
//             FROM dbo.GamingSessionPayments
//             WHERE customer_id = @cid AND is_paid = 1
//           ), 0) AS gaming_total_paid,

//           ISNULL((
//             SELECT SUM(amount)
//             FROM dbo.StoreReservationPayments
//             WHERE customer_id = @cid AND is_paid = 1
//           ), 0) AS store_total_paid
//       `);

//     const totalsRow = totalsRes.recordset?.[0] || {
//       sports_total_paid: 0,
//       gaming_total_paid: 0,
//       store_total_paid: 0,
//     };

//     const grandTotal =
//       Number(totalsRow.sports_total_paid || 0) +
//       Number(totalsRow.gaming_total_paid || 0) +
//       Number(totalsRow.store_total_paid || 0);

//     /* ---------------- PAYMENTS TIMELINE ---------------- */
//     const paymentsTimelineRes = await pool
//       .request()
//       .input("cid", sql.Int, customerId)
//       .query(`
//         SELECT
//           'sports' AS module,
//           sports_payment_id AS id,
//           reservation_id AS ref_id,
//           amount,
//           currency,
//           status AS payment_status,
//           stripe_invoice_status AS stripe_status,
//           hosted_invoice_url,
//           invoice_pdf_url,
//           created_at,
//           paid_at
//         FROM dbo.SportsReservationPayments
//         WHERE customer_id = @cid

//         UNION ALL

//         SELECT
//           'gaming' AS module,
//           payment_id AS id,
//           session_id AS ref_id,
//           amount,
//           currency,
//           CASE WHEN is_paid = 1 THEN 'Paid' ELSE 'Pending' END AS payment_status,
//           stripe_status,
//           hosted_invoice_url,
//           invoice_pdf_url,
//           created_at,
//           paid_at
//         FROM dbo.GamingSessionPayments
//         WHERE customer_id = @cid

//         UNION ALL

//         SELECT
//           'store' AS module,
//           payment_id AS id,
//           reservation_id AS ref_id,
//           amount,
//           currency,
//           CASE WHEN is_paid = 1 THEN 'Paid' ELSE 'Pending' END AS payment_status,
//           stripe_status,
//           hosted_invoice_url,
//           invoice_pdf_url,
//           created_at,
//           paid_at
//         FROM dbo.StoreReservationPayments
//         WHERE customer_id = @cid

//         ORDER BY created_at DESC
//       `);

//     const paymentsTimeline = (paymentsTimelineRes.recordset || []).map((p) => ({
//       ...p,
//       payment_method: paymentMethodFromStripeStatus(p.stripe_status),
//     }));

//     return res.json({
//       sports: sportsHistory,
//       gaming: gamingHistory,
//       store: storeHistory,
//       payments: paymentsTimeline,
//       totals: {
//         sports_total_paid: Number(totalsRow.sports_total_paid || 0),
//         gaming_total_paid: Number(totalsRow.gaming_total_paid || 0),
//         store_total_paid: Number(totalsRow.store_total_paid || 0),
//         grand_total_paid: grandTotal,
//       },
//     });
//   } catch (err) {
//     console.error("bookings summary error:", err);
//     return res.status(500).json({
//       message: "Failed to load bookings history",
//       details: err.message,
//     });
//   }
// });

// module.exports = router;
// Back_end/routes/bookingsHistory.js
const express = require("express");
const router = express.Router();
const { sql, getDatabase } = require("../config/database");

// helper to normalize statuses
const norm = (col) => `UPPER(LTRIM(RTRIM(${col})))`;

function buildBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}`;
}

function toPublicImageUrl(req, raw) {
  if (!raw) return null;

  const s = String(raw).trim();

  // already full url
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // normalize slashes
  const clean = s.replaceAll("\\", "/");

  // If DB saved full local path like C:\...\uploads\store\file.jpg
  const idx = clean.toLowerCase().lastIndexOf("/uploads/");
  if (idx !== -1) {
    return buildBaseUrl(req) + clean.slice(idx);
  }

  // If DB saved just filename like store/file.jpg
  if (clean.includes("/")) {
    if (!clean.toLowerCase().includes("uploads/")) {
      return `${buildBaseUrl(req)}/uploads/${clean.startsWith("/") ? clean.slice(1) : clean}`;
    }
  }

  // fallback: treat as filename
  return `${buildBaseUrl(req)}/uploads/store/${encodeURIComponent(clean)}`;
}

function paymentMethodFromStripeStatus(stripeStatus) {
  const s = String(stripeStatus || "").toLowerCase().trim();
  if (!s) return "unknown";
  if (s === "cash") return "cash";
  return "stripe";
}

/**
 * GET /api/bookings/summary/:customerId
 * Returns sports + gaming + store history + payments timeline + totals
 */
router.get("/summary/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) return res.status(400).json({ message: "Invalid customerId" });

    const pool = await getDatabase();

    /* ---------------- SPORTS HISTORY ---------------- */
    const sportsRes = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT
          mr.reservation_id,
          mr.reservation_date,
          mr.start_time,
          mr.end_time,
          mr.status AS reservation_status,
          mr.total_price,
          mr.created_at,

          st.stadium_id,
          st.stadium_name,
          st.location,

          sp.sport_id,
          sp.sport_name,

          pay.amount AS payment_amount,
          pay.currency AS payment_currency,
          pay.status AS payment_status,
          pay.stripe_invoice_status AS stripe_status,
          pay.hosted_invoice_url,
          pay.invoice_pdf_url,
          pay.paid_at

        FROM dbo.MatchReservations mr
        LEFT JOIN dbo.Stadiums st ON st.stadium_id = mr.stadium_id
        LEFT JOIN dbo.Sports sp ON sp.sport_id = st.sport_id

        OUTER APPLY (
          SELECT TOP 1
            p.amount, p.currency, p.status, p.stripe_invoice_status,
            p.hosted_invoice_url, p.invoice_pdf_url, p.paid_at
          FROM dbo.SportsReservationPayments p
          WHERE p.reservation_id = mr.reservation_id
          ORDER BY p.sports_payment_id DESC
        ) pay

        WHERE mr.customer_id = @cid
        ORDER BY mr.reservation_date DESC, mr.start_time DESC
      `);

    const sportsHistory = (sportsRes.recordset || []).map((r) => ({
      ...r,
      payment_method: paymentMethodFromStripeStatus(r.stripe_status),
    }));

    /* ---------------- GAMING HISTORY ---------------- */
    const gamingRes = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT
          gs.session_id,
          gs.session_type,
          gs.player_name,
          gs.start_time,
          gs.end_time,
          gs.hours_played,
          gs.final_amount,
          gs.status AS session_status,
          gs.created_at,

          gd.device_id,
          gd.device_name,
          gd.device_type,

          gr.room_id,
          CONCAT(gr.section, '-', gr.room_number) AS room_name,

          pay.amount AS payment_amount,
          pay.currency AS payment_currency,
          pay.is_paid,
          pay.stripe_status,
          pay.hosted_invoice_url,
          pay.invoice_pdf_url,
          pay.paid_at

        FROM dbo.GamingSessionPayments pay
        INNER JOIN dbo.GamingSessions gs ON gs.session_id = pay.session_id
        LEFT JOIN dbo.GamingDevices gd ON gd.device_id = gs.device_id
        LEFT JOIN dbo.GamingRooms gr ON gr.room_id = gd.room_id

        WHERE pay.customer_id = @cid
        ORDER BY gs.start_time DESC, gs.created_at DESC
      `);

    const gamingHistory = (gamingRes.recordset || []).map((r) => ({
      ...r,
      payment_method: paymentMethodFromStripeStatus(r.stripe_status),
    }));

    /* ---------------- STORE HISTORY ---------------- */
    const storeRes = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT
          sr.reservation_id,
          sr.reservation_code,
          sr.status,
          sr.reserved_at,
          sr.expires_at,
          sr.confirmed_at,
          sr.fee_amount,
          sr.base_price,
          sr.final_price,

          pay.amount AS payment_amount,
          pay.currency AS payment_currency,
          pay.is_paid,
          pay.stripe_status,
          pay.hosted_invoice_url,
          pay.invoice_pdf_url,
          pay.paid_at

        FROM dbo.StoreReservations sr
        OUTER APPLY (
          SELECT TOP 1
            p.amount, p.currency, p.is_paid, p.stripe_status,
            p.hosted_invoice_url, p.invoice_pdf_url, p.paid_at
          FROM dbo.StoreReservationPayments p
          WHERE p.reservation_id = sr.reservation_id
          ORDER BY p.payment_id DESC
        ) pay

        WHERE sr.customer_id = @cid
        ORDER BY sr.reserved_at DESC
      `);

    const storeReservations = storeRes.recordset || [];
    const reservationIds = storeReservations.map((r) => r.reservation_id);

    let itemsByReservation = {};
    if (reservationIds.length > 0) {
      const idsCsv = reservationIds.join(",");

      const itemsRes = await pool.request().query(`
        SELECT
          sri.reservation_id,
          sri.product_id,
          sri.quantity,
          sri.unit_price,
          pr.name,
          pr.category,
          pr.image_url,
          pr.price
        FROM dbo.StoreReservationItems sri
        LEFT JOIN dbo.Products pr ON pr.product_id = sri.product_id
        WHERE sri.reservation_id IN (${idsCsv})
        ORDER BY sri.reservation_id DESC, sri.item_id ASC
      `);

      const rows = (itemsRes.recordset || []).map((row) => ({
        ...row,
        image_url: toPublicImageUrl(req, row.image_url),
      }));

      itemsByReservation = rows.reduce((acc, row) => {
        acc[row.reservation_id] = acc[row.reservation_id] || [];
        acc[row.reservation_id].push(row);
        return acc;
      }, {});
    }

    const storeHistory = storeReservations.map((r) => ({
      ...r,
      payment_method: paymentMethodFromStripeStatus(r.stripe_status),
      items: itemsByReservation[r.reservation_id] || [],
    }));

    /* ---------------- TOTALS ---------------- */
    const totalsRes = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT
          ISNULL((
            SELECT SUM(amount)
            FROM dbo.SportsReservationPayments
            WHERE customer_id = @cid
              AND (
                ${norm("status")} = 'PAID'
                OR ${norm("stripe_invoice_status")} = 'PAID'
              )
          ), 0) AS sports_total_paid,

          ISNULL((
            SELECT SUM(amount)
            FROM dbo.GamingSessionPayments
            WHERE customer_id = @cid AND is_paid = 1
          ), 0) AS gaming_total_paid,

          ISNULL((
            SELECT SUM(amount)
            FROM dbo.StoreReservationPayments
            WHERE customer_id = @cid AND is_paid = 1
          ), 0) AS store_total_paid
      `);

    const totalsRow = totalsRes.recordset?.[0] || {
      sports_total_paid: 0,
      gaming_total_paid: 0,
      store_total_paid: 0,
    };

    const grandTotal =
      Number(totalsRow.sports_total_paid || 0) +
      Number(totalsRow.gaming_total_paid || 0) +
      Number(totalsRow.store_total_paid || 0);

    /* ---------------- PAYMENTS TIMELINE WITH PRODUCT INFO ---------------- */
    const paymentsTimelineRes = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT
          'sports' AS module,
          sports_payment_id AS id,
          reservation_id AS ref_id,
          amount,
          currency,
          status AS payment_status,
          stripe_invoice_status AS stripe_status,
          hosted_invoice_url,
          invoice_pdf_url,
          created_at,
          paid_at,
          NULL AS product_names,
          NULL AS product_images,
          NULL AS item_count,
          NULL AS items_json
        FROM dbo.SportsReservationPayments
        WHERE customer_id = @cid

        UNION ALL

        SELECT
          'gaming' AS module,
          payment_id AS id,
          session_id AS ref_id,
          amount,
          currency,
          CASE WHEN is_paid = 1 THEN 'Paid' ELSE 'Pending' END AS payment_status,
          stripe_status,
          hosted_invoice_url,
          invoice_pdf_url,
          created_at,
          paid_at,
          NULL AS product_names,
          NULL AS product_images,
          NULL AS item_count,
          NULL AS items_json
        FROM dbo.GamingSessionPayments
        WHERE customer_id = @cid

        UNION ALL

        -- STORE PAYMENTS WITH PRODUCT DETAILS
        SELECT
          'store' AS module,
          p.payment_id AS id,
          p.reservation_id AS ref_id,
          p.amount,
          p.currency,
          CASE WHEN p.is_paid = 1 THEN 'Paid' ELSE 'Pending' END AS payment_status,
          p.stripe_status,
          p.hosted_invoice_url,
          p.invoice_pdf_url,
          p.created_at,
          p.paid_at,
          STUFF((
            SELECT ', ' + pr.name
            FROM dbo.StoreReservationItems sri
            JOIN dbo.Products pr ON pr.product_id = sri.product_id
            WHERE sri.reservation_id = p.reservation_id
            FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS product_names,
          (
            SELECT TOP 1 pr.image_url
            FROM dbo.StoreReservationItems sri
            JOIN dbo.Products pr ON pr.product_id = sri.product_id
            WHERE sri.reservation_id = p.reservation_id
            ORDER BY sri.item_id ASC
          ) AS product_images,
          (
            SELECT COUNT(*)
            FROM dbo.StoreReservationItems sri
            WHERE sri.reservation_id = p.reservation_id
          ) AS item_count,
          (
            SELECT 
              (
                SELECT 
                  pr.product_id,
                  pr.name,
                  pr.category,
                  pr.image_url,
                  sri.quantity,
                  sri.unit_price
                FROM dbo.StoreReservationItems sri
                JOIN dbo.Products pr ON pr.product_id = sri.product_id
                WHERE sri.reservation_id = p.reservation_id
                FOR JSON PATH
              )
          ) AS items_json
        FROM dbo.StoreReservationPayments p
        WHERE p.customer_id = @cid

        ORDER BY created_at DESC
      `);

    // Process the payments timeline to convert items_json and fix image URLs
    const paymentsTimeline = (paymentsTimelineRes.recordset || []).map((p) => {
      const basePayment = {
        ...p,
        payment_method: paymentMethodFromStripeStatus(p.stripe_status),
      };

      // For store payments, parse items_json and fix image URLs
      if (p.module === 'store' && p.items_json) {
        try {
          const items = JSON.parse(p.items_json);
          const processedItems = Array.isArray(items) ? items.map(item => ({
            ...item,
            image_url: toPublicImageUrl(req, item.image_url),
          })) : [];
          
          return {
            ...basePayment,
            store_items: processedItems,
          };
        } catch (e) {
          console.error('Failed to parse items_json:', e);
          return {
            ...basePayment,
            store_items: [],
          };
        }
      }

      return basePayment;
    });

    return res.json({
      sports: sportsHistory,
      gaming: gamingHistory,
      store: storeHistory,
      payments: paymentsTimeline,
      totals: {
        sports_total_paid: Number(totalsRow.sports_total_paid || 0),
        gaming_total_paid: Number(totalsRow.gaming_total_paid || 0),
        store_total_paid: Number(totalsRow.store_total_paid || 0),
        grand_total_paid: grandTotal,
      },
    });
  } catch (err) {
    console.error("bookings summary error:", err);
    return res.status(500).json({
      message: "Failed to load bookings history",
      details: err.message,
    });
  }
});

module.exports = router;