const express = require("express");
const { sql, getDatabase } = require("../config/database");
const { sendMail } = require("./mailer");

const router = express.Router();

/* ============================= STRIPE ============================= */
const Stripe = require("stripe");
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/* ============================= PUSH (Expo) ============================= */
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Node 18+ has global fetch; fallback for older node
const fetchFn = global.fetch
  ? global.fetch
  : (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

function subtractMinutesHHMM(hhmm, minutesToSubtract = 15) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const total = h * 60 + m - minutesToSubtract;
  const fixed = (total + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(fixed / 60)).padStart(2, "0");
  const mm = String(fixed % 60).padStart(2, "0");
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
  const payload = { to: expoPushToken, sound: "default", title, body, data };

  const resp = await fetchFn(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await resp.json().catch(() => ({}));
  return { ok: resp.ok, json };
}

/* ============================= TIME HELPERS ============================= */
/**
 * Converts:
 * - "08:00 AM" => "08:00:00"
 * - "8:00 PM"  => "20:00:00"
 * - "08:00"    => "08:00:00"
 * - "08:00:00" => "08:00:00"
 */
function normalizeTimeToHHMMSS(t) {
  if (!t) return null;

  if (typeof t === "string") {
    const s = t.trim();

    // HH:MM:SS
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
      const [hh, mm, ss] = s.split(":").map(Number);
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    }

    // HH:MM
    if (/^\d{1,2}:\d{2}$/.test(s)) {
      const [hh, mm] = s.split(":").map(Number);
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
    }

    // "08:00 AM" / "8:00 PM"
    const up = s.toUpperCase();
    const m = up.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (m) {
      let hh = Number(m[1]);
      const mm = Number(m[2]);
      const ampm = m[3];

      if (ampm === "PM" && hh !== 12) hh += 12;
      if (ampm === "AM" && hh === 12) hh = 0;

      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
    }
  }

  if (t instanceof Date && !isNaN(t.getTime())) {
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}:00`;
  }

  return null;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = String(timeStr).split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/* ============================= CUSTOMER TIME CONFLICT HELPERS ============================= */
// Check if customer has ANY reservation during this time (including other sports)
async function hasCustomerTimeConflict(pool, customerId, date, startTime, endTime, excludeReservationId = null) {
  const startTimeSQL = normalizeTimeToHHMMSS(startTime);
  const endTimeSQL = normalizeTimeToHHMMSS(endTime);
  
  const query = `
    SELECT reservation_id
    FROM MatchReservations mr
    WHERE mr.customer_id = @customer_id
      AND mr.reservation_date = @date
      AND mr.status != 'Cancelled'
      AND (
        -- Time overlap check
        (mr.start_time < @end_time AND mr.end_time > @start_time)
      )
      ${excludeReservationId ? 'AND mr.reservation_id != @exclude_id' : ''}
  `;
  
  const conflictRes = await pool
    .request()
    .input("customer_id", sql.Int, customerId)
    .input("date", sql.Date, date)
    .input("start_time", sql.VarChar(8), startTimeSQL)
    .input("end_time", sql.VarChar(8), endTimeSQL)
    .input("exclude_id", sql.Int, excludeReservationId)
    .query(query);
    
  return conflictRes.recordset.length > 0;
}

// Check if customer has ANY activity (sports OR gaming) during this time
async function hasAnyActivityConflict(pool, customerId, date, startTime, endTime, excludeId = null, excludeType = null) {
  const startTimeSQL = normalizeTimeToHHMMSS(startTime);
  const endTimeSQL = normalizeTimeToHHMMSS(endTime);
  
  let conflictCount = 0;
  
  // Check sports reservations
  if (excludeType !== 'sports') {
    const sportsRes = await pool
      .request()
      .input("customer_id", sql.Int, customerId)
      .input("date", sql.Date, date)
      .input("start_time", sql.VarChar(8), startTimeSQL)
      .input("end_time", sql.VarChar(8), endTimeSQL)
      .query(`
        SELECT reservation_id
        FROM MatchReservations
        WHERE customer_id = @customer_id
          AND reservation_date = @date
          AND status != 'Cancelled'
          AND (start_time < @end_time AND end_time > @start_time)
          ${excludeId ? 'AND reservation_id != @exclude_id' : ''}
      `);
      
    conflictCount += sportsRes.recordset.length;
  }
  
  // Check gaming sessions (if customer has member_id in gaming)
  if (excludeType !== 'gaming') {
    const gamingRes = await pool
      .request()
      .input("customer_id", sql.Int, customerId)
      .input("date", sql.Date, date)
      .input("start_time", sql.VarChar(8), startTimeSQL)
      .input("end_time", sql.VarChar(8), endTimeSQL)
      .query(`
        SELECT session_id
        FROM GamingSessions
        WHERE member_id = @customer_id
          AND CONVERT(DATE, COALESCE(planned_start_time, start_time)) = @date
          AND status IN ('Active', 'Reserved')
          AND (
            (start_time IS NOT NULL AND start_time < @end_time AND end_time > @start_time)
            OR 
            (planned_start_time IS NOT NULL AND planned_end_time IS NOT NULL 
             AND planned_start_time < @end_time AND planned_end_time > @start_time)
          )
          ${excludeId ? 'AND session_id != @exclude_id' : ''}
      `);
      
    conflictCount += gamingRes.recordset.length;
  }
  
  return conflictCount > 0;
}

/* ============================= CUSTOMER HELPERS ============================= */
// Find customer by id (Customers.customer_id)
async function getCustomerById(pool, customerId) {
  const res = await pool
    .request()
    .input("cid", sql.Int, customerId)
    .query(`
      SELECT TOP 1 customer_id, name, email, phone
      FROM dbo.Customers
      WHERE customer_id = @cid
    `);

  return res.recordset?.[0] || null;
}

// Find customer by phone
async function getCustomerByPhone(pool, phone) {
  const res = await pool
    .request()
    .input("phone", sql.NVarChar(20), phone)
    .query(`
      SELECT TOP 1 customer_id, name, email, phone
      FROM dbo.Customers
      WHERE phone = @phone
    `);

  return res.recordset?.[0] || null;
}

// Create a customer safely
async function createCustomer(pool, { name, email, phone, password }) {
  const safeName = name || "Customer";
  const safeEmail = email && String(email).trim() ? String(email).trim() : `customer${Date.now()}@sportzone.local`;
  const safePhone = phone && String(phone).trim() ? String(phone).trim() : null;
  const safePassword = password || "temp_password_123";

  const insert = await pool
    .request()
    .input("name", sql.NVarChar(100), safeName)
    .input("email", sql.NVarChar(100), safeEmail)
    .input("phone", sql.NVarChar(20), safePhone)
    .input("password", sql.NVarChar(255), safePassword)
    .query(`
      INSERT INTO dbo.Customers (name, email, phone, password, created_at)
      OUTPUT INSERTED.customer_id
      VALUES (@name, @email, @phone, @password, GETDATE())
    `);

  return insert.recordset?.[0]?.customer_id || null;
}

/* ============================= BASIC DATA ============================= */

// GET all sports
router.get("/sports", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT sport_id, sport_name, created_at
      FROM Sports
      ORDER BY sport_name
    `);
    res.json({ sports: result.recordset });
  } catch (err) {
    console.error("Get sports error:", err);
    res.status(500).json({ error: "Failed to load sports" });
  }
});

