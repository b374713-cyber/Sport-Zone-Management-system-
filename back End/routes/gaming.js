const express = require("express");
const sql = require("mssql");
const { getDatabase } = require("../config/database");
const { sendMail } = require("./mailer");
const { generateAndSaveCashReceipt } = require("../utils/pdfGenerator");

const router = express.Router();

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ========================================================================== */
/*  HELPERS                                                                   */
/* ========================================================================== */

function computeGamingChargeHours(session_type, offer_code) {
  // FREE reward => charge 0
  if (offer_code === "FREE_3H") return 0;

  // Open => charge 1 hour.
  if (session_type === "Open") return 1;

  // Fixed => charge based on offer.
  if (offer_code === "1H") return 1;
  if (offer_code === "2H") return 2;
  if (offer_code === "2H+1FREE") return 2; // charge 2h, 1h free

  // fallback
  return 1;
}

async function getCustomerEmailAndName(pool, customerId) {
  const r = await pool
    .request()
    .input("cid", sql.Int, customerId)
    .query(`SELECT email, name FROM dbo.Customers WHERE customer_id=@cid`);
  const row = r.recordset?.[0] || {};
  return { email: row.email || null, name: row.name || null };
}

async function getPool() {
  return getDatabase();
}

/* ========================================================================== */
/*  PUSH NOTIFICATIONS (Expo)                                                 */
/* ========================================================================== */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Node 18+ has global fetch; fallback for older node
const fetchFn = global.fetch
  ? global.fetch
  : (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

function subtractMinutesHHMM(hhmm, minutesToSubtract = 15) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const total = h * 60 + m - minutesToSubtract;
  const fixed = (total + 24 * 60) % (24 * 60);
  const HH = String(Math.floor(fixed / 60)).padStart(2, "0");
  const MM = String(fixed % 60).padStart(2, "0");
  return `${HH}:${MM}`;
}

function dateToHHMM(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function getCustomerPushToken(pool, customerId) {
  const tokRes = await pool
    .request()
    .input("cid", sql.Int, customerId)
    .query(`
      SELECT TOP 1 expo_push_token
      FROM dbo.GymPushTokens
      WHERE customer_id = @cid
      ORDER BY updated_at DESC
    `);

  return tokRes.recordset?.[0]?.expo_push_token || null;
}

async function sendExpoPush(expoPushToken, title, body, data = {}) {
  const payload = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data,
  };

  const resp = await fetchFn(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await resp.json().catch(() => ({}));
  return { ok: resp.ok, json };
}

/* ========================================================================== */
/*  GEMINI (Google Generative AI)                                             */
/* ========================================================================== */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "your-gemini-api-key");

const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

async function chooseWinnerAndPrizeWithGemini(candidates, prizes) {
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates provided to Gemini.");
  }

  const prompt = `
You are helping run a fair random prize draw at a gaming center.

You are given:
- A list of eligible players as JSON.
- A list of possible prizes as JSON.

Each player must have an EQUAL chance to win (no bias, no preference).
Choose EXACTLY ONE winner at random from the candidates.
Then choose EXACTLY ONE prize from the prize list.

Return your answer ONLY as valid JSON in this exact shape:

{
  "winner_id": <number>,         // player_id of the chosen winner
  "prize_name": "<string>",      // one of the prize names
  "announcement": "<string>"     // short fun message for the winner
}

Do NOT add explanations. Do NOT wrap in backticks.
Here is the candidates JSON:
${JSON.stringify(candidates)}

Here is the prizes JSON:
${JSON.stringify(prizes)}
  `.trim();

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();

    let clean = text;
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      throw new Error("Failed to parse Gemini JSON: " + err.message);
    }

    if (!parsed || typeof parsed.winner_id !== "number" || typeof parsed.prize_name !== "string") {
      throw new Error("Gemini response missing winner_id or prize_name.");
    }

    return {
      winner_id: parsed.winner_id,
      prize_name: parsed.prize_name,
      announcement: parsed.announcement || "",
    };
  } catch (err) {
    console.error("Gemini error:", err);
    throw err;
  }
}

/* ========================================================================== */
/*  TIME HELPERS                                                              */
/* ========================================================================== */

function toLocalSqlString(dateObj) {
  if (!dateObj) return null;
  const d = new Date(dateObj);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds())
  );
}

function serializeSession(s) {
  if (!s) return s;
  return {
    ...s,
    start_time: toLocalSqlString(s.start_time),
    end_time: toLocalSqlString(s.end_time),
    planned_start_time: toLocalSqlString(s.planned_start_time),
    planned_end_time: toLocalSqlString(s.planned_end_time),
    created_at: toLocalSqlString(s.created_at),
    last_updated: toLocalSqlString(s.last_updated),
  };
}

/* ========================================================================== */
/*  ROOMS & DEVICES                                                           */
/* ========================================================================== */

// GET /api/gaming/rooms
router.get("/rooms", async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        r.room_id,
        r.section,
        r.room_number,
        r.capacity,
        r.is_active,
        ISNULL(COUNT(DISTINCT d.device_id), 0) AS total_devices,
        ISNULL(SUM(CASE WHEN s.status = 'Active' THEN 1 ELSE 0 END), 0) AS busy_devices
      FROM dbo.GamingRooms r
      LEFT JOIN dbo.GamingDevices d
        ON d.room_id = r.room_id
      LEFT JOIN dbo.GamingSessions s
        ON s.device_id = d.device_id
       AND s.status = 'Active'
      WHERE r.is_active = 1
      GROUP BY r.room_id, r.section, r.room_number, r.capacity, r.is_active
      ORDER BY r.section, r.room_number;
    `);

    const rooms = result.recordset.map((r) => {
      const totalDevices = r.total_devices || 0;
      const busyDevices = r.busy_devices || 0;
      const capacity = r.capacity || totalDevices || 1;
      const occupancy = Math.round((busyDevices / capacity) * 100);

      return {
        room_id: r.room_id,
        section: r.section,
        room_number: r.room_number,
        capacity: r.capacity,
        is_active: r.is_active,
        total_devices: totalDevices,
        busy_devices: busyDevices,
        occupancy_percent: occupancy,
      };
    });

    res.json({ rooms });
  } catch (err) {
    console.error("GET /api/gaming/rooms error:", err);
    res.status(500).json({ error: "Failed to load gaming rooms" });
  }
});

// GET /api/gaming/devices
router.get("/devices", async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        d.device_id,
        d.room_id,
        d.slot_number,
        d.device_name,
        d.device_type,
        d.price_per_hour,
        d.status,
        r.section,
        r.room_number,
        r.is_active
      FROM dbo.GamingDevices d
      LEFT JOIN dbo.GamingRooms r
        ON r.room_id = d.room_id
      WHERE r.is_active = 1 OR r.is_active IS NULL
      ORDER BY d.room_id, d.slot_number;
    `);

    res.json({ devices: result.recordset });
  } catch (err) {
    console.error("GET /api/gaming/devices error:", err);
    res.status(500).json({ error: "Failed to load gaming devices" });
  }
});

/* ========================================================================== */
/*  CUSTOMERS FOR DROPDOWN                                                    */
/* ========================================================================== */

