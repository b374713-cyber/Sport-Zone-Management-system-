// Back_end/routes/storeAISuggestions.js
const express = require("express");
const router = express.Router();

const { sql, getDatabase } = require("../config/database");

/**
 * Detect which stock column exists in dbo.Products
 * Some DBs use: stock_qty, stock, quantity, qty, stock_quantity...
 */
let cachedStockCol = null;

async function detectStockColumn(pool) {
  if (cachedStockCol) return cachedStockCol;

  const colsRes = await pool.request().query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Products'
  `);

  const cols = (colsRes.recordset || []).map((r) =>
    String(r.COLUMN_NAME || "").toLowerCase()
  );

  const candidates = [
    "stock_qty",
    "stock_quantity",
    "stock",
    "qty",
    "quantity",
    "quantity_available",
  ];

  const found = candidates.find((c) => cols.includes(c));
  cachedStockCol = found || "stock_qty"; // fallback (won't crash, but may return 0 if doesn't exist)
  return cachedStockCol;
}

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Simple scoring based on style/notes keywords matching product name/category
function scoreProduct({ name, category }, { style, notes }) {
  const text = normalizeText(`${name} ${category}`);
  const styleText = normalizeText(style);
  const notesText = normalizeText(notes);

  let score = 0;

  const tokens = (styleText + " " + notesText)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);

  for (const t of tokens) {
    if (t.length < 3) continue;
    if (text.includes(t)) score += 3;
  }

  if (styleText) score += 1;

  return score;
}


router.post("/ai-suggestions", async (req, res) => {
  try {
    const { style = "", category = "", maxPrice = null, notes = "" } = req.body || {};

    const pool = await getDatabase();
    const stockCol = await detectStockColumn(pool);
    const request = pool.request();

    let where = `WHERE p.${stockCol} > 0`;
    if (category && String(category).trim() !== "") {
      where += ` AND p.category = @category`;
      request.input("category", sql.NVarChar, String(category));
    }
    if (maxPrice !== null && maxPrice !== undefined && String(maxPrice).trim() !== "") {
      where += ` AND p.price <= @maxPrice`;
      request.input("maxPrice", sql.Decimal(18, 2), Number(maxPrice));
    }

    const q = `
      SELECT TOP 200
        p.product_id,
        p.name,
        p.category,
        p.price,
        p.image_url,
        p.${stockCol} AS stock_qty
      FROM dbo.Products p
      ${where}
      ORDER BY p.product_id DESC
    `;

    const result = await request.query(q);
    const products = result.recordset || [];

    const scored = products
      .map((p) => ({
        ...p,
        _score: scoreProduct(p, { style, notes }),
      }))
      .sort((a, b) => b._score - a._score || Number(b.product_id) - Number(a.product_id));

    const top = scored.slice(0, 8).map((p) => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category,
      price: p.price,
      image_url: p.image_url,
      stock_qty: p.stock_qty,
      reason:
        p._score > 0
          ? `Matched your style/notes keywords (score ${p._score}).`
          : `Picked from your available stock (in-stock item).`,
    }));

    return res.json({
      source: "local-stock-engine",
      suggestions: top,
      count: top.length,
    });
  } catch (err) {
    console.error("store ai-suggestions error:", err);
    return res.status(500).json({
      error: "Failed to get AI suggestions",
      details: err.message,
    });
  }
});

module.exports = router;
