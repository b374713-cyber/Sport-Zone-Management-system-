const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const axios = require("axios");

const { sql, getDatabase } = require("../config/database");

const INVOICE_DIR = path.join(__dirname, "..", "uploads", "invoices");
if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR, { recursive: true });

// Optional logo (put your logo here)
const LOGO_PATH = path.join(__dirname, "..", "uploads", "logo.png"); // or assets/logo.png

async function fetchImageBuffer(imageUrl, apiBaseForLocalFiles) {
  if (!imageUrl) return null;

  // If it’s a local "/uploads/..." path coming from DB:
  if (imageUrl.startsWith("/uploads/")) {
    const localPath = path.join(__dirname, "..", imageUrl.replace("/", ""));
    if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
    return null;
  }

  // If it’s full http(s)
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const resp = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return Buffer.from(resp.data);
  }

  // If it’s relative like "uploads/.."
  if (apiBaseForLocalFiles) {
    const full = `${apiBaseForLocalFiles}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    const resp = await axios.get(full, { responseType: "arraybuffer" });
    return Buffer.from(resp.data);
  }

  return null;
}

function money(n) {
  return Number(n || 0).toFixed(2);
}

function makeInvoiceNumber(invoiceId) {
  return `INV-${String(invoiceId).padStart(6, "0")}`;
}

/**
 * POST /api/store/invoices/create-from-reservation
 * Body: { reservation_id, paid_at?, payment_method? }
 *
 * Generates PDF + stores invoice in DB
 */
router.post("/create-from-reservation", async (req, res) => {
  try {
    const pool = await getDatabase();
    const reservationId = Number(req.body?.reservation_id);

    if (!reservationId) {
      return res.status(400).json({ message: "reservation_id is required." });
    }

    // Only allow invoices for Received reservations
    const headerRes = await pool.request()
      .input("rid", sql.Int, reservationId)
      .query(`
        SELECT TOP 1
          sr.reservation_id,
          sr.user_id,
          sr.status,
          sr.reserved_at,
          sr.confirmed_at,
          sr.base_price,
          sr.final_price,
          sr.fee_amount,
          u.name AS customer_name
        FROM dbo.StoreReservations sr
        LEFT JOIN dbo.Users u ON u.user_id = sr.user_id
        WHERE sr.reservation_id = @rid
      `);

    const header = headerRes.recordset?.[0];
    if (!header) return res.status(404).json({ message: "Reservation not found." });

    const st = String(header.status || "").trim().toLowerCase();
    if (st !== "received") {
      return res.status(400).json({ message: "Invoice can be generated only after Received." });
    }

    // Items (supports multi-item reservations)
    const itemsRes = await pool.request()
      .input("rid", sql.Int, reservationId)
      .query(`
        SELECT
          ri.product_id,
          ri.quantity,
          ri.unit_price,
          p.name,
          p.image_url
        FROM dbo.StoreReservationItems ri
        JOIN dbo.Products p ON p.product_id = ri.product_id
        WHERE ri.reservation_id = @rid
        ORDER BY ri.created_at ASC
      `);

    const items = itemsRes.recordset || [];
    if (!items.length) return res.status(400).json({ message: "No items found for reservation." });

    // Create invoice row first
    const totalAmount = Number(header.final_price || 0);

    const ins = await pool.request()
      .input("rid", sql.Int, reservationId)
      .input("uid", sql.Int, header.user_id || null)
      .input("total", sql.Decimal(10,2), totalAmount)
      .input("paid_at", sql.DateTime2, req.body?.paid_at ? new Date(req.body.paid_at) : null)
      .input("payment_method", sql.NVarChar(50), req.body?.payment_method || null)
      .query(`
        INSERT INTO dbo.StoreInvoices (reservation_id, user_id, total_amount, paid_at, payment_method)
        OUTPUT INSERTED.invoice_id
        VALUES (@rid, @uid, @total, @paid_at, @payment_method)
      `);

    const invoiceId = ins.recordset?.[0]?.invoice_id;
    if (!invoiceId) return res.status(500).json({ message: "Failed to create invoice row." });

    const invoiceNumber = makeInvoiceNumber(invoiceId);
    const pdfFileName = `invoice_${invoiceNumber}.pdf`;
    const pdfPath = path.join(INVOICE_DIR, pdfFileName);

    // Write PDF
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Header
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 40, 30, { width: 90 });
    }

    doc.fontSize(20).text("INVOICE", 0, 35, { align: "right" });
    doc.moveDown(1);

    doc.fontSize(11);
    doc.text(`Invoice #: ${invoiceNumber}`);
    doc.text(`Reservation ID: ${reservationId}`);
    doc.text(`Customer: ${header.customer_name || "—"}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    // Line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // Table header
    doc.fontSize(12).text("Items", { underline: true });
    doc.moveDown(0.6);

    let y = doc.y;

    for (const it of items) {
      const lineTotal = Number(it.unit_price || 0) * Number(it.quantity || 0);

      // image thumbnail if possible
      try {
        const buf = await fetchImageBuffer(it.image_url, null);
        if (buf) {
          doc.image(buf, 40, y, { width: 40, height: 40 });
        }
      } catch {}

      doc.fontSize(11).text(`${it.name || "Item"}`, 90, y);
      doc.text(`Qty: ${it.quantity}`, 350, y, { width: 80, align: "right" });
      doc.text(`$${money(it.unit_price)}`, 440, y, { width: 80, align: "right" });
      doc.text(`$${money(lineTotal)}`, 520, y, { width: 80, align: "right" });

      y += 50;
      doc.y = y;

      // new page safety
      if (y > 700) {
        doc.addPage();
        y = 60;
        doc.y = y;
      }
    }

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(12).text(`Fee: $${money(header.fee_amount)}`, { align: "right" });
    doc.fontSize(14).text(`TOTAL: $${money(totalAmount)}`, { align: "right" });

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    // Update invoice row with number + pdf path
    const relativePdfPath = `/uploads/invoices/${pdfFileName}`;

    await pool.request()
      .input("iid", sql.Int, invoiceId)
      .input("inv", sql.NVarChar(50), invoiceNumber)
      .input("pdf", sql.NVarChar(300), relativePdfPath)
      .query(`
        UPDATE dbo.StoreInvoices
        SET invoice_number = @inv,
            pdf_path = @pdf
        WHERE invoice_id = @iid
      `);

    return res.json({
      message: "Invoice generated.",
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      pdf_url: relativePdfPath,
    });
  } catch (err) {
    console.error("invoice create error:", err);
    return res.status(500).json({ message: "Server error creating invoice." });
  }
});

/**
 * GET /api/store/invoices/by-reservation/:reservationId
 * returns latest invoice for that reservation
 */
router.get("/by-reservation/:reservationId", async (req, res) => {
  try {
    const pool = await getDatabase();
    const rid = Number(req.params.reservationId);
    if (!rid) return res.status(400).json({ message: "Invalid reservationId." });

    const q = await pool.request()
      .input("rid", sql.Int, rid)
      .query(`
        SELECT TOP 1 *
        FROM dbo.StoreInvoices
        WHERE reservation_id = @rid
        ORDER BY invoice_id DESC
      `);

    const inv = q.recordset?.[0];
    if (!inv) return res.status(404).json({ message: "No invoice found." });

    return res.json({ invoice: inv });
  } catch (err) {
    console.error("invoice by reservation error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

/**
 * GET /api/store/my-purchases/:userId
 * Shows items the user bought (reservations with status = Received)
 */
router.get("/my-purchases/:userId", async (req, res) => {
  try {
    const pool = await getDatabase();
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: "Invalid userId." });

    const rows = await pool.request()
      .input("uid", sql.Int, userId)
      .query(`
        SELECT
          sr.reservation_id,
          sr.confirmed_at,
          sr.final_price,
          ri.product_id,
          ri.quantity,
          ri.unit_price,
          p.name,
          p.image_url
        FROM dbo.StoreReservations sr
        JOIN dbo.StoreReservationItems ri ON ri.reservation_id = sr.reservation_id
        JOIN dbo.Products p ON p.product_id = ri.product_id
        WHERE sr.user_id = @uid
          AND UPPER(LTRIM(RTRIM(sr.status))) = 'RECEIVED'
        ORDER BY sr.confirmed_at DESC, ri.created_at ASC
      `);

    return res.json({ purchases: rows.recordset || [] });
  } catch (err) {
    console.error("my purchases error:", err);
    return res.status(500).json({ message: "Server error fetching purchases." });
  }
});

module.exports = router;