router.get("/customers", async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT customer_id, name, email, phone
      FROM dbo.Customers
      WHERE is_system_generated = 0
      ORDER BY name
    `);

    return res.json({ customers: result.recordset || [] });
  } catch (err) {
    console.error("GET /api/gaming/customers error:", err);
    return res.status(500).json({ error: "Failed to load customers" });
  }
});

// Only one prize - "Free 3-hour session"
const SPIN_PRIZES = [
  { name: "Free 3-hour session", points_cost: 25, reward_type: "FREE_3_HOURS", offer_code: "FREE_3H", hours_free: 3 },
];

/* ========================================================================== */
/*  ACTIVE + RESERVED SESSIONS                                                */
/* ========================================================================== */

router.get("/sessions/active", async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        s.session_id,
        s.device_id,
        s.player_name,
        s.member_id,
        s.session_type,
        s.start_time,
        s.planned_start_time,
        s.planned_end_time,
        s.planned_minutes,
        s.offer_code,
        s.status,
        s.created_at,
        s.price_per_hour,
        d.device_name,
        d.device_type,
        d.status AS device_status,
        r.section,
        r.room_number,
        d.slot_number,

        -- payment fields
        pay.is_paid AS payment_is_paid,
        pay.stripe_status AS payment_stripe_status,
        pay.hosted_invoice_url AS payment_hosted_invoice_url,
        pay.invoice_pdf_url AS payment_invoice_pdf_url,
        pay.amount AS payment_amount,
        pay.currency AS payment_currency

      FROM dbo.GamingSessions s
      JOIN dbo.GamingDevices d ON d.device_id = s.device_id
      JOIN dbo.GamingRooms r ON r.room_id = d.room_id

      OUTER APPLY (
        SELECT TOP 1
          p.is_paid,
          p.stripe_status,
          p.hosted_invoice_url,
          p.invoice_pdf_url,
          p.amount,
          p.currency
        FROM dbo.GamingSessionPayments p
        WHERE p.session_id = s.session_id
        ORDER BY p.payment_id DESC
      ) pay

      WHERE s.status IN ('Active','Reserved')
      ORDER BY
        CASE WHEN s.status='Reserved' THEN 0 ELSE 1 END,
        ISNULL(s.planned_start_time, s.start_time);
    `);

    const sessions = result.recordset.map(serializeSession);
    res.json({ sessions });
  } catch (err) {
    console.error("GET /api/gaming/sessions/active error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

/* ========================================================================== */
/*  BILLING & POINTS                                                          */
/* ========================================================================== */

function computeBillingAndPoints({ start_time, end_time, price_per_hour, offer_code }) {
  const start = new Date(start_time);
  const end = end_time ? new Date(end_time) : new Date();

  const ms = end - start;
  const hoursFloat = ms / (1000 * 60 * 60);
  const hoursRounded = Math.max(0.25, Math.round(hoursFloat * 100) / 100);

  const rate = Number(price_per_hour || 0);
  let baseAmount = hoursRounded * rate;
  let discount = 0;
  let finalAmount = baseAmount;

  if (offer_code === "FREE_3H") {
    discount = baseAmount;
    finalAmount = 0;
  } else if (offer_code === "2H+1FREE" && rate > 0) {
    const blocksOf3 = Math.floor(hoursRounded / 3);
    discount = blocksOf3 * rate;
    finalAmount = baseAmount - discount;
  }

  const points = Math.max(1, Math.floor(hoursFloat));

  return {
    hoursFloat,
    hoursRounded,
    baseAmount,
    discount,
    finalAmount,
    points,
  };
}

function getPlannedMinutesFromOffer(offer_code) {
  switch (offer_code) {
    case "1H":
      return 60;
    case "2H":
      return 120;
    case "2H+1FREE":
      return 180;
    case "FREE_3H":
      return 180;
    default:
      return 60;
  }
}

/* ========================================================================== */
/*  START SESSION (ACTIVE OR RESERVED)                                        */
/* ========================================================================== */

router.post("/sessions/start", async (req, res) => {
  const {
    device_id,
    player_name,
    member_id,
    customer_id,
    session_type,
    offer_code,
    planned_start_time,
  } = req.body || {};

  if (!device_id || !player_name || !session_type) {
    return res.status(400).json({
      error: "device_id, player_name and session_type are required",
    });
  }

  let pool;
  let transaction;

  try {
    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // 1) Check device
    const checkReq = new sql.Request(transaction);
    const devRes = await checkReq
      .input("device_id", sql.Int, device_id)
      .query(`
        SELECT device_id, status, price_per_hour
        FROM dbo.GamingDevices
        WHERE device_id = @device_id;
      `);

    if (devRes.recordset.length === 0) {
      throw new Error("Device not found");
    }

    const dev = devRes.recordset[0];
    if (dev.status === "InUse") {
      throw new Error("Device is already in use");
    }

    const now = new Date();

    // planned start
    let plannedStart = planned_start_time ? new Date(planned_start_time) : null;
    if (plannedStart && isNaN(plannedStart.getTime())) plannedStart = null;

    const isFutureReservation = plannedStart && plannedStart.getTime() > now.getTime();
    const status = isFutureReservation ? "Reserved" : "Active";

    // Fixed planning
    let planned_minutes = null;
    let planned_end_time = null;

    if (session_type === "Fixed") {
      planned_minutes = getPlannedMinutesFromOffer(offer_code) || 60;
      const baseStart = isFutureReservation ? plannedStart : now;
      planned_end_time = new Date(baseStart.getTime() + planned_minutes * 60 * 1000);
    }

    // FREE reward session logic
    const isFreeReward = offer_code === "FREE_3H";
    if (isFreeReward) {
      const cid = Number(customer_id || member_id);
      if (!cid) throw new Error("customer_id is required for FREE_3H reward session");

      // ✅ consume ONE unused reward atomically and return reward_id
      const consumeRes = await new sql.Request(transaction)
        .input("cid", sql.Int, cid)
        .query(`
          ;WITH r AS (
            SELECT TOP 1 reward_id
            FROM dbo.GamingRewards WITH (UPDLOCK, ROWLOCK)
            WHERE customer_id=@cid AND is_used=0 AND reward_type='FREE_3_HOURS'
            ORDER BY reward_id DESC
          )
          UPDATE dbo.GamingRewards
          SET is_used=1, used_at=SYSDATETIME()
          OUTPUT inserted.reward_id
          WHERE reward_id IN (SELECT reward_id FROM r);
        `);

      const rewardRow = consumeRes.recordset?.[0];
      if (!rewardRow?.reward_id) {
        throw new Error("No unused FREE_3_HOURS reward found for this customer");
      }
    }

    // Use customer_id as member_id if member_id not provided
    const actualMemberId = member_id || customer_id;

    // 2) Insert session
    const insertReq = new sql.Request(transaction);
    const insertRes = await insertReq
      .input("device_id", sql.Int, device_id)
      .input("player_name", sql.NVarChar(150), player_name)
      .input("member_id", sql.Int, actualMemberId || null)
      .input("session_type", sql.NVarChar(20), session_type)
      .input("offer_code", sql.NVarChar(50), offer_code || null)
      .input("planned_start_time", sql.DateTime2, plannedStart)
      .input("planned_minutes", sql.Int, planned_minutes)
      .input("planned_end_time", sql.DateTime2, planned_end_time)
      .input("start_time", sql.DateTime2, isFutureReservation ? null : now)
      .input("status", sql.NVarChar(20), status)
      .input("price_per_hour", sql.Decimal(10, 2), dev.price_per_hour)
      .query(`
        INSERT INTO dbo.GamingSessions
          (
            device_id, player_name, member_id, session_type, offer_code,
            start_time, planned_start_time, planned_minutes, planned_end_time,
            status, price_per_hour
          )
        OUTPUT INSERTED.*
        VALUES
          (
            @device_id, @player_name, @member_id, @session_type, @offer_code,
            @start_time, @planned_start_time, @planned_minutes, @planned_end_time,
            @status, @price_per_hour
          );
      `);

    const session = insertRes.recordset[0];

    // 3) Lock device only if ACTIVE now
    if (!isFutureReservation) {
      const updateReq = new sql.Request(transaction);
      await updateReq.input("device_id", sql.Int, device_id).query(`
        UPDATE dbo.GamingDevices
        SET status = 'InUse'
        WHERE device_id = @device_id;
      `);
    }

    await transaction.commit();

    /* ===================== PUSH NOTIFICATION ===================== */
    try {
      const cid = Number(customer_id || member_id);
      if (Number.isFinite(cid) && cid > 0) {
        const expoToken = await getCustomerPushToken(pool, cid);

        if (expoToken) {
          const timeHHMM = plannedStart ? dateToHHMM(plannedStart) : dateToHHMM(now);
          const timeText = timeHHMM || "now";
          const arriveAt = timeHHMM ? subtractMinutesHHMM(timeHHMM, 15) : null;

          const title = "🎮 Gaming Session Reserved";
          const body =
            status === "Reserved"
              ? `A gaming session was reserved for you at ${timeText}. Please arrive around ${
                  arriveAt || timeText
                }. Get ready!`
              : `Your gaming session started at ${timeText}. Enjoy!`;

          const pushRes = await sendExpoPush(expoToken, title, body, {
            type: "gaming_session",
            status,
            device_id,
            session_type,
            offer_code: offer_code || null,
            planned_start_time: plannedStart ? plannedStart.toISOString() : null,
            planned_end_time: planned_end_time ? planned_end_time.toISOString() : null,
            session_id: session.session_id,
          });

          console.log("📲 Gaming push result:", pushRes.ok, pushRes.json);
        } else {
          console.log("⚠️ No push token for customer_id:", cid);
        }
      }
    } catch (e) {
      console.log("❌ Gaming push send error:", e);
    }
    /* ============================================================= */

    // Email
    try {
      const cid = Number(customer_id || member_id);
      if (Number.isFinite(cid) && cid > 0) {
        const custRes = await pool
          .request()
          .input("cid", sql.Int, cid)
          .query(`SELECT email, name FROM dbo.Customers WHERE customer_id=@cid`);

        const customerEmail = custRes.recordset?.[0]?.email;
        const customerName = custRes.recordset?.[0]?.name || player_name || "Customer";

        if (customerEmail) {
          await sendMail(
            customerEmail,
            "🎮 Gaming Session Confirmed",
            `
              <h3>Gaming Session Confirmed</h3>
              <p>Hello ${customerName},</p>
              <p><b>Player:</b> ${player_name}</p>
              <p><b>Type:</b> ${session_type}</p>
              <p><b>Status:</b> ${status}</p>
              ${
                plannedStart
                  ? `<p><b>Planned Start:</b> ${plannedStart.toLocaleString()}</p>`
                  : `<p><b>Started:</b> ${now.toLocaleString()}</p>`
              }
              <p><b>Device ID:</b> ${device_id}</p>
              <p>Thanks for using Sport Zone.</p>
            `
          );
        }
      }
    } catch (mailErr) {
      console.log("Gaming mail error:", mailErr);
    }

    return res.json({ session: serializeSession(session) });
  } catch (err) {
    console.error("POST /api/gaming/sessions/start error:", err);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }
    return res.status(500).json({
      error: err.message || "Failed to start session",
    });
  }
});

/* ========================================================================== */
/*  CASH INVOICE PDF                                                          */
/* ========================================================================== */

// router.get("/payments/generate-cash-invoice/:session_id", async (req, res) => {
//   try {
//     const pool = await getPool();
//     const session_id = Number(req.params.session_id);

//     const r = await pool
//       .request()
//       .input("sid", sql.Int, session_id)
//       .query(`
//         SELECT TOP 1
//           s.session_id,
//           s.player_name,
//           s.session_type,
//           p.amount,
//           p.currency,
//           p.paid_at,
//           c.email AS customer_email,
//           c.name  AS customer_name
//         FROM dbo.GamingSessions s
//         JOIN dbo.GamingSessionPayments p ON p.session_id = s.session_id
//         LEFT JOIN dbo.Customers c ON c.customer_id = p.customer_id
//         WHERE s.session_id=@sid
//         ORDER BY p.payment_id DESC;
//       `);

//     const data = r.recordset?.[0];
//     if (!data) return res.status(404).json({ error: "Session/payment not found" });

//     const invoice_pdf_url = await generateAndSaveCashReceipt(
//       {
//         session_id: data.session_id,
//         player_name: data.player_name,
//         session_type: data.session_type,
//         amount: Number(data.amount || 0),
//         currency: data.currency || "USD",
//         paid_at: data.paid_at,
//         customer_email: data.customer_email,
//         customer_name: data.customer_name,
//       },
//       session_id
//     );

//     await pool
//       .request()
//       .input("sid", sql.Int, session_id)
//       .input("url", sql.NVarChar(500), invoice_pdf_url)
//       .query(`
//         UPDATE dbo.GamingSessionPayments
//         SET invoice_pdf_url=@url
//         WHERE payment_id = (
//           SELECT TOP 1 payment_id
//           FROM dbo.GamingSessionPayments
//           WHERE session_id=@sid
//           ORDER BY payment_id DESC
//         );
//       `);

//     return res.json({ success: true, invoice_pdf_url });
//   } catch (err) {
//     console.error("generate-cash-invoice error:", err);
//     return res.status(500).json({ error: err.message || "Failed to generate invoice" });
//   }
// });
router.get("/payments/generate-cash-invoice/:session_id", async (req, res) => {
  try {
    const pool = await getPool();
    const session_id = Number(req.params.session_id);

    const r = await pool
      .request()
      .input("sid", sql.Int, session_id)
      .query(`
        SELECT TOP 1
          s.session_id,
          s.player_name,
          s.session_type,
          p.amount,
          p.currency,
          p.paid_at,
          c.email AS customer_email,
          c.name  AS customer_name
        FROM dbo.GamingSessions s
        JOIN dbo.GamingSessionPayments p ON p.session_id = s.session_id
        LEFT JOIN dbo.Customers c ON c.customer_id = p.customer_id
        WHERE s.session_id=@sid
        ORDER BY p.payment_id DESC;
      `);

    const data = r.recordset?.[0];
    if (!data) return res.status(404).json({ error: "Session/payment not found" });

    const invoice_pdf_url = await generateAndSaveCashReceipt(
      {
        session_id: data.session_id,
        player_name: data.player_name,
        session_type: data.session_type,
        amount: Number(data.amount || 0),
        currency: data.currency || "USD",
        paid_at: data.paid_at,
        customer_email: data.customer_email,
        customer_name: data.customer_name,
      },
      session_id
    );

    await pool
      .request()
      .input("sid", sql.Int, session_id)
      .input("url", sql.NVarChar(500), invoice_pdf_url)
      .query(`
        UPDATE dbo.GamingSessionPayments
        SET invoice_pdf_url=@url
        WHERE payment_id = (
          SELECT TOP 1 payment_id
          FROM dbo.GamingSessionPayments
          WHERE session_id=@sid
          ORDER BY payment_id DESC
        );
      `);

    // ✅ FIX: Return the URL, but frontend will handle download differently
    return res.json({ 
      success: true, 
      invoice_pdf_url,
      session_id,
      player_name: data.player_name
    });

  } catch (err) {
    console.error("generate-cash-invoice error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate invoice" });
  }
});
/* ========================================================================== */
/*  PAYMENT STATUS (Stripe)                                                   */
/* ========================================================================== */