// GET all stadiums with sport info
router.get("/stadiums", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT
        s.stadium_id,
        s.stadium_name,
        s.location,
        s.price_per_hour,
        s.sport_id,
        sp.sport_name,
        s.created_at
      FROM Stadiums s
      LEFT JOIN Sports sp ON s.sport_id = sp.sport_id
      ORDER BY sp.sport_name, s.stadium_name
    `);
    res.json({ stadiums: result.recordset });
  } catch (err) {
    console.error("Get stadiums error:", err);
    res.status(500).json({ error: "Failed to load stadiums" });
  }
});

// GET customers for dropdown
router.get("/customers", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT customer_id, name, email, phone
      FROM dbo.Customers
      WHERE is_system_generated = 0
      ORDER BY name
    `);
    res.json({ customers: result.recordset });
  } catch (err) {
    console.error("Get customers error:", err);
    res.status(500).json({ error: "Failed to load customers" });
  }
});

/* ============================= RESERVATIONS ============================= */
// CANCEL reservation
router.patch("/reservations/:id/cancel", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pool = await getDatabase();

    await pool.request().input("id", sql.Int, id).query(`
      UPDATE MatchReservations
      SET status = 'Cancelled'
      WHERE reservation_id = @id
    `);

    return res.json({ message: "Reservation cancelled successfully." });
  } catch (err) {
    console.error("cancel reservation error:", err);
    return res.status(500).json({ error: "Failed to cancel reservation." });
  }
});

