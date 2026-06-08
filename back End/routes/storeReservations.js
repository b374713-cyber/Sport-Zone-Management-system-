const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const { sql, getDatabase } = require("../config/database");

// ------------------ helpers ------------------
const normalizeStatusSql = (col) => `UPPER(LTRIM(RTRIM(${col})))`;

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const fetchFn = global.fetch
  ? global.fetch
  : (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const addHours = (date, hrs) => new Date(date.getTime() + hrs * 60 * 60 * 1000);
const addMinutes = (date, mins) => new Date(date.getTime() + mins * 60 * 1000);

function generateReserveCode() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `SZ-${num}`;
}

function generatePickupCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function getCustomerPushToken(pool, customerId) {
  const tokRes = await pool
    .request()
    .input("cid", sql.Int, customerId)
    .query(`
      SELECT TOP 1 expo_push_token
      FROM dbo.GymPushTokens
      WHERE customer_id=@cid
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

// Get reservation owner customer_id
async function getReservationOwnerCustomerId(pool, reservationId) {
  const r = await pool
    .request()
    .input("rid", sql.Int, Number(reservationId))
    .query(`
      SELECT TOP 1 customer_id, reservation_code
      FROM dbo.StoreReservations
      WHERE reservation_id=@rid
    `);

  return {
    customer_id: r.recordset?.[0]?.customer_id || null,
    reservation_code: r.recordset?.[0]?.reservation_code || null,
  };
}

async function pushToReservationOwner(pool, reservationId, title, body, data = {}) {
  const { customer_id } = await getReservationOwnerCustomerId(pool, reservationId);
  if (!customer_id) return;

  const tok = await getCustomerPushToken(pool, Number(customer_id));
  if (!tok) return;

  await sendExpoPush(tok, title, body, data);
}

// -------------------------------------
// Expire reservations and restore stock
// -------------------------------------
async function expireAndRestore(pool) {
  const expiredRes = await pool.request().query(`
    SELECT reservation_id
    FROM dbo.StoreReservations
    WHERE ${normalizeStatusSql("status")} = 'RESERVED'
      AND expires_at <= GETDATE()
  `);

  const expiredIds = (expiredRes.recordset || []).map((r) => r.reservation_id);
  if (expiredIds.length === 0) return;

  const idsCsv = expiredIds.join(",");

  const itemsRes = await pool.request().query(`
    SELECT product_id, SUM(quantity) AS qty
    FROM dbo.StoreReservationItems
    WHERE reservation_id IN (${idsCsv})
    GROUP BY product_id
  `);

  for (const it of itemsRes.recordset || []) {
    await pool
      .request()
      .input("pid", sql.Int, it.product_id)
      .input("qty", sql.Int, it.qty)
      .query(`
        UPDATE dbo.Products
        SET stock_qty = stock_qty + @qty
        WHERE product_id = @pid
      `);
  }

  await pool.request().query(`
    UPDATE dbo.StoreReservations
    SET status = 'Expired'
    WHERE reservation_id IN (${idsCsv})
  `);
}

// -------------------------------------
// POST /api/store/reservations/reserve
// Body: { customer_id, items: [{product_id, quantity}], fee_amount? }
// -------------------------------------
async function handleReserve(req, res) {
  try {
    const pool = await getDatabase();

    // ✅ Accept both customer_id (new) and user_id (old) for compatibility
    let customer_id = Number(req.body?.customer_id || req.body?.user_id);
    const items = req.body?.items;
    const fee_amount = req.body?.fee_amount;

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid reservation payload." });
    }

    await expireAndRestore(pool);

    // validate stock
    for (const it of items) {
      if (!it?.product_id || !it?.quantity || it.quantity <= 0) {
        return res.status(400).json({ message: "Invalid item payload." });
      }

      const check = await pool
        .request()
        .input("pid", sql.Int, it.product_id)
        .query(`SELECT stock_qty, price, name FROM dbo.Products WHERE product_id = @pid`);

      const row = check.recordset?.[0];
      if (!row) return res.status(404).json({ message: "Product not found." });

      if (Number(row.stock_qty) < Number(it.quantity)) {
        return res.status(400).json({
          message: `Not enough stock for ${row.name}. Available: ${row.stock_qty}`,
        });
      }
    }

    const reservedAt = new Date();
    const expiresAt = addHours(reservedAt, 48);
    const code = generateReserveCode();

    let base = 0;
    for (const it of items) {
      const pRes = await pool
        .request()
        .input("pid", sql.Int, it.product_id)
        .query(`SELECT price FROM dbo.Products WHERE product_id = @pid`);
      const unit = Number(pRes.recordset?.[0]?.price || 0);
      base += unit * Number(it.quantity);
    }

    const fee = Number(fee_amount || 0);
    const final = base + fee;

    const insertRes = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("code", sql.NVarChar(50), code)
      .input("status", sql.NVarChar(30), "Reserved")
      .input("reserved_at", sql.DateTime, reservedAt)
      .input("expires_at", sql.DateTime, expiresAt)
      .input("fee_amount", sql.Decimal(10, 2), fee)
      .input("base_price", sql.Decimal(10, 2), base)
      .input("final_price", sql.Decimal(10, 2), final)
      .query(`
        INSERT INTO dbo.StoreReservations
          (customer_id, reservation_code, status, reserved_at, expires_at, fee_amount, base_price, final_price)
        OUTPUT INSERTED.reservation_id
        VALUES
          (@customer_id, @code, @status, @reserved_at, @expires_at, @fee_amount, @base_price, @final_price)
      `);

    const reservationId = insertRes.recordset?.[0]?.reservation_id;
    if (!reservationId) return res.status(500).json({ message: "Failed to create reservation." });

    for (const it of items) {
      const pRes = await pool
        .request()
        .input("pid", sql.Int, it.product_id)
        .query(`SELECT price FROM dbo.Products WHERE product_id = @pid`);
      const unit = Number(pRes.recordset?.[0]?.price || 0);

      await pool
        .request()
        .input("rid", sql.Int, reservationId)
        .input("pid", sql.Int, it.product_id)
        .input("qty", sql.Int, it.quantity)
        .input("unit", sql.Decimal(10, 2), unit)
        .query(`
          INSERT INTO dbo.StoreReservationItems
            (reservation_id, product_id, quantity, unit_price)
          VALUES
            (@rid, @pid, @qty, @unit)
        `);

      await pool
        .request()
        .input("pid", sql.Int, it.product_id)
        .input("qty", sql.Int, it.quantity)
        .query(`
          UPDATE dbo.Products
          SET stock_qty = stock_qty - @qty
          WHERE product_id = @pid
        `);
    }

    try {
      await pushToReservationOwner(
        pool,
        reservationId,
        "🛍️ Reserved Successfully",
        `Reservation ${code} created. Please pay online or cash within 48 hours.`,
        { type: "store_reserved", reservation_id: reservationId, reservation_code: code }
      );
    } catch (e) {
      console.log("reserve push error:", e);
    }

    return res.json({
      reservation_id: reservationId,
      reservation_code: code,
      customer_id,
      reserved_at: reservedAt,
      expires_at: expiresAt,
      status: "Reserved",
      fee_amount: fee,
      base_price: base,
      final_price: final,
    });
  } catch (err) {
    console.error("reserve reservation error:", err);
    return res.status(500).json({ message: "Server error reserving items." });
  }
}

router.post("/reservations/reserve", handleReserve);
router.post("/reserve", handleReserve);

// -------------------------------------
// GET /api/store/my-reservations/:customerId
// ✅ Uses customer_id directly
// -------------------------------------
router.get("/my-reservations/:customerId", async (req, res) => {
  try {
    const pool = await getDatabase();
    const customerId = Number(req.params.customerId);

    if (!customerId) return res.status(400).json({ message: "Invalid customerId" });

    await expireAndRestore(pool);

    const rRes = await pool
      .request()
      .input("customer_id", sql.Int, customerId)
      .query(`
        SELECT
          sr.reservation_id,
          sr.customer_id,
          sr.reservation_code,
          sr.status,
          sr.reserved_at,
          sr.expires_at,
          sr.fee_amount,
          sr.base_price AS total_base_price,
          sr.final_price AS total_final_price,
          DATEDIFF(SECOND, GETDATE(), sr.expires_at) AS remaining_seconds,

          rr.status AS receive_request_status,
          rr.expires_at AS receive_request_expires_at,

          pay.is_paid AS payment_is_paid,
          pay.stripe_status AS payment_stripe_status,
          pay.hosted_invoice_url AS payment_hosted_invoice_url,
          pay.invoice_pdf_url AS payment_invoice_pdf_url,
          pay.amount AS payment_amount,
          pay.currency AS payment_currency

        FROM dbo.StoreReservations sr

        OUTER APPLY (
          SELECT TOP 1 status, expires_at
          FROM dbo.StoreReceiveRequests
          WHERE reservation_id = sr.reservation_id
          ORDER BY created_at DESC
        ) rr

        OUTER APPLY (
          SELECT TOP 1
            p.is_paid,
            p.stripe_status,
            p.hosted_invoice_url,
            p.invoice_pdf_url,
            p.amount,
            p.currency
          FROM dbo.StoreReservationPayments p
          WHERE p.reservation_id = sr.reservation_id
          ORDER BY p.payment_id DESC
        ) pay

        WHERE sr.customer_id = @customer_id
          AND ${normalizeStatusSql("sr.status")} IN ('RESERVED','RECEIVED')
        ORDER BY sr.reserved_at DESC
      `);

    const reservations = rRes.recordset || [];
    if (reservations.length === 0) return res.json({ reservations: [] });

    const ids = reservations.map((x) => x.reservation_id).join(",");

    const itemsRes = await pool.request().query(`
      SELECT
        ri.reservation_id,
        ri.product_id,
        ri.quantity,
        ri.unit_price,
        p.name,
        p.category,
        p.image_url
      FROM dbo.StoreReservationItems ri
      JOIN dbo.Products p ON p.product_id = ri.product_id
      WHERE ri.reservation_id IN (${ids})
      ORDER BY ri.created_at ASC
    `);

    const map = {};
    for (const rr of reservations) map[rr.reservation_id] = { ...rr, items: [] };
    for (const it of itemsRes.recordset || []) {
      if (map[it.reservation_id]) map[it.reservation_id].items.push(it);
    }

    return res.json({ reservations: Object.values(map) });
  } catch (err) {
    console.error("my reservations error:", err);
    return res.status(500).json({ message: "Server error fetching my reservations." });
  }
});

router.post("/payments/create-invoice", async (req, res) => {
  try {
    const pool = await getDatabase();
    const { reservation_id, customer_id } = req.body || {};

    if (!reservation_id) {
      return res.status(400).json({ error: "reservation_id is required" });
    }

    // 1) Get reservation
    const rRes = await pool
      .request()
      .input("rid", sql.Int, Number(reservation_id))
      .query(`
        SELECT TOP 1
          reservation_id, customer_id, status, final_price, fee_amount
        FROM dbo.StoreReservations
        WHERE reservation_id=@rid
      `);

    const rr = rRes.recordset?.[0];
    if (!rr) return res.status(404).json({ error: "Reservation not found" });

    const payerId = Number(customer_id || rr.customer_id);
    if (!payerId) return res.status(400).json({ error: "customer_id is required" });

    // 2) Reuse existing invoice if last one is still draft/open & unpaid
    const lastPayRes = await pool
      .request()
      .input("rid", sql.Int, Number(reservation_id))
      .query(`
        SELECT TOP 1 *
        FROM dbo.StoreReservationPayments
        WHERE reservation_id=@rid
        ORDER BY payment_id DESC
      `);

    const last = lastPayRes.recordset?.[0];
    if (
      last &&
      !last.is_paid &&
      (last.stripe_status === "draft" || last.stripe_status === "open")
    ) {
      return res.json({
        reservation_id: Number(reservation_id),
        amount: Number(last.amount),
        currency: last.currency,
        stripe_status: last.stripe_status,
        hosted_invoice_url: last.hosted_invoice_url,
        invoice_pdf_url: last.invoice_pdf_url,
        is_paid: !!last.is_paid,
      });
    }

    // 3) Load reservation items (so invoice is NEVER 0 and shows real line items)
    const itemsRes = await pool
      .request()
      .input("rid", sql.Int, Number(reservation_id))
      .query(`
        SELECT
          ri.product_id,
          ri.quantity,
          ri.unit_price,
          p.name
        FROM dbo.StoreReservationItems ri
        JOIN dbo.Products p ON p.product_id = ri.product_id
        WHERE ri.reservation_id=@rid
        ORDER BY ri.created_at ASC
      `);

    const items = itemsRes.recordset || [];

    // 4) Compute total on backend (prevents amount = 0)
    let baseTotal = 0;
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const unit = Number(it.unit_price || 0);
      if (qty > 0 && unit > 0) baseTotal += qty * unit;
    }

    const fee = Number(rr.fee_amount || 0);

    // Prefer computed items total; fallback to rr.final_price if needed
    let amount = Number((baseTotal + fee).toFixed(2));
    if (!amount || amount <= 0) {
      const fallback = Number(rr.final_price || 0);
      amount = Number((fallback > 0 ? fallback : 0).toFixed(2));
    }

    const amountCents = Math.round(amount * 100);
    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ error: "Invalid reservation amount" });
    }

    // 5) Get customer email (needed for Stripe customer)
    const cRes = await pool
      .request()
      .input("cid", sql.Int, payerId)
      .query(`SELECT TOP 1 email, name FROM dbo.Customers WHERE customer_id=@cid`);

    const email = cRes.recordset?.[0]?.email;
    const name = cRes.recordset?.[0]?.name || "Customer";
    if (!email) {
      return res
        .status(400)
        .json({ error: "Customer email not found (needed for Stripe)" });
    }

    // 6) Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      name,
      metadata: {
        customer_id: String(payerId),
        reservation_id: String(reservation_id),
      },
    });

    // ✅ 7) Create invoice FIRST (critical fix like gaming/sports)
    const invoice = await stripe.invoices.create({
      customer: stripeCustomer.id,
      collection_method: "charge_automatically",
      auto_advance: true,
      metadata: {
        reservation_id: String(reservation_id),
        customer_id: String(payerId),
      },
    });

    // ✅ 8) Attach items to THIS invoice (so it never finalizes as $0)
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const unit = Number(it.unit_price || 0);
      if (!qty || qty <= 0) continue;

      const lineCents = Math.round(qty * unit * 100);
      if (!lineCents || lineCents <= 0) continue;

      const itemName = String(it.name || "Item");
      await stripe.invoiceItems.create({
        customer: stripeCustomer.id,
        invoice: invoice.id,
        currency: "usd",
        amount: lineCents,
        description: `${itemName} x${qty}`,
      });
    }

    // Optional: show fee as a separate line item
    if (fee > 0) {
      await stripe.invoiceItems.create({
        customer: stripeCustomer.id,
        invoice: invoice.id,
        currency: "usd",
        amount: Math.round(fee * 100),
        description: "Reservation fee",
      });
    }

    // 9) Finalize invoice to generate hosted pay page + pdf
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    // 10) Save payment row in DB
    await pool
      .request()
      .input("reservation_id", sql.Int, Number(reservation_id))
      .input("customer_id", sql.Int, payerId)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("currency", sql.NVarChar(10), "usd")
      .input("stripe_invoice_id", sql.NVarChar(200), finalized.id)
      .input(
        "hosted_invoice_url",
        sql.NVarChar(500),
        finalized.hosted_invoice_url || null
      )
      .input("invoice_pdf_url", sql.NVarChar(500), finalized.invoice_pdf || null)
      .input("stripe_status", sql.NVarChar(50), finalized.status || null)
      .input("is_paid", sql.Bit, finalized.status === "paid" ? 1 : 0)
      .query(`
        INSERT INTO dbo.StoreReservationPayments
          (reservation_id, customer_id, amount, currency,
           stripe_invoice_id, hosted_invoice_url, invoice_pdf_url,
           stripe_status, is_paid, paid_at)
        VALUES
          (@reservation_id, @customer_id, @amount, @currency,
           @stripe_invoice_id, @hosted_invoice_url, @invoice_pdf_url,
           @stripe_status, @is_paid,
           CASE WHEN @is_paid=1 THEN SYSDATETIME() ELSE NULL END);
      `);

    return res.json({
      reservation_id: Number(reservation_id),
      amount,
      currency: "usd",
      stripe_status: finalized.status,
      hosted_invoice_url: finalized.hosted_invoice_url,
      invoice_pdf_url: finalized.invoice_pdf,
      is_paid: finalized.status === "paid",
    });
  } catch (err) {
    console.error("POST /api/store/payments/create-invoice error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create invoice" });
  }
});

// -------------------------------------
// GET /api/store/payments/status/:reservation_id
// -------------------------------------
router.get("/payments/status/:reservation_id", async (req, res) => {
  try {
    const pool = await getDatabase();
    const reservation_id = Number(req.params.reservation_id);

    const payRes = await pool
      .request()
      .input("rid", sql.Int, reservation_id)
      .query(`
        SELECT TOP 1 *
        FROM dbo.StoreReservationPayments
        WHERE reservation_id=@rid
        ORDER BY payment_id DESC
      `);

    const payment = payRes.recordset?.[0];
    if (!payment) return res.status(404).json({ error: "No payment found for this reservation" });

    if (String(payment.stripe_status || "").toLowerCase() === "cash") {
      return res.json({
        reservation_id,
        payment_id: payment.payment_id,
        stripe_status: "cash",
        hosted_invoice_url: payment.hosted_invoice_url,
        invoice_pdf_url: payment.invoice_pdf_url,
        is_paid: true,
      });
    }

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
        UPDATE dbo.StoreReservationPayments
        SET stripe_status=@stripe_status,
            is_paid=@is_paid,
            paid_at=CASE WHEN @is_paid=1 THEN ISNULL(paid_at, @paid_at) ELSE NULL END,
            invoice_pdf_url=@invoice_pdf_url,
            hosted_invoice_url=@hosted_invoice_url
        WHERE payment_id=@pid;
      `);

    if (nowPaid && !beforePaidAt) {
      try {
        const cid = Number(payment.customer_id);
        if (cid > 0) {
          const expoToken = await getCustomerPushToken(pool, cid);
          if (expoToken) {
            await sendExpoPush(
              expoToken,
              "✅ Online Payment Completed",
              "Your payment was received successfully (online). You can now request receiving.",
              { type: "store_payment_online", reservation_id, payment_id: payment.payment_id }
            );
          }
        }
      } catch (e) {
        console.log("Store payment push error:", e);
      }
    }

    return res.json({
      reservation_id,
      payment_id: payment.payment_id,
      stripe_status: inv.status,
      hosted_invoice_url: hostedUrl,
      invoice_pdf_url: invPdf,
      is_paid: nowPaid,
    });
  } catch (err) {
    console.error("GET /api/store/payments/status/:reservation_id error:", err);
    return res.status(500).json({ error: err.message || "Failed to check payment status" });
  }
});