router.get("/payments/status/:session_id", async (req, res) => {
  try {
    const pool = await getPool();
    const session_id = Number(req.params.session_id);

    const payRes = await pool
      .request()
      .input("sid", sql.Int, session_id)
      .query(`
        SELECT TOP 1 *
        FROM dbo.GamingSessionPayments
        WHERE session_id=@sid
        ORDER BY payment_id DESC
      `);

    const payment = payRes.recordset?.[0];
    if (!payment) return res.status(404).json({ error: "No payment found for this session" });
    if (!payment.stripe_invoice_id) return res.status(400).json({ error: "Missing stripe_invoice_id" });

    const beforePaidAt = payment.paid_at;

    const inv = await stripe.invoices.retrieve(payment.stripe_invoice_id);

    const nowPaid = inv.status === "paid";
    const invPdf = inv.invoice_pdf || payment.invoice_pdf_url || null;
    const hostedUrl = inv.hosted_invoice_url || payment.hosted_invoice_url || null;

    await pool
      .request()
      .input("pid", sql.Int, payment.payment_id)
      .input("stripe_status", sql.NVarChar(50), inv.status || null)
      .input("is_paid", sql.Bit, nowPaid ? 1 : 0)
      .input("paid_at", sql.DateTime2, nowPaid ? new Date() : null)
      .input("invoice_pdf_url", sql.NVarChar(500), invPdf)
      .input("hosted_invoice_url", sql.NVarChar(500), hostedUrl)
      .query(`
        UPDATE dbo.GamingSessionPayments
        SET stripe_status=@stripe_status,
            is_paid=@is_paid,
            paid_at=CASE WHEN @is_paid=1 THEN ISNULL(paid_at, @paid_at) ELSE NULL END,
            invoice_pdf_url=@invoice_pdf_url,
            hosted_invoice_url=@hosted_invoice_url
        WHERE payment_id=@pid;
      `);

    // ✅ If invoice is paid for the FIRST time, confirm session + send push
    if (nowPaid && !beforePaidAt) {
      // ✅ CONFIRM SESSION AFTER PAYMENT (Reserved -> Active)
      await pool
        .request()
        .input("sid", sql.Int, session_id)
        .query(`
          UPDATE dbo.GamingSessions
          SET status = 'Active'
          WHERE session_id = @sid
            AND status = 'Reserved';
        `);

      // Push only once
      try {
        const sRes = await pool
          .request()
          .input("sid", sql.Int, session_id)
          .query(`SELECT TOP 1 member_id FROM dbo.GamingSessions WHERE session_id=@sid`);

        const memberId = sRes.recordset?.[0]?.member_id || null;
        const cid = Number(payment.customer_id || memberId || payment.member_id);

        if (Number.isFinite(cid) && cid > 0) {
          const expoToken = await getCustomerPushToken(pool, cid);
          if (expoToken) {
            await sendExpoPush(
              expoToken,
              "✅ Payment Received",
              "Your reservation is confirmed. No need to pay at the center.",
              {
                type: "gaming_payment",
                session_id,
                payment_id: payment.payment_id,
                is_paid: true,
              }
            );
          }
        }
      } catch (e) {
        console.log("Gaming payment push error:", e);
      }
    }

    return res.json({
      session_id,
      payment_id: payment.payment_id,
      stripe_status: inv.status,
      hosted_invoice_url: hostedUrl,
      invoice_pdf_url: invPdf,
      is_paid: nowPaid,
    });
  } catch (err) {
    console.error("GET /api/gaming/payments/status/:session_id error:", err);
    return res.status(500).json({ error: err.message || "Failed to check payment status" });
  }
});