// GET all reservations
router.get("/reservations", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT
        mr.reservation_id,
        mr.customer_id,
        c.name  AS customer_name,
        c.phone AS customer_phone,
        mr.stadium_id,
        s.stadium_name,
        s.location,
        sp.sport_id,
        sp.sport_name,
        CONVERT(VARCHAR(10), mr.reservation_date, 23) AS reservation_date,
        CONVERT(VARCHAR(5),  mr.start_time, 108)      AS start_time,
        CONVERT(VARCHAR(5),  mr.end_time,   108)      AS end_time,
        mr.total_price,
        mr.status,
        mr.created_at
      FROM MatchReservations mr
      LEFT JOIN dbo.Customers c ON mr.customer_id = c.customer_id
      LEFT JOIN Stadiums s ON mr.stadium_id = s.stadium_id
      LEFT JOIN Sports sp ON s.sport_id = sp.sport_id
      ORDER BY mr.reservation_date DESC, mr.start_time DESC
    `);

    res.json({ reservations: result.recordset });
  } catch (err) {
    console.error("Get reservations error:", err);
    res.status(500).json({ error: "Failed to load reservations" });
  }
});

// GET reservations by date
router.get("/reservations/date/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const pool = await getDatabase();

    const result = await pool.request().input("date", date).query(`
      SELECT
        mr.reservation_id,
        mr.customer_id,
        c.name  AS customer_name,
        c.phone AS customer_phone,
        mr.stadium_id,
        s.stadium_name,
        s.location,
        sp.sport_id,
        sp.sport_name,
        CONVERT(VARCHAR(10), mr.reservation_date, 23) AS reservation_date,
        CONVERT(VARCHAR(5),  mr.start_time, 108)      AS start_time,
        CONVERT(VARCHAR(5),  mr.end_time,   108)      AS end_time,
        mr.total_price,
        mr.status,
        mr.created_at
      FROM MatchReservations mr
      LEFT JOIN dbo.Customers c ON mr.customer_id = c.customer_id
      LEFT JOIN Stadiums s ON mr.stadium_id = s.stadium_id
      LEFT JOIN Sports sp ON s.sport_id = sp.sport_id
      WHERE mr.reservation_date = @date
      ORDER BY mr.start_time
    `);

    res.json({ reservations: result.recordset });
  } catch (err) {
    console.error("Get reservations by date error:", err);
    res.status(500).json({ error: "Failed to load reservations for date" });
  }
});

router.post("/reservations", async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      stadium_id,
      reservation_date,
      start_time,
      end_time,
      total_price,
    } = req.body;

    const pool = await getDatabase();

    // Stripe must be configured
    if (!stripe) {
      return res.status(500).json({
        error: "Stripe is not configured. Missing STRIPE_SECRET_KEY in .env",
      });
    }

    // Normalize time
    const startTimeSQL = normalizeTimeToHHMMSS(start_time);
    const endTimeSQL = normalizeTimeToHHMMSS(end_time);

    if (!startTimeSQL || !endTimeSQL) {
      return res.status(400).json({
        error: "Invalid time format. Use HH:MM, HH:MM:SS, or 08:00 AM / 08:00 PM.",
        received: { start_time, end_time },
      });
    }

    // Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const desired = new Date(reservation_date);
    desired.setHours(0, 0, 0, 0);
    if (desired < today) {
      return res.status(400).json({ error: "Cannot book in the past." });
    }

    // Resolve customer
    let finalCustomerId = null;

    if (customer_id) {
      const c = await getCustomerById(pool, customer_id);
      if (!c) {
        return res.status(400).json({
          error: "Selected customer_id not found in Customers table.",
        });
      }
      finalCustomerId = c.customer_id;
    } else if (customer_phone) {
      const existing = await getCustomerByPhone(pool, customer_phone);
      if (existing) {
        finalCustomerId = existing.customer_id;
      } else {
        const newId = await createCustomer(pool, {
          name: customer_name,
          email: customer_email,
          phone: customer_phone,
          password: "temp_password_123",
        });
        finalCustomerId = newId;
      }
    } else {
      return res.status(400).json({
        error: "customer_id (dropdown) or customer_phone is required.",
      });
    }

    // Stadium conflict check
    const conflictCheck = await pool
      .request()
      .input("stadium_id", sql.Int, stadium_id)
      .input("reservation_date", sql.Date, reservation_date)
      .input("start_time", sql.VarChar(8), startTimeSQL)
      .input("end_time", sql.VarChar(8), endTimeSQL)
      .query(`
        SELECT reservation_id
        FROM MatchReservations
        WHERE stadium_id = @stadium_id
          AND reservation_date = @reservation_date
          AND status != 'Cancelled'
          AND (start_time < @end_time AND end_time > @start_time)
      `);

    if (conflictCheck.recordset.length > 0) {
      return res.status(409).json({
        error: "Time slot conflict! Stadium already booked in this time.",
      });
    }

    // ✅ CUSTOMER TIME CONFLICT CHECK: Prevent customer from booking ANY sport during same time
    const customerTimeConflict = await hasCustomerTimeConflict(
      pool,
      finalCustomerId,
      reservation_date,
      startTimeSQL,
      endTimeSQL
    );

    if (customerTimeConflict) {
      return res.status(409).json({
        error: `Customer already has another reservation during ${startTimeSQL} - ${endTimeSQL}. Customers cannot book multiple activities at the same time.`,
      });
    }

    // ✅ CROSS-ACTIVITY CONFLICT CHECK: Prevent customer from having sports AND gaming at same time
    const anyActivityConflict = await hasAnyActivityConflict(
      pool,
      finalCustomerId,
      reservation_date,
      startTimeSQL,
      endTimeSQL
    );

    if (anyActivityConflict) {
      return res.status(409).json({
        error: `Customer already has a gaming session during ${startTimeSQL} - ${endTimeSQL}. Customers cannot have sports and gaming activities at the same time.`,
      });
    }

    // ✅ Compute finalTotalPrice on backend
    let finalTotalPrice = Number(total_price);

    if (!finalTotalPrice || finalTotalPrice <= 0) {
      const stRes = await pool
        .request()
        .input("stadium_id", sql.Int, stadium_id)
        .query(`
          SELECT TOP 1 price_per_hour
          FROM Stadiums
          WHERE stadium_id = @stadium_id
        `);

      const pricePerHour = Number(stRes.recordset?.[0]?.price_per_hour || 0);
      if (!pricePerHour) {
        return res.status(400).json({ error: "Invalid stadium price_per_hour" });
      }

      const toMinutes = (t) => {
        const [hh, mm] = String(t).split(":").map(Number);
        return (hh * 60) + (mm || 0);
      };

      const startMin = toMinutes(startTimeSQL);
      const endMin = toMinutes(endTimeSQL);

      let diffMin = endMin - startMin;
      if (diffMin <= 0) diffMin += 24 * 60;

      const hours = diffMin / 60;
      finalTotalPrice = Number((pricePerHour * hours).toFixed(2));
    }

    if (!finalTotalPrice || finalTotalPrice <= 0) {
      return res.status(400).json({ error: "Total price must be > 0" });
    }

    // Insert reservation as PENDING
    const insert = await pool
      .request()
      .input("customer_id", sql.Int, finalCustomerId)
      .input("stadium_id", sql.Int, stadium_id)
      .input("reservation_date", sql.Date, reservation_date)
      .input("start_time", sql.VarChar(8), startTimeSQL)
      .input("end_time", sql.VarChar(8), endTimeSQL)
      .input("total_price", sql.Decimal(10, 2), finalTotalPrice)
      .input("status", sql.NVarChar(20), "Pending")
      .query(`
        INSERT INTO MatchReservations
          (customer_id, stadium_id, reservation_date, start_time, end_time, total_price, status)
        OUTPUT INSERTED.reservation_id
        VALUES
          (@customer_id, @stadium_id, @reservation_date, @start_time, @end_time, @total_price, @status)
      `);

    const reservationId = insert.recordset[0].reservation_id;

    // Fetch created record
    const newReservation = await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .query(`
        SELECT
          mr.reservation_id,
          mr.customer_id,
          c.name  AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          mr.stadium_id,
          s.stadium_name,
          s.location,
          sp.sport_id,
          sp.sport_name,
          CONVERT(VARCHAR(10), mr.reservation_date, 23) AS reservation_date,
          CONVERT(VARCHAR(5),  mr.start_time, 108)      AS start_time,
          CONVERT(VARCHAR(5),  mr.end_time,   108)      AS end_time,
          mr.total_price,
          mr.status,
          mr.created_at
        FROM MatchReservations mr
        LEFT JOIN dbo.Customers c ON mr.customer_id = c.customer_id
        LEFT JOIN Stadiums s ON mr.stadium_id = s.stadium_id
        LEFT JOIN Sports sp ON s.sport_id = sp.sport_id
        WHERE mr.reservation_id = @reservation_id
      `);

    const reservation = newReservation.recordset[0];

    // ✅ Push: reservation created (web employee / web flow)
    try {
      const expoToken = await getCustomerPushToken(pool, finalCustomerId);
      if (expoToken) {
        await sendExpoPush(
          expoToken,
          "📌 Match Reserved",
          `A match was reserved for you on ${reservation.reservation_date} (${reservation.start_time}-${reservation.end_time}).`,
          { type: "sports_reservation_created", reservation_id: reservation.reservation_id }
        );
      }
    } catch (e) {
      console.log("Reservation created push error:", e);
    }

    /* ===================== STRIPE (FIXED ORDER) ===================== */

    // Stripe: create customer
    const customerRow = await getCustomerById(pool, finalCustomerId);

    const stripeCustomer = await stripe.customers.create({
      name: customerRow?.name || customer_name || "Customer",
      email: customerRow?.email || customer_email || undefined,
      phone: customerRow?.phone || customer_phone || undefined,
      metadata: {
        customer_id: String(finalCustomerId),
        reservation_id: String(reservation.reservation_id),
        service: "sports_match_reservation",
      },
    });

    // amount in cents (must be > 0)
    const amountCents = Math.round(Number(finalTotalPrice) * 100);
    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ error: "Stripe amount must be > 0" });
    }

    // ✅ 1) Create invoice FIRST
    const invoice = await stripe.invoices.create({
      customer: stripeCustomer.id,
      collection_method: "charge_automatically",
      auto_advance: true,
      metadata: {
        customer_id: String(finalCustomerId),
        reservation_id: String(reservation.reservation_id),
        service: "sports_match_reservation",
      },
    });

    // ✅ 2) Attach invoice item directly to THIS invoice
    await stripe.invoiceItems.create({
      customer: stripeCustomer.id,
      invoice: invoice.id, // ✅ IMPORTANT FIX
      amount: amountCents,
      currency: "usd",
      description: `Match reservation #${reservation.reservation_id} (${reservation.reservation_date} ${reservation.start_time}-${reservation.end_time})`,
    });

    // ✅ 3) Finalize invoice (now it will contain the item)
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Save payment record
    await pool
      .request()
      .input("reservation_id", sql.Int, reservation.reservation_id)
      .input("customer_id", sql.Int, finalCustomerId)
      .input("amount", sql.Decimal(10, 2), finalTotalPrice)
      .input("currency", sql.NVarChar(10), "usd")
      .input("stripe_invoice_id", sql.NVarChar(255), finalizedInvoice.id)
      .input("hosted_invoice_url", sql.NVarChar(500), finalizedInvoice.hosted_invoice_url)
      .input("invoice_pdf_url", sql.NVarChar(500), finalizedInvoice.invoice_pdf)
      .input("stripe_invoice_status", sql.NVarChar(50), finalizedInvoice.status)
      .input("status", sql.NVarChar(50), "Pending")
      .query(`
        INSERT INTO dbo.SportsReservationPayments
          (reservation_id, customer_id, amount, currency, stripe_invoice_id, hosted_invoice_url, invoice_pdf_url, stripe_invoice_status, status)
        VALUES
          (@reservation_id, @customer_id, @amount, @currency, @stripe_invoice_id, @hosted_invoice_url, @invoice_pdf_url, @stripe_invoice_status, @status)
      `);

    return res.status(201).json({
      message: "Reservation created (Pending payment).",
      reservation,
      payment: {
        stripe_invoice_id: finalizedInvoice.id,
        hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
        invoice_pdf_url: finalizedInvoice.invoice_pdf,
        stripe_invoice_status: finalizedInvoice.status,
      },
    });
  } catch (err) {
    console.error("Create reservation error:", err);
    return res.status(500).json({
      error: "Failed to create reservation",
      details: err.message,
    });
  }
});