// -------------------------------------
// POST /api/store/payments/pay-cash
// -------------------------------------
router.post("/payments/pay-cash", async (req, res) => {
  try {
    const pool = await getDatabase();
    const { reservation_id, customer_id } = req.body || {};

    if (!reservation_id) return res.status(400).json({ error: "reservation_id is required" });

    const rRes = await pool
      .request()
      .input("rid", sql.Int, Number(reservation_id))
      .query(`
        SELECT TOP 1 reservation_id, customer_id, final_price
        FROM dbo.StoreReservations
        WHERE reservation_id=@rid
      `);

    const rr = rRes.recordset?.[0];
    if (!rr) return res.status(404).json({ error: "Reservation not found" });

    const payerId = Number(customer_id || rr.customer_id);
    if (!payerId) return res.status(400).json({ error: "customer_id is required" });

    const amount = Number(rr.final_price || 0);
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid reservation amount" });

    const lastPay = await pool
      .request()
      .input("rid", sql.Int, Number(reservation_id))
      .query(`
        SELECT TOP 1 is_paid, stripe_status
        FROM dbo.StoreReservationPayments
        WHERE reservation_id=@rid
        ORDER BY payment_id DESC
      `);

    const lp = lastPay.recordset?.[0];
    if (lp && (lp.is_paid === 1 || String(lp.stripe_status).toLowerCase() === "paid")) {
      return res.status(400).json({ error: "Reservation already paid" });
    }

    await pool
      .request()
      .input("reservation_id", sql.Int, Number(reservation_id))
      .input("customer_id", sql.Int, payerId)
      .input("amount", sql.Decimal(10, 2), amount)
      .input("currency", sql.NVarChar(10), "usd")
      .input("stripe_status", sql.NVarChar(50), "cash")
      .input("is_paid", sql.Bit, 1)
      .query(`
        INSERT INTO dbo.StoreReservationPayments
          (reservation_id, customer_id, amount, currency, stripe_status, is_paid)
        VALUES
          (@reservation_id, @customer_id, @amount, @currency, @stripe_status, @is_paid);
      `);

    try {
      const expoToken = await getCustomerPushToken(pool, payerId);
      if (expoToken) {
        await sendExpoPush(
          expoToken,
          "✅ Cash Payment Completed",
          "Your cash payment was recorded successfully. You can now request receiving.",
          { type: "store_payment_cash", reservation_id: Number(reservation_id) }
        );
      }
    } catch (e) {
      console.log("Store cash push error:", e);
    }

    return res.json({ ok: true, reservation_id: Number(reservation_id), amount });
  } catch (err) {
    console.error("POST /api/store/payments/pay-cash error:", err);
    return res.status(500).json({ error: err.message || "Failed to set cash payment" });
  }
});