/* ========================================================================== */
/*  TEST ROUTE                                                                */
/* ========================================================================== */

router.get("/test-pdf", (_req, res) => {
  console.log("✅ TEST ROUTE HIT!");
  res.json({
    success: true,
    message: "Test route working",
    timestamp: new Date().toISOString(),
  });
});

/* ========================================================================== */
/*  STRIPE WEBHOOK                                                            */
/* ========================================================================== */
router.post("/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log("❌ Stripe webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const stripe_invoice_id = invoice.id;

      const pool = await getPool();

      const pRes = await pool
        .request()
        .input("iid", sql.NVarChar(200), stripe_invoice_id)
        .query(`
          SELECT TOP 1 *
          FROM dbo.GamingSessionPayments
          WHERE stripe_invoice_id=@iid
          ORDER BY payment_id DESC
        `);

      const payment = pRes.recordset?.[0];

      if (payment) {
        const beforePaidAt = payment.paid_at;

        const invPdf = invoice.invoice_pdf || payment.invoice_pdf_url || null;
        const hostedUrl = invoice.hosted_invoice_url || payment.hosted_invoice_url || null;

        await pool
          .request()
          .input("pid", sql.Int, payment.payment_id)
          .input("stripe_status", sql.NVarChar(50), "paid")
          .input("is_paid", sql.Bit, 1)
          .input("paid_at", sql.DateTime2, new Date())
          .input("invoice_pdf_url", sql.NVarChar(500), invPdf)
          .input("hosted_invoice_url", sql.NVarChar(500), hostedUrl)
          .query(`
            UPDATE dbo.GamingSessionPayments
            SET stripe_status=@stripe_status,
                is_paid=@is_paid,
                paid_at=ISNULL(paid_at, @paid_at),
                invoice_pdf_url=@invoice_pdf_url,
                hosted_invoice_url=@hosted_invoice_url
            WHERE payment_id=@pid;
          `);

        // ✅ CONFIRM SESSION AFTER STRIPE WEBHOOK (Reserved -> Active)
        await pool
          .request()
          .input("sid", sql.Int, payment.session_id)
          .query(`
            UPDATE dbo.GamingSessions
            SET status = 'Active'
            WHERE session_id = @sid
              AND status = 'Reserved';
          `);

        // Push only once
        if (!beforePaidAt) {
          try {
            const sRes = await pool
              .request()
              .input("sid", sql.Int, payment.session_id)
              .query(`SELECT TOP 1 member_id FROM dbo.GamingSessions WHERE session_id=@sid`);

            const memberId = sRes.recordset?.[0]?.member_id || null;
            const cid = Number(payment.customer_id || memberId || payment.member_id);

            if (Number.isFinite(cid) && cid > 0) {
              const expoToken = await getCustomerPushToken(pool, cid);
              if (expoToken) {
                await sendExpoPush(
                  expoToken,
                  "✅ Payment Received",
                  "Your reservation is confirmed. No need to pay at the center.",
                  {
                    type: "gaming_payment",
                    session_id: payment.session_id,
                    payment_id: payment.payment_id,
                    is_paid: true,
                  }
                );
              }
            }
          } catch (e) {
            console.log("Gaming payment push error:", e);
          }
        }
      }
    }

    return res.json({ received: true });
  } catch (e) {
    console.log("Webhook handler error:", e);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

/* ========================================================================== */
/*  PAYMENTS: CREATE STRIPE INVOICE                                           */
/* ========================================================================== */

// router.post("/payments/create-invoice", async (req, res) => {
//   try {
//     const pool = await getPool();

//     const { session_id, customer_id } = req.body || {};
//     if (!session_id) return res.status(400).json({ error: "session_id is required" });

//     const sRes = await pool
//       .request()
//       .input("sid", sql.Int, Number(session_id))
//       .query(`
//         SELECT TOP 1
//           s.session_id, s.member_id, s.session_type, s.offer_code, s.status,
//           s.planned_start_time, s.price_per_hour
//         FROM dbo.GamingSessions s
//         WHERE s.session_id=@sid;
//       `);

//     const session = sRes.recordset?.[0];
//     if (!session) return res.status(404).json({ error: "Session not found" });

//     if (session.offer_code === "FREE_3H") {
//       return res.status(400).json({ error: "This session is a FREE reward. No payment allowed." });
//     }

//     const status = String(session.status || "").trim().toLowerCase();
//     if (!["reserved", "active"].includes(status)) {
//       return res.status(400).json({
//         error: `This session cannot be paid online (status=${session.status})`,
//       });
//     }

//     const payerId = Number(customer_id || session.member_id);
//     if (!payerId) return res.status(400).json({ error: "customer_id is required" });

//     const existingPay = await pool
//       .request()
//       .input("sid", sql.Int, Number(session_id))
//       .query(`
//         SELECT TOP 1 *
//         FROM dbo.GamingSessionPayments
//         WHERE session_id=@sid
//         ORDER BY payment_id DESC
//       `);

//     const last = existingPay.recordset?.[0];
//     if (last && !last.is_paid && (last.stripe_status === "draft" || last.stripe_status === "open")) {
//       return res.json({
//         session_id: Number(session_id),
//         amount: Number(last.amount),
//         currency: last.currency,
//         stripe_status: last.stripe_status,
//         hosted_invoice_url: last.hosted_invoice_url,
//         invoice_pdf_url: last.invoice_pdf_url,
//         is_paid: !!last.is_paid,
//       });
//     }

//     const pricePerHour = Number(session.price_per_hour || 0);
//     if (!pricePerHour || pricePerHour <= 0) {
//       return res.status(400).json({ error: "Invalid price_per_hour for this session" });
//     }

//     const chargeHours = computeGamingChargeHours(session.session_type, session.offer_code);
//     const amount = Number((pricePerHour * chargeHours).toFixed(2));
//     const currency = "usd";

//     const { email, name } = await getCustomerEmailAndName(pool, payerId);
//     if (!email) return res.status(400).json({ error: "Customer email not found (needed for Stripe)" });

//     const stripeCustomer = await stripe.customers.create({
//       email,
//       name: name || "Customer",
//       metadata: { customer_id: String(payerId), session_id: String(session_id) },
//     });

//     await stripe.invoiceItems.create({
//       customer: stripeCustomer.id,
//       currency,
//       amount: Math.round(amount * 100),
//       description: `Gaming Session Payment (Session #${session_id})`,
//     });

//     const invoice = await stripe.invoices.create({
//       customer: stripeCustomer.id,
//       collection_method: "send_invoice",
//       days_until_due: 1,
//       auto_advance: true,
//       metadata: { session_id: String(session_id), customer_id: String(payerId) },
//     });

//     const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

//     await pool
//       .request()
//       .input("session_id", sql.Int, Number(session_id))
//       .input("customer_id", sql.Int, payerId)
//       .input("member_id", sql.Int, session.member_id || null)
//       .input("amount", sql.Decimal(10, 2), amount)
//       .input("currency", sql.NVarChar(10), currency)
//       .input("stripe_invoice_id", sql.NVarChar(200), finalized.id)
//       .input("hosted_invoice_url", sql.NVarChar(500), finalized.hosted_invoice_url || null)
//       .input("invoice_pdf_url", sql.NVarChar(500), finalized.invoice_pdf || null)
//       .input("stripe_status", sql.NVarChar(50), finalized.status || null)
//       .input("is_paid", sql.Bit, finalized.status === "paid" ? 1 : 0)
//       .query(`
//         INSERT INTO dbo.GamingSessionPayments
//           (session_id, customer_id, member_id, amount, currency, stripe_invoice_id,
//            hosted_invoice_url, invoice_pdf_url, stripe_status, is_paid, paid_at)
//         VALUES
//           (@session_id, @customer_id, @member_id, @amount, @currency, @stripe_invoice_id,
//            @hosted_invoice_url, @invoice_pdf_url, @stripe_status, @is_paid,
//            CASE WHEN @is_paid=1 THEN SYSDATETIME() ELSE NULL END);
//       `);

//     return res.json({
//       session_id: Number(session_id),
//       amount,
//       currency,
//       stripe_status: finalized.status,
//       hosted_invoice_url: finalized.hosted_invoice_url,
//       invoice_pdf_url: finalized.invoice_pdf,
//       is_paid: finalized.status === "paid",
//     });
//   } catch (err) {
//     console.error("POST /api/gaming/payments/create-invoice error:", err);
//     return res.status(500).json({ error: err.message || "Failed to create invoice" });
//   }
// });
router.post("/payments/create-invoice", async (req, res) => {
  try {
    const pool = await getPool();
    const { session_id, customer_id } = req.body || {};

    if (!session_id) return res.status(400).json({ error: "session_id is required" });

    // Stripe must be configured
    if (!stripe) {
      return res.status(500).json({
        error: "Stripe is not configured. Missing STRIPE_SECRET_KEY in .env",
      });
    }

    // 1) Get session
    const sessionRes = await pool
      .request()
      .input("sid", sql.Int, Number(session_id))
      .query(`
        SELECT TOP 1
          gs.session_id,
          gs.member_id,
          gs.status,
          gs.session_type,
          gs.offer_code,
          gs.price_per_hour
        FROM dbo.GamingSessions gs
        WHERE gs.session_id = @sid
      `);

    const session = sessionRes.recordset?.[0];
    if (!session) return res.status(404).json({ error: "Session not found" });

    // if (session.status !== "Reserved") {
    //   return res.status(400).json({
    //     error: `This session cannot be paid online (status=${session.status})`,
    //   });
    // }
const status = String(session.status || "").trim().toLowerCase();
if (!["reserved", "active"].includes(status)) {
  return res.status(400).json({
    error: `This session cannot be paid online (status=${session.status})`,
  });
}

    const payerId = Number(customer_id || session.member_id);
    if (!payerId) return res.status(400).json({ error: "customer_id is required" });

    // 2) Reuse existing open invoice (avoid creating new each time)
    const existingPay = await pool
      .request()
      .input("sid", sql.Int, Number(session_id))
      .query(`
        SELECT TOP 1 *
        FROM dbo.GamingSessionPayments
        WHERE session_id=@sid
        ORDER BY payment_id DESC
      `);

    const last = existingPay.recordset?.[0];
    if (last && !last.is_paid && (last.stripe_status === "draft" || last.stripe_status === "open")) {
      return res.json({
        session_id: Number(session_id),
        amount: Number(last.amount),
        currency: last.currency,
        stripe_status: last.stripe_status,
        hosted_invoice_url: last.hosted_invoice_url,
        invoice_pdf_url: last.invoice_pdf_url,
        is_paid: !!last.is_paid,
      });
    }

    // 3) Compute amount
    const pricePerHour = Number(session.price_per_hour || 0);
    if (!pricePerHour || pricePerHour <= 0) {
      return res.status(400).json({ error: "Invalid price_per_hour for this session" });
    }

    const chargeHours = computeGamingChargeHours(session.session_type, session.offer_code);
    const amount = Number((pricePerHour * chargeHours).toFixed(2));
    const currency = "usd";

    const amountCents = Math.round(amount * 100);
    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ error: "Stripe amount must be > 0" });
    }

    // 4) Customer email for Stripe
    const { email, name } = await getCustomerEmailAndName(pool, payerId);
    if (!email) return res.status(400).json({ error: "Customer email not found (needed for Stripe)" });

    // 5) Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      name: name || "Customer",
      metadata: { customer_id: String(payerId), session_id: String(session_id) },
    });

    // ✅ FIXED ORDER (same as sports)
    // 6) Create invoice FIRST (pay-now)
    const invoice = await stripe.invoices.create({
      customer: stripeCustomer.id,
      collection_method: "charge_automatically",
      auto_advance: true,
      metadata: { session_id: String(session_id), customer_id: String(payerId) },
    });

    // 7) Attach invoice item to THIS invoice
    await stripe.invoiceItems.create({
      customer: stripeCustomer.id,
      invoice: invoice.id, // ✅ IMPORTANT
      currency,
      amount: amountCents,
      description: `Gaming Session Payment (Session #${session_id})`,
    });

    // 8) Finalize invoice
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // 9) Save DB record
    await pool
      .request()
      .input("session_id", sql.Int, Number(session_id))
      .input("customer_id", sql.Int, payerId)
      .input("member_id", sql.Int, session.member_id || null)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("currency", sql.NVarChar(10), currency)
      .input("stripe_invoice_id", sql.NVarChar(200), finalized.id)
      .input("hosted_invoice_url", sql.NVarChar(500), finalized.hosted_invoice_url || null)
      .input("invoice_pdf_url", sql.NVarChar(500), finalized.invoice_pdf || null)
      .input("stripe_status", sql.NVarChar(50), finalized.status || null)
      .input("is_paid", sql.Bit, finalized.status === "paid" ? 1 : 0)
      .query(`
        INSERT INTO dbo.GamingSessionPayments
          (session_id, customer_id, member_id, amount, currency, stripe_invoice_id,
           hosted_invoice_url, invoice_pdf_url, stripe_status, is_paid, paid_at)
        VALUES
          (@session_id, @customer_id, @member_id, @amount, @currency, @stripe_invoice_id,
           @hosted_invoice_url, @invoice_pdf_url, @stripe_status, @is_paid,
           CASE WHEN @is_paid=1 THEN SYSDATETIME() ELSE NULL END);
      `);

    return res.json({
      session_id: Number(session_id),
      amount,
      currency,
      stripe_status: finalized.status,
      hosted_invoice_url: finalized.hosted_invoice_url,
      invoice_pdf_url: finalized.invoice_pdf,
      is_paid: finalized.status === "paid",
    });
  } catch (err) {
    console.error("POST /api/gaming/payments/create-invoice error:", err);
    return res.status(500).json({ error: err.message || "Failed to create invoice" });
  }
});