// UPDATE reservation (full edit)
router.put("/reservations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      customer_id,
      customer_phone,
      customer_name,
      customer_email,
      stadium_id,
      reservation_date,
      start_time,
      end_time,
      total_price,
      status,
    } = req.body;

    const pool = await getDatabase();

    const existing = await pool
      .request()
      .input("reservation_id", sql.Int, id)
      .query("SELECT reservation_id, customer_id FROM MatchReservations WHERE reservation_id = @reservation_id");

    if (existing.recordset.length === 0) return res.status(404).json({ error: "Reservation not found" });

    // Block moving to past date
    if (reservation_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const desired = new Date(reservation_date);
      desired.setHours(0, 0, 0, 0);
      if (desired < today) return res.status(400).json({ error: "Cannot move a reservation to a past date." });
    }

    // Resolve customer_id (Customers)
    let finalCustomerId = existing.recordset[0].customer_id;

    if (customer_id) {
      const c = await getCustomerById(pool, customer_id);
      if (!c) return res.status(400).json({ error: "Selected customer_id not found in Customers." });
      finalCustomerId = c.customer_id;
    } else if (customer_phone) {
      const c = await getCustomerByPhone(pool, customer_phone);
      if (c) {
        finalCustomerId = c.customer_id;
      } else {
        const newId = await createCustomer(pool, {
          name: customer_name,
          email: customer_email,
          phone: customer_phone,
          password: "temp_password_123",
        });
        finalCustomerId = newId;
      }
    }

    const startTimeSQL = start_time ? normalizeTimeToHHMMSS(start_time) : null;
    const endTimeSQL = end_time ? normalizeTimeToHHMMSS(end_time) : null;

    if (start_time && !startTimeSQL) return res.status(400).json({ error: "Invalid start_time format." });
    if (end_time && !endTimeSQL) return res.status(400).json({ error: "Invalid end_time format." });

    // Conflict check if all provided
    if (stadium_id && reservation_date && startTimeSQL && endTimeSQL) {
      // Stadium conflict check
      const conflict = await pool
        .request()
        .input("reservation_id", sql.Int, id)
        .input("stadium_id", sql.Int, stadium_id)
        .input("reservation_date", sql.Date, reservation_date)
        .input("start_time", sql.VarChar(8), startTimeSQL)
        .input("end_time", sql.VarChar(8), endTimeSQL)
        .query(`
          SELECT 1
          FROM MatchReservations
          WHERE reservation_id <> @reservation_id
            AND stadium_id = @stadium_id
            AND reservation_date = @reservation_date
            AND status <> 'Cancelled'
            AND (start_time < @end_time AND end_time > @start_time)
        `);

      if (conflict.recordset.length > 0) return res.status(409).json({ error: "Time slot conflict for updated values." });

      // ✅ CUSTOMER TIME CONFLICT CHECK (excluding current reservation)
      const customerTimeConflict = await hasCustomerTimeConflict(
        pool,
        finalCustomerId,
        reservation_date,
        startTimeSQL,
        endTimeSQL,
        id  // exclude current reservation
      );

      if (customerTimeConflict) {
        return res.status(409).json({
          error: `Customer already has another reservation during ${startTimeSQL} - ${endTimeSQL}.`,
        });
      }

      // ✅ CROSS-ACTIVITY CONFLICT CHECK (excluding current reservation)
      const anyActivityConflict = await hasAnyActivityConflict(
        pool,
        finalCustomerId,
        reservation_date,
        startTimeSQL,
        endTimeSQL,
        id,
        'sports'
      );

      if (anyActivityConflict) {
        return res.status(409).json({
          error: `Customer already has a gaming session during ${startTimeSQL} - ${endTimeSQL}.`,
        });
      }
    }

    // Dynamic update
    const sets = [];
    const reqq = pool.request().input("reservation_id", sql.Int, id);

    if (finalCustomerId) {
      sets.push("customer_id = @customer_id");
      reqq.input("customer_id", sql.Int, finalCustomerId);
    }
    if (stadium_id) {
      sets.push("stadium_id = @stadium_id");
      reqq.input("stadium_id", sql.Int, stadium_id);
    }
    if (reservation_date) {
      sets.push("reservation_date = @reservation_date");
      reqq.input("reservation_date", sql.Date, reservation_date);
    }
    if (startTimeSQL) {
      sets.push("start_time = @start_time");
      reqq.input("start_time", sql.VarChar(8), startTimeSQL);
    }
    if (endTimeSQL) {
      sets.push("end_time = @end_time");
      reqq.input("end_time", sql.VarChar(8), endTimeSQL);
    }
    if (typeof total_price !== "undefined") {
      sets.push("total_price = @total_price");
      reqq.input("total_price", sql.Decimal(10, 2), total_price);
    }
    if (status) {
      sets.push("status = @status");
      reqq.input("status", sql.NVarChar(20), status);
    }

    if (sets.length === 0) return res.status(400).json({ error: "No updatable fields were provided." });

    await reqq.query(`
      UPDATE MatchReservations
      SET ${sets.join(", ")}
      WHERE reservation_id = @reservation_id
    `);

    const updated = await pool
      .request()
      .input("reservation_id", sql.Int, id)
      .query(`
        SELECT
          mr.reservation_id,
          mr.customer_id,
          c.name  AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          mr.stadium_id,
          s.stadium_name,
          s.location,
          sp.sport_id,
          sp.sport_name,
          CONVERT(VARCHAR(10), mr.reservation_date, 23) AS reservation_date,
          CONVERT(VARCHAR(5),  mr.start_time, 108)      AS start_time,
          CONVERT(VARCHAR(5),  mr.end_time,   108)      AS end_time,
          mr.total_price,
          mr.status,
          mr.created_at
        FROM MatchReservations mr
        LEFT JOIN dbo.Customers c ON mr.customer_id = c.customer_id
        LEFT JOIN Stadiums s ON mr.stadium_id = s.stadium_id
        LEFT JOIN Sports sp ON s.sport_id = sp.sport_id
        WHERE mr.reservation_id = @reservation_id
      `);

    res.json({ message: "Reservation updated successfully", reservation: updated.recordset[0] });
  } catch (err) {
    console.error("Update reservation error:", err);
    res.status(500).json({ error: "Failed to update reservation" });
  }
});