// -------------------------------------
// GET /api/store/reservations?view=reserved|expired|all (Admin)
// -------------------------------------
router.get("/reservations", async (req, res) => {
  try {
    const pool = await getDatabase();
    await expireAndRestore(pool);

    const view = String(req.query.view || "reserved").toLowerCase();

    let whereClause = "";
    if (view === "reserved") {
      whereClause = `
        WHERE ${normalizeStatusSql("sr.status")} = 'RESERVED'
          AND sr.expires_at > GETDATE()
      `;
    } else if (view === "expired") {
      whereClause = `
        WHERE (${normalizeStatusSql("sr.status")} = 'EXPIRED' OR sr.expires_at <= GETDATE())
      `;
    }

    const rRes = await pool.request().query(`
      SELECT
        sr.reservation_id,
        sr.customer_id,
        sr.reservation_code,
        sr.status,
        sr.reserved_at,
        sr.expires_at,
        sr.fee_amount,
        sr.base_price AS total_base_price,
        sr.final_price AS total_final_price,
        c.name AS customer_name,

        rr.status AS receive_request_status,
        rr.request_code AS receive_request_code,
        rr.expires_at AS receive_request_expires_at,

        pay.is_paid AS payment_is_paid,
        pay.stripe_status AS payment_stripe_status,
        pay.hosted_invoice_url AS payment_hosted_invoice_url,
        pay.invoice_pdf_url AS payment_invoice_pdf_url,
        pay.amount AS payment_amount,
        pay.currency AS payment_currency

      FROM dbo.StoreReservations sr
      LEFT JOIN dbo.Customers c ON c.customer_id = sr.customer_id

      OUTER APPLY (
        SELECT TOP 1 status, request_code, expires_at
        FROM dbo.StoreReceiveRequests
        WHERE reservation_id = sr.reservation_id
        ORDER BY created_at DESC
      ) rr

      OUTER APPLY (
        SELECT TOP 1
          p.is_paid,
          p.stripe_status,
          p.hosted_invoice_url,
          p.invoice_pdf_url,
          p.amount,
          p.currency
        FROM dbo.StoreReservationPayments p
        WHERE p.reservation_id = sr.reservation_id
        ORDER BY p.payment_id DESC
      ) pay

      ${whereClause}
      ORDER BY sr.reserved_at DESC
    `);

    const reservations = rRes.recordset || [];
    if (reservations.length === 0) return res.json({ reservations: [] });

    const ids = reservations.map((x) => x.reservation_id).join(",");

    const itemsRes = await pool.request().query(`
      SELECT
        ri.reservation_id,
        ri.product_id,
        ri.quantity,
        ri.unit_price,
        p.name,
        p.image_url,
        p.price AS product_price
      FROM dbo.StoreReservationItems ri
      JOIN dbo.Products p ON p.product_id = ri.product_id
      WHERE ri.reservation_id IN (${ids})
      ORDER BY ri.created_at ASC
    `);

    const map = {};
    for (const rr of reservations) map[rr.reservation_id] = { ...rr, items: [] };
    for (const it of itemsRes.recordset || []) {
      if (map[it.reservation_id]) map[it.reservation_id].items.push(it);
    }

    return res.json({ reservations: Object.values(map) });
  } catch (err) {
    console.error("reservations list error:", err);
    return res.status(500).json({ message: "Server error fetching reservations." });
  }
});