/* ========================================================================== */
/*  PAYMENTS: CASH                                                            */
/* ========================================================================== */

router.post("/payments/pay-cash", async (req, res) => {
  try {
    const pool = await getPool();
    const { session_id, customer_id, confirm } = req.body || {};

    if (!session_id) return res.status(400).json({ error: "session_id is required" });

    const sRes = await pool
      .request()
      .input("sid", sql.Int, Number(session_id))
      .query(`
        SELECT TOP 1
          s.session_id, s.member_id, s.session_type, s.offer_code, s.status,
          s.price_per_hour
        FROM dbo.GamingSessions s
        WHERE s.session_id=@sid;
      `);

    const session = sRes.recordset?.[0];
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.offer_code === "FREE_3H") {
      return res.status(400).json({ error: "This session is a FREE reward. No cash payment allowed." });
    }

    const payerId = Number(customer_id || session.member_id);
    if (!payerId) return res.status(400).json({ error: "customer_id is required" });

    const pricePerHour = Number(session.price_per_hour || 0);
    if (!pricePerHour || pricePerHour <= 0) {
      return res.status(400).json({ error: "Invalid price_per_hour for this session" });
    }

    const chargeHours = computeGamingChargeHours(session.session_type, session.offer_code);
    const amount = Number((pricePerHour * chargeHours).toFixed(2));
    const isPaid = confirm ? 1 : 0;

    await pool
      .request()
      .input("session_id", sql.Int, Number(session_id))
      .input("customer_id", sql.Int, payerId)
      .input("member_id", sql.Int, session.member_id || null)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("currency", sql.NVarChar(10), "usd")
      .input("stripe_status", sql.NVarChar(50), "cash")
      .input("is_paid", sql.Bit, isPaid)
      .query(`
        IF EXISTS (
          SELECT 1 FROM dbo.GamingSessionPayments
          WHERE session_id=@session_id AND stripe_status='cash'
        )
        BEGIN
          UPDATE dbo.GamingSessionPayments
          SET
            customer_id=@customer_id,
            member_id=@member_id,
            amount=@amount,
            currency=@currency,
            stripe_status=@stripe_status,
            is_paid=@is_paid,
            paid_at = CASE WHEN @is_paid=1 THEN ISNULL(paid_at, SYSDATETIME()) ELSE paid_at END
          WHERE session_id=@session_id AND stripe_status='cash';
        END
        ELSE
        BEGIN
          INSERT INTO dbo.GamingSessionPayments
            (session_id, customer_id, member_id, amount, currency, stripe_status, is_paid, paid_at)
          VALUES
            (@session_id, @customer_id, @member_id, @amount, @currency, @stripe_status, @is_paid,
             CASE WHEN @is_paid=1 THEN SYSDATETIME() ELSE NULL END);
        END
      `);

    // optional push notification
    try {
      const expoToken = await getCustomerPushToken(pool, payerId);
      if (expoToken) {
        await sendExpoPush(
          expoToken,
          confirm ? "✅ Cash Payment Confirmed" : "Cash Payment Selected",
          confirm
            ? "Payment received. Your reservation is confirmed."
            : "Your session is reserved. Please pay at the center to confirm.",
          { type: confirm ? "gaming_cash_paid" : "gaming_cash", session_id: Number(session_id) }
        );
      }
    } catch (e) {
      console.log("Cash push error:", e);
    }

    return res.json({
      ok: true,
      session_id: Number(session_id),
      payment_method: "cash",
      amount,
      is_paid: !!confirm,
    });
  } catch (err) {
    console.error("POST /api/gaming/payments/pay-cash error:", err);
    return res.status(500).json({ error: err.message || "Failed to set cash payment" });
  }
});