// UPDATE reservation status
router.put("/reservations/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const validStatuses = ["Confirmed", "Cancelled", "Completed", "Pending"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be: Confirmed, Cancelled, Completed, or Pending" });
    }

    const pool = await getDatabase();
    const exists = await pool
      .request()
      .input("reservation_id", sql.Int, id)
      .query("SELECT reservation_id FROM MatchReservations WHERE reservation_id = @reservation_id");

    if (exists.recordset.length === 0) return res.status(404).json({ error: "Reservation not found" });

    await pool
      .request()
      .input("reservation_id", sql.Int, id)
      .input("status", sql.NVarChar(20), status)
      .query("UPDATE MatchReservations SET status = @status WHERE reservation_id = @reservation_id");

    res.json({ message: "Reservation status updated", reservation_id: id, new_status: status });
  } catch (err) {
    console.error("Update reservation status error:", err);
    res.status(500).json({ error: "Failed to update reservation status" });
  }
});

// ✅ DELETE reservation (also deletes payment row first to avoid FK error)
router.delete("/reservations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "Invalid reservation id" });

  const pool = await getDatabase();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // Ensure reservation exists
    const exists = await new sql.Request(tx)
      .input("reservation_id", sql.Int, id)
      .query(`SELECT reservation_id FROM MatchReservations WHERE reservation_id = @reservation_id`);

    if (exists.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ error: "Reservation not found" });
    }

    // 1) delete payments first (child)
    await new sql.Request(tx)
      .input("reservation_id", sql.Int, id)
      .query(`DELETE FROM dbo.SportsReservationPayments WHERE reservation_id = @reservation_id`);

    // 2) delete reservation (parent)
    await new sql.Request(tx)
      .input("reservation_id", sql.Int, id)
      .query(`DELETE FROM MatchReservations WHERE reservation_id = @reservation_id`);

    await tx.commit();
    return res.json({ message: "Reservation deleted successfully", reservation_id: id });
  } catch (err) {
    try { await tx.rollback(); } catch (_) {}
    console.error("❌ Delete reservation error:", err);
    return res.status(500).json({ error: "Failed to delete reservation", details: err.message });
  }
});