// -------------------------------------
// Other endpoints (keep as is)
// -------------------------------------
router.post("/reservations/confirm-by-code", async (req, res) => {
  try {
    const pool = await getDatabase();
    const { code } = req.body;

    if (!code) return res.status(400).json({ message: "Missing code." });

    const up = await pool
      .request()
      .input("code", sql.NVarChar(50), String(code).trim())
      .query(`
        UPDATE dbo.StoreReservations
        SET status = 'Confirmed', confirmed_at = GETDATE()
        WHERE reservation_code = @code
      `);

    if (up.rowsAffected?.[0] === 0) {
      return res.status(404).json({ message: "Reservation code not found." });
    }

    return res.json({ message: "Reservation confirmed." });
  } catch (err) {
    console.error("confirm-by-code error:", err);
    return res.status(500).json({ message: "Server error confirming reservation." });
  }
});

router.put("/reservations/expire", async (_req, res) => {
  try {
    const pool = await getDatabase();
    await expireAndRestore(pool);
    return res.json({ message: "Expire job executed." });
  } catch (err) {
    console.error("expire manual error:", err);
    return res.status(500).json({ message: "Server error expiring reservations." });
  }
});

// Receive workflow endpoints (same as before)
router.post("/receive-requests/request", async (req, res) => {
  try {
    const pool = await getDatabase();
    const { reservation_id, customer_name } = req.body;

    const rid = Number(reservation_id);
    if (!rid || !customer_name?.trim()) {
      return res.status(400).json({ message: "reservation_id and customer_name are required." });
    }

    await expireAndRestore(pool);

    const check = await pool.request()
      .input("rid", sql.Int, rid)
      .query(`
        SELECT reservation_id, status, expires_at
        FROM dbo.StoreReservations
        WHERE reservation_id = @rid
      `);

    const r = check.recordset?.[0];
    if (!r) return res.status(404).json({ message: "Reservation not found." });

    const st = String(r.status || "").trim().toUpperCase();
    if (st !== "RESERVED") return res.status(400).json({ message: "Reservation is not in Reserved state." });
    if (new Date(r.expires_at).getTime() <= Date.now()) return res.status(400).json({ message: "Reservation expired." });

    const existing = await pool.request()
      .input("rid", sql.Int, rid)
      .query(`
        SELECT TOP 1 request_id, status, request_code, expires_at
        FROM dbo.StoreReceiveRequests
        WHERE reservation_id = @rid
          AND status IN ('Pending','Confirmed')
          AND expires_at > SYSUTCDATETIME()
        ORDER BY created_at DESC
      `);

    if (existing.recordset?.length) {
      return res.json({ message: "Receive request already exists.", request: existing.recordset[0] });
    }

    const expiresAt = addMinutes(new Date(), 30);
    const code = generatePickupCode();

    const ins = await pool.request()
      .input("rid", sql.Int, rid)
      .input("customer_name", sql.NVarChar(150), customer_name.trim())
      .input("status", sql.NVarChar(20), "Pending")
      .input("request_code", sql.NVarChar(20), code)
      .input("expires_at", sql.DateTime2, expiresAt)
      .input("created_source", sql.NVarChar(20), "mobile")
      .query(`
        INSERT INTO dbo.StoreReceiveRequests
          (reservation_id, customer_name, status, request_code, created_at, expires_at, created_source)
        OUTPUT INSERTED.request_id, INSERTED.status, INSERTED.request_code, INSERTED.expires_at
        VALUES
          (@rid, @customer_name, @status, @request_code, SYSUTCDATETIME(), @expires_at, @created_source)
      `);

    return res.json({ message: "Receive request created.", request: ins.recordset?.[0] });
  } catch (err) {
    console.error("receive request create error:", err);
    return res.status(500).json({ message: "Server error creating receive request." });
  }
});