/* ========================================================================== */
/*  END SESSION                                                               */
/* ========================================================================== */

router.post("/sessions/end", async (req, res) => {
  const { session_id, end_time } = req.body || {};

  if (!session_id) {
    return res.status(400).json({ error: "session_id is required" });
  }

  let pool;
  let transaction;

  try {
    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const loadReq = new sql.Request(transaction);
    const sesRes = await loadReq
      .input("session_id", sql.Int, session_id)
      .query(`
        SELECT
          s.*,
          d.price_per_hour AS device_price_per_hour,
          d.status AS device_status
        FROM dbo.GamingSessions s
        JOIN dbo.GamingDevices d
          ON d.device_id = s.device_id
        WHERE s.session_id = @session_id;
      `);

    if (sesRes.recordset.length === 0) throw new Error("Session not found");

    const s = sesRes.recordset[0];
    if (s.status !== "Active") throw new Error("Session is not active");

    const endTime = end_time ? new Date(end_time) : new Date();
    const pricePerHour = s.price_per_hour ?? s.device_price_per_hour ?? 0;

    const { hoursRounded, baseAmount, discount, finalAmount, points } = computeBillingAndPoints({
      start_time: s.start_time,
      end_time: endTime,
      price_per_hour: pricePerHour,
      offer_code: s.offer_code,
    });

    // Update session
    const updateSessionReq = new sql.Request(transaction);
    await updateSessionReq
      .input("session_id", sql.Int, session_id)
      .input("end_time", sql.DateTime2, endTime)
      .input("hours_played", sql.Decimal(10, 2), hoursRounded)
      .input("base_amount", sql.Decimal(10, 2), baseAmount)
      .input("discount_amount", sql.Decimal(10, 2), discount)
      .input("final_amount", sql.Decimal(10, 2), finalAmount)
      .query(`
        UPDATE dbo.GamingSessions
        SET
          end_time = @end_time,
          hours_played = @hours_played,
          base_amount = @base_amount,
          discount_amount = @discount_amount,
          final_amount = @final_amount,
          status = 'Completed'
        WHERE session_id = @session_id;
      `);

    // Free device
    const freeReq = new sql.Request(transaction);
    await freeReq.input("device_id", sql.Int, s.device_id).query(`
      UPDATE dbo.GamingDevices
      SET status='Available'
      WHERE device_id=@device_id;
    `);

    // Find or create player
    const findPlayerReq = new sql.Request(transaction);
    const playerFind = await findPlayerReq
      .input("player_name", sql.NVarChar(150), s.player_name)
      .query(`
        SELECT *
        FROM dbo.GamingPlayerPoints
        WHERE player_name = @player_name;
      `);

    let playerId;
    if (playerFind.recordset.length === 0) {
      const insPlayerReq = new sql.Request(transaction);
      const insPlayer = await insPlayerReq
        .input("player_name", sql.NVarChar(150), s.player_name)
        .input("member_id", sql.Int, s.member_id || null)
        .input("total_points", sql.Int, points)
        .input("total_hours", sql.Decimal(10, 2), hoursRounded)
        .query(`
          INSERT INTO dbo.GamingPlayerPoints (player_name, member_id, total_points, total_hours)
          OUTPUT INSERTED.player_id
          VALUES (@player_name, @member_id, @total_points, @total_hours);
        `);
      playerId = insPlayer.recordset[0].player_id;
    } else {
      const existing = playerFind.recordset[0];
      playerId = existing.player_id;

      const updatePointsReq = new sql.Request(transaction);
      await updatePointsReq
        .input("points_add", sql.Int, points)
        .input("hours_add", sql.Decimal(10, 2), hoursRounded)
        .input("player_id", sql.Int, playerId)
        .query(`
          UPDATE dbo.GamingPlayerPoints
          SET
            total_points = total_points + @points_add,
            total_hours  = total_hours  + @hours_add,
            last_updated = SYSDATETIME()
          WHERE player_id = @player_id;
        `);
    }

    // Points history
    const historyReq = new sql.Request(transaction);
    await historyReq
      .input("player_id", sql.Int, playerId)
      .input("session_id", sql.Int, session_id)
      .input("points_earned", sql.Int, points)
      .input("reason", sql.NVarChar(100), "Session end")
      .query(`
        INSERT INTO dbo.GamingPointsHistory (player_id, session_id, points_earned, reason)
        VALUES (@player_id, @session_id, @points_earned, @reason);
      `);

    await transaction.commit();

    res.json({
      ok: true,
      session_id,
      hours_played: hoursRounded,
      base_amount: baseAmount,
      discount_amount: discount,
      final_amount: finalAmount,
      points_earned: points,
      start_time: toLocalSqlString(s.start_time),
      end_time: toLocalSqlString(endTime),
    });
  } catch (err) {
    console.error("POST /api/gaming/sessions/end error:", err);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }
    res.status(500).json({ error: err.message || "Failed to end session" });
  }
});