// ✅ MARK CASH PAYMENT (admin / web)
router.post("/reservations/:id/pay-cash", async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10);
    if (!reservationId) return res.status(400).json({ error: "Invalid reservation id" });

    const pool = await getDatabase();

    // Get reservation + customer + amount
    const rres = await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .query(`
        SELECT TOP 1
          mr.reservation_id,
          mr.customer_id,
          mr.total_price,
          mr.status
        FROM MatchReservations mr
        WHERE mr.reservation_id = @reservation_id
      `);

    const rr = rres.recordset?.[0];
    if (!rr) return res.status(404).json({ error: "Reservation not found" });

    // Upsert payment row as CASH PAID
    await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .input("customer_id", sql.Int, rr.customer_id)
      .input("amount", sql.Decimal(10, 2), rr.total_price)
      .input("currency", sql.NVarChar(10), "usd")
      .input("stripe_invoice_status", sql.NVarChar(50), "cash")
      .input("status", sql.NVarChar(50), "Paid")
      .query(`
        IF EXISTS (SELECT 1 FROM dbo.SportsReservationPayments WHERE reservation_id = @reservation_id)
        BEGIN
          UPDATE dbo.SportsReservationPayments
          SET
            amount = @amount,
            currency = @currency,
            stripe_invoice_status = @stripe_invoice_status,
            status = @status,
            paid_at = SYSUTCDATETIME()
          WHERE reservation_id = @reservation_id
        END
        ELSE
        BEGIN
          INSERT INTO dbo.SportsReservationPayments
            (reservation_id, customer_id, amount, currency, stripe_invoice_status, status, paid_at)
          VALUES
            (@reservation_id, @customer_id, @amount, @currency, @stripe_invoice_status, @status, SYSUTCDATETIME())
        END
      `);

    // Confirm reservation
    await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .query(`
        UPDATE MatchReservations
        SET status = 'Confirmed'
        WHERE reservation_id = @reservation_id
      `);

    // ✅ Send push + email for CASH confirmation (web employee)
    try {
      const customer = await getCustomerById(pool, rr.customer_id);
      const expoToken = await getCustomerPushToken(pool, rr.customer_id);

      if (expoToken) {
        await sendExpoPush(
          expoToken,
          "✅ Reservation Confirmed (Cash)",
          `Your match is reserved for you. Cash payment received: $${rr.total_price}`,
          {
            type: "sports_reservation_cash_paid",
            reservation_id: rr.reservation_id,
            payment_method: "cash",
          }
        );
      }

      if (customer?.email) {
        await sendMail(
          customer.email,
          "✅ Reservation Confirmed (Cash)",
          `
            <h3>Reservation Confirmed</h3>
            <p>Hello ${customer.name || "Customer"},</p>
            <p>Your match reservation is confirmed.</p>
            <p><b>Payment:</b> Cash</p>
            <p><b>Total:</b> $${rr.total_price}</p>
            <p><b>Reservation ID:</b> ${rr.reservation_id}</p>
          `
        );
      }
    } catch (e) {
      console.log("Cash confirm notify error:", e);
    }

    // ✅ Fetch updated reservation (to update UI)
    const updatedRes = await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .query(`
        SELECT TOP 1 *
        FROM MatchReservations
        WHERE reservation_id = @reservation_id
      `);

    // ✅ Fetch invoice pdf url if exists (Stripe invoice pdf)
    const payRes = await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .query(`
        SELECT TOP 1 invoice_pdf_url
        FROM dbo.SportsReservationPayments
        WHERE reservation_id = @reservation_id
        ORDER BY paid_at DESC
      `);

    return res.json({
      message: "Cash payment recorded. Reservation confirmed.",
      reservation: updatedRes.recordset?.[0] || null,
      invoice_pdf_url: payRes.recordset?.[0]?.invoice_pdf_url || null,
      payment_method: "cash",
      status: "Paid",
    });
  } catch (err) {
    console.error("❌ pay-cash error:", err);
    return res.status(500).json({ error: "Failed to mark cash payment", details: err.message });
  }
});