router.post("/receive-requests/confirm", async (req, res) => {
  try {
    const pool = await getDatabase();
    const rid = Number(req.body?.reservation_id);

    if (!rid) return res.status(400).json({ message: "reservation_id is required." });

    const up = await pool.request()
      .input("rid", sql.Int, rid)
      .query(`
        UPDATE dbo.StoreReceiveRequests
        SET status = 'Confirmed'
        OUTPUT INSERTED.request_id, INSERTED.status, INSERTED.request_code, INSERTED.expires_at
        WHERE request_id = (
          SELECT TOP 1 request_id
          FROM dbo.StoreReceiveRequests
          WHERE reservation_id = @rid
            AND status = 'Pending'
            AND expires_at > SYSUTCDATETIME()
          ORDER BY created_at DESC
        )
      `);

    const row = up.recordset?.[0];
    if (!row) return res.status(404).json({ message: "No active pending request to confirm." });

    try {
      const requestCode = row?.request_code;
      if (requestCode) {
        await pushToReservationOwner(
          pool,
          rid,
          "📦 Pickup Code Ready",
          `Your pickup code is: ${requestCode}. Enter it in the app to receive your items.`,
          { type: "store_pickup_code", reservation_id: rid, request_code: requestCode }
        );
      }
    } catch (e) {
      console.log("pickup code push error:", e);
    }

    return res.json({ message: "Receive request confirmed. Give this code to the customer.", request: row });
  } catch (err) {
    console.error("receive request confirm error:", err);
    return res.status(500).json({ message: "Server error confirming receive request." });
  }
});