/* ========================================================================== */
/*  DELETE SESSION                                                            */
/* ========================================================================== */

router.delete("/sessions/:session_id", async (req, res) => {
  const session_id = Number(req.params.session_id);

  if (!session_id) {
    return res.status(400).json({ error: "Invalid session_id" });
  }

  let pool;
  let transaction;

  try {
    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const loadReq = new sql.Request(transaction);
    const sesRes = await loadReq
      .input("session_id", sql.Int, session_id)
      .query(`
        SELECT session_id, device_id, status
        FROM dbo.GamingSessions
        WHERE session_id = @session_id;
      `);

    if (sesRes.recordset.length === 0) throw new Error("Session not found");

    const deviceId = Number(sesRes.recordset[0].device_id);

    await new sql.Request(transaction).input("session_id", sql.Int, session_id).query(`
      DELETE FROM dbo.GamingPointsHistory
      WHERE session_id = @session_id;
    `);

    await new sql.Request(transaction).input("session_id", sql.Int, session_id).query(`
      DELETE FROM dbo.GamingSessions
      WHERE session_id = @session_id;
    `);

    if (sesRes.recordset[0].status === "Active") {
      await new sql.Request(transaction).input("device_id", sql.Int, deviceId).query(`
        UPDATE dbo.GamingDevices
        SET status = 'Available'
        WHERE device_id = @device_id;
      `);
    }

    await transaction.commit();

    res.json({
      ok: true,
      message: "Session deleted successfully",
      deleted_session_id: session_id,
    });
  } catch (err) {
    console.error("DELETE /api/gaming/sessions/:id error:", err);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }
    res.status(500).json({ error: err.message || "Failed to delete session" });
  }
});

/* ========================================================================== */
/*  PLAYERS                                                                   */
/* ========================================================================== */

router.get("/players", async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        gp.player_id,
        gp.player_name,
        gp.member_id,
        gp.total_points,
        gp.total_hours,
        gp.last_updated,
        CASE WHEN gp.total_points >= 25 THEN 1 ELSE 0 END AS eligible_for_spin,
        CASE WHEN EXISTS (
          SELECT 1
          FROM dbo.GamingRewards gr
          JOIN dbo.GamingCustomerPlayerMap m ON m.customer_id = gr.customer_id
          WHERE m.player_id = gp.player_id
            AND gr.is_used = 0
            AND gr.reward_type = 'FREE_3_HOURS'
        ) THEN 1 ELSE 0 END AS has_unused_reward
      FROM dbo.GamingPlayerPoints gp
      ORDER BY gp.total_points DESC, gp.total_hours DESC;
    `);

    const players = result.recordset.map(serializeSession);
    res.json({ players });
  } catch (err) {
    console.error("GET /api/gaming/players error:", err);
    res.status(500).json({ error: "Failed to load players & points" });
  }
});

/* ========================================================================== */
/*  SPIN: CANDIDATES                                                          */
/* ========================================================================== */

router.get("/spin/candidates", async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        player_id,
        player_name,
        member_id,
        total_points,
        total_hours,
        last_updated,
        CASE WHEN total_points >= 25 THEN 1 ELSE 0 END AS eligible_for_spin
      FROM dbo.GamingPlayerPoints
      WHERE total_points >= 25
      ORDER BY total_points DESC, total_hours DESC;
    `);

    const players = result.recordset.map(serializeSession);
    res.json({ players });
  } catch (err) {
    console.error("GET /api/gaming/spin/candidates error:", err);
    res.status(500).json({ error: "Failed to load spin candidates" });
  }
});

/* ========================================================================== */
/*  SPIN: DRAW                                                                */
/* ========================================================================== */

router.post("/spin/draw", async (req, res) => {
  const { player_id } = req.body || {};

  let pool;
  let transaction;

  try {
    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const reqBase = new sql.Request(transaction);

    let playersRes;
    if (player_id) {
      playersRes = await reqBase
        .input("player_id", sql.Int, player_id)
        .query(`
          SELECT *
          FROM dbo.GamingPlayerPoints
          WHERE player_id = @player_id
            AND total_points >= 25;
        `);
    } else {
      playersRes = await reqBase.query(`
        SELECT *
        FROM dbo.GamingPlayerPoints
        WHERE total_points >= 25;
      `);
    }

    if (playersRes.recordset.length === 0) {
      throw new Error("No eligible players (need at least 25 points).");
    }

    const candidates = playersRes.recordset.map((p) => ({
      player_id: p.player_id,
      player_name: p.player_name,
      member_id: p.member_id,
      total_points: p.total_points,
      total_hours: p.total_hours,
    }));

    let aiWinnerId;
    let aiPrizeName;
    let aiAnnouncement = "";

    try {
      const aiResult = await chooseWinnerAndPrizeWithGemini(candidates, SPIN_PRIZES);
      aiWinnerId = aiResult.winner_id;
      aiPrizeName = aiResult.prize_name;
      aiAnnouncement = aiResult.announcement || "";
    } catch (aiErr) {
      console.error("Gemini spin error, falling back to random:", aiErr);
      const randomWinner = playersRes.recordset[Math.floor(Math.random() * playersRes.recordset.length)];
      const randomPrize = SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)];
      aiWinnerId = randomWinner.player_id;
      aiPrizeName = randomPrize.name;
      aiAnnouncement = "System fallback: random winner selected.";
    }

    if (!playersRes.recordset.find((p) => p.player_id === aiWinnerId)) {
      aiWinnerId = playersRes.recordset[0].player_id;
    }

    const winner = playersRes.recordset.find((p) => p.player_id === aiWinnerId) || playersRes.recordset[0];
    let prize = SPIN_PRIZES.find((p) => p.name === aiPrizeName);

    if (!prize) {
      prize = SPIN_PRIZES[0];
      aiPrizeName = prize.name;
    }

    const pointsCost = prize.points_cost || 25;

    // Deduct points
    await new sql.Request(transaction)
      .input("player_id", sql.Int, winner.player_id)
      .input("cost", sql.Int, pointsCost)
      .query(`
        UPDATE dbo.GamingPlayerPoints
        SET total_points = total_points - @cost
        WHERE player_id = @player_id;
      `);

    // Record spin history
    const historyRes = await new sql.Request(transaction)
      .input("player_id", sql.Int, winner.player_id)
      .input("prize_name", sql.NVarChar(100), aiPrizeName)
      .input("points_spent", sql.Int, pointsCost)
      .query(`
        INSERT INTO dbo.GamingSpinHistory (player_id, prize_name, points_spent)
        OUTPUT INSERTED.*
        VALUES (@player_id, @prize_name, @points_spent);
      `);

    // player_id -> customer_id
    const mapRes = await new sql.Request(transaction)
      .input("pid", sql.Int, winner.player_id)
      .query(`
        SELECT TOP 1 customer_id
        FROM dbo.GamingCustomerPlayerMap
        WHERE player_id = @pid;
      `);

    const winnerCustomerId = mapRes.recordset?.[0]?.customer_id || null;
    if (!winnerCustomerId) {
      throw new Error(`Winner player_id=${winner.player_id} has no mapping in GamingCustomerPlayerMap`);
    }

    // Create reward row (unused)
    const rewardType = prize.reward_type || "FREE_3_HOURS";
    const hoursFree = prize.hours_free || 3;

    const rewardRes = await new sql.Request(transaction)
      .input("customer_id", sql.Int, winnerCustomerId)
      .input("player_id", sql.Int, winner.player_id)
      .input("reward_type", sql.NVarChar(50), rewardType)
      .input("hours_free", sql.Int, hoursFree)
      .query(`
        INSERT INTO dbo.GamingRewards (customer_id, player_id, reward_type, hours_free, is_used)
        OUTPUT INSERTED.reward_id, INSERTED.customer_id, INSERTED.player_id, INSERTED.reward_type, INSERTED.hours_free, INSERTED.is_used, INSERTED.created_at
        VALUES (@customer_id, @player_id, @reward_type, @hours_free, 0);
      `);

    const createdReward = rewardRes.recordset?.[0] || null;

    await transaction.commit();

    // Push winner notification
    try {
      const expoToken = await getCustomerPushToken(pool, winnerCustomerId);
      if (expoToken) {
        await sendExpoPush(
          expoToken,
          "🎉 Congratulations!",
          `Congratulations you won a free session of 3 hours Mr: ${winner.player_name}`,
          {
            type: "gaming_reward",
            reward_type: "FREE_3_HOURS",
            hours_free: 3,
            player_id: winner.player_id,
            customer_id: winnerCustomerId,
          }
        );
      }
    } catch (e) {
      console.log("❌ Winner push error:", e);
    }

    res.json({
      ok: true,
      winner: {
        player_id: winner.player_id,
        player_name: winner.player_name,
        member_id: winner.member_id,
        customer_id: winnerCustomerId,
        total_points_after: winner.total_points - pointsCost,
      },
      prize: aiPrizeName,
      points_spent: pointsCost,
      ai_message: aiAnnouncement,
      reward: createdReward,
      spin: serializeSession(historyRes.recordset[0]),
    });
  } catch (err) {
    console.error("POST /api/gaming/spin/draw error:", err);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }
    res.status(500).json({ error: err.message || "Failed to run spin" });
  }
});