// GET reservation by ID
router.get("/reservations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pool = await getDatabase();

    const result = await pool
      .request()
      .input("reservation_id", sql.Int, id)
      .query(`
        SELECT
          mr.reservation_id,
          mr.customer_id,
          c.name  AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          mr.stadium_id,
          s.stadium_name,
          s.location,
          sp.sport_id,
          sp.sport_name,
          CONVERT(VARCHAR(10), mr.reservation_date, 23) AS reservation_date,
          CONVERT(VARCHAR(5),  mr.start_time, 108)      AS start_time,
          CONVERT(VARCHAR(5),  mr.end_time,   108)      AS end_time,
          mr.total_price,
          mr.status,
          mr.created_at
        FROM MatchReservations mr
        LEFT JOIN dbo.Customers c ON mr.customer_id = c.customer_id
        LEFT JOIN Stadiums s ON mr.stadium_id = s.stadium_id
        LEFT JOIN Sports sp ON s.sport_id = sp.sport_id
        WHERE mr.reservation_id = @reservation_id
      `);

    if (result.recordset.length === 0) return res.status(404).json({ error: "Reservation not found" });

    res.json({ reservation: result.recordset[0] });
  } catch (err) {
    console.error("Get reservation by ID error:", err);
    res.status(500).json({ error: "Failed to load reservation" });
  }
});

/* ============================= AVAILABILITY ============================= */
router.get("/availability/:stadium_id/:date", async (req, res) => {
  try {
    const { stadium_id, date } = req.params;
    const pool = await getDatabase();

    const reservations = await pool
      .request()
      .input("stadium_id", sql.Int, stadium_id)
      .input("date", sql.Date, date)
      .query(`
        SELECT
          CONVERT(VARCHAR(5), start_time, 108) AS start_time,
          CONVERT(VARCHAR(5), end_time, 108)   AS end_time
        FROM MatchReservations
        WHERE stadium_id = @stadium_id
          AND reservation_date = @date
          AND status != 'Cancelled'
        ORDER BY start_time
      `);

    const allSlots = [];
    for (let hour = 8; hour <= 22; hour++) {
      allSlots.push({
        start_time: `${hour.toString().padStart(2, "0")}:00`,
        end_time: `${(hour + 1).toString().padStart(2, "0")}:00`,
        available: true,
      });
    }

    const availableSlots = allSlots.map((slot) => {
      const isAvailable = !reservations.recordset.some((r) => {
        const slotStart = timeToMinutes(slot.start_time);
        const slotEnd = timeToMinutes(slot.end_time);
        const resStart = timeToMinutes(r.start_time);
        const resEnd = timeToMinutes(r.end_time);
        return slotStart < resEnd && slotEnd > resStart;
      });
      return { ...slot, available: isAvailable };
    });

    res.json({
      stadium_id: parseInt(stadium_id, 10),
      date,
      availableSlots,
      totalSlots: allSlots.length,
      availableCount: availableSlots.filter((s) => s.available).length,
    });
  } catch (err) {
    console.error("Get availability error:", err);
    res.status(500).json({ error: "Failed to get availability" });
  }
});