router.post("/receive-requests/approve", async (req, res) => {
  try {
    const pool = await getDatabase();
    const rid = Number(req.body?.reservation_id);
    const code = String(req.body?.request_code || "").trim();

    if (!rid || !code) {
      return res.status(400).json({ message: "reservation_id and request_code are required." });
    }

    await expireAndRestore(pool);

    const approve = await pool.request()
      .input("rid", sql.Int, rid)
      .input("code", sql.NVarChar(20), code)
      .query(`
        UPDATE dbo.StoreReceiveRequests
        SET status = 'Approved',
            approved_at = SYSUTCDATETIME(),
            completed_at = SYSUTCDATETIME()
        OUTPUT INSERTED.request_id, INSERTED.status
        WHERE reservation_id = @rid
          AND request_code = @code
          AND status = 'Confirmed'
          AND expires_at > SYSUTCDATETIME()
      `);

    if (!approve.recordset?.length) {
      return res.status(400).json({ message: "Invalid/expired code or request not confirmed yet." });
    }

    await pool.request()
      .input("rid", sql.Int, rid)
      .query(`
        UPDATE dbo.StoreReservations
        SET status = 'Received', confirmed_at = GETDATE()
        WHERE reservation_id = @rid
      `);

    return res.json({ message: "Approved. Reservation marked as Received." });
  } catch (err) {
    console.error("receive request approve error:", err);
    return res.status(500).json({ message: "Server error approving receive request." });
  }
});
// -------------------------------------
// GET /api/store/payments/cash-invoice/:reservation_id
// Generates & downloads PDF invoice (CASH only)
// -------------------------------------
router.get("/payments/cash-invoice/:reservation_id", async (req, res) => {
  try {
    const pool = await getDatabase();
    const reservation_id = Number(req.params.reservation_id);
    if (!reservation_id) return res.status(400).json({ error: "Invalid reservation_id" });

    // 1) ensure it's paid by CASH (optional but recommended)
    const payRes = await pool
      .request()
      .input("rid", sql.Int, reservation_id)
      .query(`
        SELECT TOP 1 stripe_status, is_paid, amount, currency, paid_at
        FROM dbo.StoreReservationPayments
        WHERE reservation_id=@rid
        ORDER BY payment_id DESC
      `);

    const pay = payRes.recordset?.[0];
    if (!pay) return res.status(404).json({ error: "No payment found" });

    const st = String(pay.stripe_status || "").toLowerCase().trim();
    if (st !== "cash") {
      return res.status(400).json({ error: "Invoice PDF is only generated for CASH payments" });
    }
    if (!pay.is_paid) {
      return res.status(400).json({ error: "Payment is not marked as paid" });
    }

    // 2) fetch reservation + customer
    const rRes = await pool
      .request()
      .input("rid", sql.Int, reservation_id)
      .query(`
        SELECT TOP 1
          sr.reservation_id,
          sr.reservation_code,
          sr.customer_id,
          sr.reserved_at,
          sr.final_price,
          c.name AS customer_name
        FROM dbo.StoreReservations sr
        LEFT JOIN dbo.Customers c ON c.customer_id = sr.customer_id
        WHERE sr.reservation_id=@rid
      `);

    const rr = rRes.recordset?.[0];
    if (!rr) return res.status(404).json({ error: "Reservation not found" });

    // 3) fetch items
    const itemsRes = await pool
      .request()
      .input("rid", sql.Int, reservation_id)
      .query(`
        SELECT
          ri.product_id,
          ri.quantity,
          ri.unit_price,
          p.name
        FROM dbo.StoreReservationItems ri
        JOIN dbo.Products p ON p.product_id = ri.product_id
        WHERE ri.reservation_id=@rid
        ORDER BY ri.created_at ASC
      `);

    const items = itemsRes.recordset || [];

    // 4) build PDF (stream)
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    const safeCode = rr.reservation_code || `RES-${reservation_id}`;
    const filename = `invoice_${safeCode}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).text("Sport Zone - Store Invoice", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Invoice: ${safeCode}`);
    doc.text(`Reservation ID: ${reservation_id}`);
    doc.text(`Customer: ${rr.customer_name || rr.customer_id || "-"}`);
    doc.text(`Payment Method: CASH`);
    doc.text(`Paid Amount: ${Number(pay.amount || rr.final_price || 0).toFixed(2)} ${String(pay.currency || "usd").toUpperCase()}`);
    doc.moveDown();

    // Table header
    doc.fontSize(12).text("Items", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10);
    doc.text("Name", 40, doc.y, { continued: true });
    doc.text("Qty", 300, doc.y, { continued: true });
    doc.text("Unit", 360, doc.y, { continued: true });
    doc.text("Total", 450, doc.y);
    doc.moveDown(0.3);

    let computedTotal = 0;

    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const unit = Number(it.unit_price || 0);
      const line = qty * unit;
      computedTotal += line;

      doc.text(String(it.name || "Item"), 40, doc.y, { continued: true });
      doc.text(String(qty), 300, doc.y, { continued: true });
      doc.text(unit.toFixed(2), 360, doc.y, { continued: true });
      doc.text(line.toFixed(2), 450, doc.y);
    }

    doc.moveDown();
    doc.fontSize(12).text(`Total: ${computedTotal.toFixed(2)} ${String(pay.currency || "usd").toUpperCase()}`, {
      align: "right",
    });

    doc.moveDown(1);
    doc.fontSize(10).text("Thank you!", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("GET /api/store/payments/cash-invoice/:reservation_id error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate invoice PDF" });
  }
});

module.exports = router;