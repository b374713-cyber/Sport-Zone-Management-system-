
const express = require("express");
const router = express.Router();

const { sql, getDatabase } = require("../config/database");

async function postJson(url, body, headers = {}) {// ai groq api 
  const payload = JSON.stringify(body);

  // Node 18+ global fetch
  if (typeof fetch === "function") {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: payload,
    });

    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!r.ok) {
      const msg = json?.error?.message || json?.message || text || `HTTP ${r.status}`;
      throw new Error(`Groq API error: ${msg}`);
    }
    return json;
  }

  // fallback for older Node
  const fetchFn = require("node-fetch");
  const r = await fetchFn(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: payload,
  });

  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!r.ok) {
    const msg = json?.error?.message || json?.message || text || `HTTP ${r.status}`;
    throw new Error(`Groq API error: ${msg}`);
  }
  return json;
}

// detect stock column name in dbo.Products
let cachedStockCol = null;
async function detectStockColumn(pool) {
  if (cachedStockCol) return cachedStockCol;

  const colsRes = await pool.request().query(`
    SELECT c.name AS col
    FROM sys.columns c
    JOIN sys.objects o ON c.object_id = o.object_id
    WHERE o.name = 'Products'
  `);

  const cols = (colsRes.recordset || []).map((r) => String(r.col).toLowerCase());

  const candidates = [
    "stock_qty",
    "stock",
    "quantity",
    "qty",
    "stock_quantity",
    "in_stock",
    "available_qty",
  ];

  cachedStockCol = candidates.find((c) => cols.includes(c)) || "stock_qty";
  return cachedStockCol;
}

async function groqSuggest({ user_prompt, products }) {
  const apiKey = process.env.GROQ_CLOTHES_SUGGESTION_KEY;
  const model = process.env.GROQ_CLOTHES_SUGGESTION_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) throw new Error("Missing GROQ_CLOTHES_SUGGESTION_KEY in .env");

  const compactProducts = products.map((p) => ({
    product_id: p.product_id,
    name: p.name,
    category: p.category,
    price: p.price,
  }));

  const system = `
You are a clothing recommendation assistant for a mobile sports store app.
You will receive the user's request and a list of products that are currently in-stock.
Return ONLY valid JSON (no markdown, no extra text).

Format:
{
  "suggestions": [
    { "product_id": number, "match_score": number, "reason": string }
  ]
}

Rules:
- Choose up to 10 products maximum.
- match_score must be 0-100.
- Only choose product_id values from the provided list.
- Prefer diversity (not all from one category).
`;

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const resp = await postJson(
    url,
    {
      model,
      temperature: 0.4,
      max_completion_tokens: 700,
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: JSON.stringify({ user_prompt, products: compactProducts }) },
      ],
    },
    { Authorization: `Bearer ${apiKey}` }
  );

  const content = resp?.choices?.[0]?.message?.content || "";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const s = content.indexOf("{");
    const e = content.lastIndexOf("}");
    if (s >= 0 && e > s) parsed = JSON.parse(content.slice(s, e + 1));
    else throw new Error("Groq returned non-JSON output");
  }

  const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  return suggestions
    .filter((x) => Number.isFinite(Number(x.product_id)))
    .map((x) => ({
      product_id: Number(x.product_id),
      match_score: Math.max(0, Math.min(100, Number(x.match_score ?? 0))),
      reason: String(x.reason || "").slice(0, 240),
    }))
    .slice(0, 10);
}

/**
 * POST /api/store/ai-suggestions/mobile
 * Body:
 *  { user_prompt: string, category?: string, maxPrice?: number | null }
 */
router.post("/ai-suggestions/mobile", async (req, res) => {
  try {
    const body = req.body || {};

    const user_prompt = String(body.user_prompt ?? "").trim() || "Suggest clothing items for me.";
    const category = String(body.category ?? "").trim();

    const maxPriceRaw = body.maxPrice;
    const maxPrice =
      maxPriceRaw === null || maxPriceRaw === undefined || String(maxPriceRaw).trim() === ""
        ? null
        : Number(maxPriceRaw);

    const pool = await getDatabase();
    const stockCol = await detectStockColumn(pool);

    const request = pool.request();

    let where = `WHERE p.${stockCol} > 0`;

    if (category) {
      where += ` AND p.category = @category`;
      request.input("category", sql.NVarChar, category);
    }

    if (maxPrice !== null && Number.isFinite(maxPrice)) {
      where += ` AND p.price <= @maxPrice`;
      request.input("maxPrice", sql.Decimal(10, 2), maxPrice);
    }

    const query = `
      SELECT TOP 200
        p.product_id,
        p.name,
        p.category,
        p.price,
        p.image_url,
        p.${stockCol} AS stock_qty
      FROM dbo.Products p
      ${where}
      ORDER BY p.${stockCol} DESC, p.price ASC
    `;

    const dbRes = await request.query(query);
    const products = dbRes.recordset || [];

    if (!products.length) {
      return res.json({
        source: "groq-clothes-mobile",
        suggestions: [],
        count: 0,
        note: "No products available for the selected filters",
      });
    }

    const ranked = await groqSuggest({ user_prompt, products });

    const byId = new Map(products.map((p) => [p.product_id, p]));
    const finalSuggestions = ranked
      .map((r) => {
        const p = byId.get(r.product_id);
        if (!p) return null;
        return {
          product_id: p.product_id,
          name: p.name,
          category: p.category,
          price: p.price,
          image_url: p.image_url,
          stock_qty: p.stock_qty,
          match_score: r.match_score,
          reason: r.reason,
        };
      })
      .filter(Boolean);

    return res.json({
      source: "groq-clothes-mobile",
      suggestions: finalSuggestions,
      count: finalSuggestions.length,
    });
  } catch (err) {
    console.error("mobile ai-suggestions error:", err);
    return res.status(500).json({
      error: "Failed to get mobile AI suggestions",
      details: err.message,
    });
  }
});

module.exports = router;