/* ============================= HISTORY ============================= */
router.get("/reservations/history", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT
        CONVERT(VARCHAR(10), mr.reservation_date, 23) AS reservation_date,
        CONVERT(VARCHAR(5),  mr.start_time, 108)      AS start_time,
        CONVERT(VARCHAR(5),  mr.end_time,   108)      AS end_time,
        mr.status,
        sp.sport_name,
        s.stadium_name
      FROM MatchReservations mr
      LEFT JOIN Stadiums s ON mr.stadium_id = s.stadium_id
      LEFT JOIN Sports sp ON s.sport_id = sp.sport_id
      ORDER BY mr.reservation_date DESC, mr.start_time DESC
    `);

    res.json({ history: result.recordset });
  } catch (err) {
    console.error("history error", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

/* ============================= PAYMENT STATUS ============================= */
// CHECK PAYMENT STATUS and confirm if paid
router.get("/reservations/:id/payment-status", async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10);
    if (!reservationId) return res.status(400).json({ error: "Invalid reservation id" });

    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured. Missing STRIPE_SECRET_KEY in .env" });
    }

    const pool = await getDatabase();

    const paymentRowRes = await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .query(`
        SELECT TOP 1 *
        FROM dbo.SportsReservationPayments
        WHERE reservation_id = @reservation_id
      `);

    const paymentRow = paymentRowRes.recordset[0];
    if (!paymentRow) return res.status(404).json({ error: "Payment record not found for this reservation" });
    if (!paymentRow.stripe_invoice_id) return res.status(400).json({ error: "stripe_invoice_id missing for this reservation payment" });

    const invoice = await stripe.invoices.retrieve(paymentRow.stripe_invoice_id);

    // Update payment record
    await pool
      .request()
      .input("reservation_id", sql.Int, reservationId)
      .input("stripe_invoice_status", sql.NVarChar(50), invoice.status)
      .input("status", sql.NVarChar(50), invoice.status === "paid" ? "Paid" : "Pending")
      .query(`
        UPDATE dbo.SportsReservationPayments
        SET stripe_invoice_status = @stripe_invoice_status,
            status = @status,
            paid_at = CASE WHEN @status = 'Paid' THEN SYSUTCDATETIME() ELSE paid_at END
        WHERE reservation_id = @reservation_id
      `);

    // If paid -> confirm reservation (only if not already confirmed)
    if (invoice.status === "paid") {
      await pool
        .request()
        .input("reservation_id", sql.Int, reservationId)
        .query(`
          UPDATE MatchReservations
          SET status = 'Confirmed'
          WHERE reservation_id = @reservation_id AND status <> 'Confirmed'
        `);

      // Optional: send "Confirmed" push/email here (recommended)
      const resRow = await pool
        .request()
        .input("reservation_id", sql.Int, reservationId)
        .query(`
          SELECT TOP 1
            mr.reservation_id,
            mr.customer_id,
            c.name AS customer_name,
            c.email AS customer_email,
            CONVERT(VARCHAR(10), mr.reservation_date, 23) AS reservation_date,
            CONVERT(VARCHAR(5), mr.start_time, 108) AS start_time,
            CONVERT(VARCHAR(5), mr.end_time, 108) AS end_time,
            mr.total_price
          FROM MatchReservations mr
          LEFT JOIN dbo.Customers c ON mr.customer_id = c.customer_id
          WHERE mr.reservation_id = @reservation_id
        `);

      const rr = resRow.recordset?.[0];
      if (rr) {
        // Push confirmed
        try {
          const expoToken = await getCustomerPushToken(pool, rr.customer_id);
          if (expoToken) {
            const arriveAt = subtractMinutesHHMM(rr.start_time, 15);
            await sendExpoPush(
              expoToken,
              "✅ Reservation Confirmed",
              `Payment received. Your match is confirmed at ${rr.start_time}. Please arrive around ${arriveAt}.`,
              { type: "sports_reservation_confirmed", reservation_id: rr.reservation_id }
            );
          }
        } catch (e) {
          console.log("Confirm push error:", e);
        }

        // Email confirmed
        try {
          if (rr.customer_email) {
            await sendMail(
              rr.customer_email,
              "✅ Sports Reservation Confirmed",
              `
                <h3>Reservation Confirmed</h3>
                <p>Hello ${rr.customer_name || "Customer"},</p>
                <p>Your payment was received and your reservation is now <b>Confirmed</b>.</p>
                <p><b>Date:</b> ${rr.reservation_date}</p>
                <p><b>Time:</b> ${rr.start_time} - ${rr.end_time}</p>
                <p><b>Total:</b> $${rr.total_price}</p>
                <p>You can download the invoice PDF from Stripe:</p>
                <p><a href='${invoice.hosted_invoice_url}'>Open hosted invoice</a></p>
              `
            );
          }
        } catch (e) {
          console.log("Confirm mail error:", e);
        }
      }
    }

    return res.json({
      reservation_id: reservationId,
      stripe_invoice_status: invoice.status,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf_url: invoice.invoice_pdf,
      is_paid: invoice.status === "paid",
    });
  } catch (err) {
    console.error("payment-status error:", err);
    res.status(500).json({ error: "Failed to check payment status", details: err.message });
  }
});

// GET /api/sports/reservations/customer/:customerId
router.get("/reservations/customer/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const pool = await getDatabase();

    const r = await pool.request()
      .input("customer_id", sql.Int, customerId)
      .query(`
        SELECT
          mr.reservation_id,
          mr.stadium_id,
          mr.reservation_date,
          mr.start_time,
          mr.end_time,
          mr.status,
          mr.total_price,
          CASE 
            WHEN sp.status = 'Paid' OR sp.stripe_invoice_status = 'paid' OR sp.stripe_invoice_status = 'cash' 
            THEN 1 
            ELSE 0 
          END as is_paid,
          sp2.sport_name as sport_type
        FROM MatchReservations mr
        LEFT JOIN dbo.SportsReservationPayments sp
          ON sp.reservation_id = mr.reservation_id
        LEFT JOIN Stadiums s
          ON s.stadium_id = mr.stadium_id
        LEFT JOIN Sports sp2
          ON s.sport_id = sp2.sport_id
        WHERE mr.customer_id = @customer_id
          AND mr.status <> 'Cancelled'
        ORDER BY mr.reservation_date, mr.start_time
      `);

    console.log(`Found ${r.recordset?.length || 0} reservations for customer ${customerId}`);
    res.json({ reservations: r.recordset || [] });
  } catch (err) {
    console.error("reservations by customer error:", err);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

module.exports = router;