/* ========================================================================== */
/*  AUTO ACTIVATION                                                           */
/* ========================================================================== */

async function autoActivateReservedSessions() {
  try {
    const pool = await getDatabase();
    const now = new Date();

    const resv = await pool
      .request()
      .input("now", sql.DateTime2, now)
      .query(`
        SELECT session_id, device_id, session_type, offer_code, planned_start_time, planned_minutes
        FROM dbo.GamingSessions
        WHERE status='Reserved'
          AND planned_start_time IS NOT NULL
          AND planned_start_time <= @now;
      `);

    if (resv.recordset.length === 0) return;

    for (const s of resv.recordset) {
      const startTime = new Date(s.planned_start_time);
      let plannedEnd = null;

      if (s.session_type === "Fixed" && s.planned_minutes) {
        plannedEnd = new Date(startTime.getTime() + s.planned_minutes * 60 * 1000);
      }

      await pool
        .request()
        .input("session_id", sql.Int, s.session_id)
        .input("start_time", sql.DateTime2, startTime)
        .input("planned_end_time", sql.DateTime2, plannedEnd)
        .query(`
          UPDATE dbo.GamingSessions
          SET status='Active',
              start_time=@start_time,
              planned_end_time=@planned_end_time
          WHERE session_id=@session_id;
        `);

      await pool.request().input("device_id", sql.Int, s.device_id).query(`
          UPDATE dbo.GamingDevices
          SET status='InUse'
          WHERE device_id=@device_id;
        `);
    }

    console.log(`[AUTO-ACTIVATE] Activated ${resv.recordset.length} sessions.`);
  } catch (err) {
    console.error("[AUTO-ACTIVATE] error:", err);
  }
}

async function autoCompleteFinishedSessions() {
  try {
    const pool = await getDatabase();
    const now = new Date();

    const finished = await pool
      .request()
      .input("now", sql.DateTime2, now)
      .query(`
        SELECT session_id, device_id, planned_end_time
        FROM dbo.GamingSessions
        WHERE status='Active'
          AND session_type='Fixed'
          AND planned_end_time IS NOT NULL
          AND planned_end_time <= @now;
      `);

    if (finished.recordset.length === 0) return;

    for (const s of finished.recordset) {
      const endTime = new Date(s.planned_end_time);

      await pool
        .request()
        .input("session_id", sql.Int, s.session_id)
        .input("end_time", sql.DateTime2, endTime)
        .query(`
          UPDATE dbo.GamingSessions
          SET status='Completed',
              end_time=@end_time
          WHERE session_id=@session_id;
        `);

      await pool.request().input("device_id", sql.Int, s.device_id).query(`
          UPDATE dbo.GamingDevices
          SET status='Available'
          WHERE device_id=@device_id;
        `);
    }

    console.log(`[AUTO-COMPLETE] Completed ${finished.recordset.length} sessions.`);
  } catch (err) {
    console.error("[AUTO-COMPLETE] error:", err);
  }
}

// Run every 30 seconds
setInterval(() => {
  autoActivateReservedSessions();
  autoCompleteFinishedSessions();
}, 30 * 1000);

/* ========================================================================== */
/*  REWARDS SUMMARY                                                           */
/* ========================================================================== */

router.get("/rewards/summary/:playerName", async (req, res) => {
  try {
    const playerName = decodeURIComponent(req.params.playerName || "").trim();
    if (!playerName) {
      return res.status(400).json({ error: "Missing player name" });
    }

    const pool = await getDatabase();

    const result = await pool
      .request()
      .input("player_name", sql.NVarChar(150), playerName)
      .query(`
        SELECT
          COUNT(*) AS total_sessions,
          ISNULL(SUM(CAST(hours_played AS float)), 0) AS total_hours,
          ISNULL(SUM(CAST(final_amount AS float)), 0) AS total_spent
        FROM dbo.GamingSessions
        WHERE player_name = @player_name
          AND end_time IS NOT NULL;
      `);

    const row = result.recordset?.[0] || {};
    return res.json({
      total_sessions: Number(row.total_sessions || 0),
      total_hours: Number(row.total_hours || 0),
      total_spent: Number(row.total_spent || 0),
    });
  } catch (err) {
    console.error("GET /api/gaming/rewards/summary/:playerName error:", err);
    return res.status(500).json({ error: "Failed to load rewards summary" });
  }
});

/* ========================================================================== */
/*  REWARDS: ACTIVE FOR CUSTOMER                                              */
/* ========================================================================== */

router.get("/rewards/active/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) return res.status(400).json({ error: "Invalid customerId" });

    const pool = await getPool();

    const r = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT TOP 1 *
        FROM dbo.GamingRewards
        WHERE customer_id=@cid
          AND is_used=0
          AND reward_type='FREE_3_HOURS'
        ORDER BY reward_id DESC;
      `);

    const reward = r.recordset?.[0] || null;

    return res.json({
      has_reward: !!reward,
      reward: reward || null,
      offer_code: reward ? "FREE_3H" : null,
    });
  } catch (err) {
    console.error("GET /api/gaming/rewards/active/:customerId error:", err);
    return res.status(500).json({ error: "Failed to load reward" });
  }
});

/* ========================================================================== */
/*  DEBUG ROUTES LIST                                                         */
/* ========================================================================== */

console.log("📋 FINAL - Registered gaming routes:");
router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods)
      .map((m) => m.toUpperCase())
      .join(", ");
    console.log(`  ${methods.padEnd(10)} ${layer.route.path}`);
  }
});

module.exports = router;
