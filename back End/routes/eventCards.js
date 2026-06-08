const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { GoogleAuth } = require("google-auth-library");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true },
  port: Number(process.env.DB_PORT || 14330),
};

// -------------------- CREATE EVENT (TEXT via Gemini) --------------------
router.post("/create", async (req, res) => {
  const {
    title,
    sport,
    event_date,
    groups_count,
    trophy,
    description
  } = req.body;

  if (!title || !sport || !event_date || !groups_count) {
    return res.status(400).json({ error: "Missing fields" });
  }

  let pool;
  try {
    pool = await sql.connect(dbConfig);

    // 1) Insert event
    const insertResult = await pool.request()
      .input("title", sql.NVarChar, title)
      .input("sport", sql.NVarChar, sport)
      .input("event_date", sql.Date, event_date)
      .input("groups_count", sql.Int, groups_count)
      .input("trophy", sql.NVarChar, trophy || null)
      .input("description", sql.NVarChar(sql.MAX), description || null)
      .query(`
        INSERT INTO SportEvents (title, sport, event_date, groups_count, trophy, description)
        OUTPUT INSERTED.*
        VALUES (@title, @sport, @event_date, @groups_count, @trophy, @description)
      `);

    const eventRow = insertResult.recordset[0];

    // 2) Gemini text prompt
    const prompt = `
You are a professional sports event designer.
Create a short invitation card text for:
Title: ${title}
Sport: ${sport}
Date: ${event_date}
Groups/Teams: ${groups_count}
Trophy: ${trophy || "Official Trophy"}
Description: ${description || ""}

Return JSON only:
{
  "headline": "...",
  "subline": "...",
  "details": ["...","..."],
  "stylePrompt": "prompt for generating a poster image (colorful, professional, with sport background)"
}
`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const geminiData = await geminiResp.json();
    const textOut =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let cardJSON;
    try {
      cardJSON = JSON.parse(textOut);
    } catch {
      cardJSON = {
        headline: title,
        subline: `${sport} Tournament`,
        details: [`Date: ${event_date}`, `Groups: ${groups_count}`],
        stylePrompt: "colorful professional sports tournament invitation poster"
      };
    }

    res.json({
      event: eventRow,
      card: cardJSON
    });
  } catch (err) {
    console.error("event create error", err);
    res.status(500).json({ error: "Failed to create event" });
  } finally {
    try { if (pool) await pool.close(); } catch {}
  }
});

// -------------------- LIST EVENTS --------------------
router.get("/list", async (_req, res) => {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const r = await pool.request().query(`
      SELECT * FROM SportEvents ORDER BY created_at DESC
    `);
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load events" });
  } finally {
    try { if (pool) await pool.close(); } catch {}
  }
});

// -------------------- GENERATE REAL AI IMAGE (Imagen / Vertex) --------------------
// POST /api/events/generate-image
router.post("/generate-image", async (req, res) => {
  try {
    const {
      title, sport, event_date, groups_count, trophy, description, stylePrompt
    } = req.body;

    const projectId = process.env.GCP_PROJECT_ID;
    const region = process.env.GCP_REGION || "us-central1";
    const model = process.env.IMAGEN_MODEL || "imagen-3.0-generate-001";

    if (!projectId) {
      return res.status(500).json({ error: "GCP_PROJECT_ID missing in .env" });
    }

    // Build final prompt
    const basePrompt = `
Design a professional, colorful sports tournament invitation poster.
Sport: ${sport}
Event title: ${title}
Date: ${event_date}
Teams/Groups: ${groups_count}
Trophy: ${trophy || "Official Trophy"}
Extra description: ${description || ""}
Style: modern, vibrant, high-quality, sport-themed background, dynamic lighting, clean typography, poster layout.
`;

    const finalPrompt = stylePrompt
      ? `${basePrompt}\nExtra style notes: ${stylePrompt}`
      : basePrompt;

    // Get Google access token (Service Account via GOOGLE_APPLICATION_CREDENTIALS)
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const endpoint =
      `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict`;

    const body = {
      instances: [{ prompt: finalPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult"
      }
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token || token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("Imagen error:", data);
      return res.status(500).json({ error: "Imagen API failed", details: data });
    }

    const b64 =
      data?.predictions?.[0]?.bytesBase64Encoded ||
      data?.predictions?.[0]?.image?.bytesBase64Encoded;

    if (!b64) {
      return res.status(500).json({ error: "No image returned from Imagen" });
    }

    res.json({ image_base64: b64 });
  } catch (err) {
    console.error("generate-image error", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

module.exports = router;
