// Back_end/routes/aiSuggest.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { sql, getDatabase } = require("../config/database");

// OpenAI-compatible DeepSeek endpoint (most setups)
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// helper: fallback suggestion if AI fails
function fallbackSuggest(products, prefs) {
  let list = products.filter(p => p.stock_qty > 0);

  if (prefs.category) {
    list = list.filter(p =>
      String(p.category || "").toLowerCase().includes(prefs.category.toLowerCase())
    );
  }
  if (prefs.maxPrice) {
    list = list.filter(p => Number(p.price) <= Number(prefs.maxPrice));
  }

  // return latest 5
  return list.slice(0, 5).map(p => ({
    product_id: p.product_id,
    name: p.name,
    category: p.category,
    price: p.price,
    image_url: p.image_url,
    reason: "Match your preferences and available in stock."
  }));
}

/**
 * POST /api/ai/suggest
 * body example:
 * {
 *   style: "sportive | casual | warm | pajama ...",
 *   category: "Shoes | Clothes | Accessories | any-text",
 *   maxPrice: 200,
 *   notes: "i want comfy warm look not for sport etc"
 * }
 */
router.post("/suggest", async (req, res) => {
  try {
    const prefs = req.body || {};

    const pool = await getDatabase();

    // 1) Get products from DB (only in stock)
    const dbRes = await pool.request().query(`
      SELECT TOP 500
        product_id, name, category, price, stock_qty, image_url, created_at
      FROM Products
      WHERE stock_qty > 0
      ORDER BY created_at DESC
    `);

    const products = dbRes.recordset || [];
    if (!products.length) {
      return res.status(200).json({
        suggestions: [],
        message: "No products in stock to suggest from."
      });
    }

    // 2) Build a strict prompt so AI chooses only from your products
    const catalogText = products.map(p => {
      return `#${p.product_id} | ${p.name} | ${p.category} | $${p.price}`;
    }).join("\n");

    const systemPrompt = `
You are a shopping assistant for a sport clothing store.
IMPORTANT RULES:
- You MUST suggest only products that appear in the catalog below.
- Never invent new items. Never suggest items not listed.
- Return JSON ONLY in this exact format:
{
  "suggestions": [
    {
      "product_id": number,
      "reason": "short reason"
    }
  ]
}
Give 3 to 6 suggestions.
Catalog:
${catalogText}
`;

    const userPrompt = `
Customer preferences:
- style: ${prefs.style || "any"}
- category: ${prefs.category || "any"}
- maxPrice: ${prefs.maxPrice || "any"}
- notes: ${prefs.notes || ""}
Pick best matching products from the catalog.
`;

    // 3) If no key, fallback directly (still works)
    if (!DEEPSEEK_API_KEY) {
      const fb = fallbackSuggest(products, prefs);
      return res.json({ suggestions: fb, source: "fallback_no_key" });
    }

    // 4) Call DeepSeek (OpenAI-compatible)
    const aiRes = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = aiRes.data?.choices?.[0]?.message?.content || "";
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      // if AI returned extra text, fallback
      const fb = fallbackSuggest(products, prefs);
      return res.json({ suggestions: fb, source: "fallback_parse_fail" });
    }

    const ids = (parsed.suggestions || []).map(s => s.product_id);
    const chosen = products.filter(p => ids.includes(p.product_id));

    // Merge reasons back
    const suggestions = (parsed.suggestions || [])
      .map(s => {
        const prod = chosen.find(p => p.product_id === s.product_id);
        if (!prod) return null;
        return {
          product_id: prod.product_id,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          image_url: prod.image_url,
          stock_qty: prod.stock_qty,
          reason: s.reason || "Recommended based on your preferences."
        };
      })
      .filter(Boolean);

    res.json({ suggestions, source: "deepseek" });

  } catch (err) {
    console.error("AI suggest error:", err?.response?.data || err.message);
    try {
      const pool = await getDatabase();
      const dbRes = await pool.request().query(`
        SELECT TOP 50 product_id, name, category, price, stock_qty, image_url, created_at
        FROM Products WHERE stock_qty > 0 ORDER BY created_at DESC
      `);
      const fb = fallbackSuggest(dbRes.recordset || [], req.body || {});
      return res.json({ suggestions: fb, source: "fallback_error" });
    } catch (e2) {
      return res.status(500).json({ message: "AI suggestion failed." });
    }
  }
});

module.exports = router;
