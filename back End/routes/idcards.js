// Back_end/routes/idcards.js
const express = require("express");
const sql = require("mssql");
const { getDatabase } = require("../config/database");

const router = express.Router();

/* ------------ helpers ------------ */
function pad(n, len = 6) {
  const s = String(n);
  return s.length >= len ? s : "0".repeat(len - s.length) + s;
}
function makeSubId(role, id) {
  // SZ-M-000001  /  SZ-C-000001
  const prefix = role === "coach" ? "SZ-C-" : "SZ-M-";
  return `${prefix}${pad(id, 6)}`;
}
function randomToken(len = 48) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * Base URL used inside the QR code.
 * We use your LAN IP so the phone can reach the backend.
 */
const PORT = process.env.PORT || 5000;

// ✅ YOUR LAPTOP IP from ipconfig (NOT the gateway)



const LOCAL_IP = "10.1.1.53";
//const LOCAL_IP = '172.20.10.9';



const DEFAULT_BASE_URL = `http://${LOCAL_IP}:${PORT}`;

/* ------------ sanity / health ------------ */
router.get("/", (_req, res) => {
  res.json({ ok: true, service: "idcards" });
});

/* =============================================================================
   POST /api/idcards/generate
   Body:
     - role: "member" | "coach"  (required)
     - MEMBER path:
          either member_id (preferred)  OR subscription_id (will lookup member_id)
          optional: color, template
     - COACH path:
          coach_id (required)
          optional: color, template
============================================================================= */
router.post("/generate", async (req, res) => {
  const { role, member_id, subscription_id, coach_id } = req.body || {};
  const color = req.body?.color || null;
  const template = req.body?.template || "verticalA";

  let pool;
  try {
    pool = await getDatabase();

    /* ---------------- MEMBER CARD ---------------- */
    if (role === "member") {
      let memberId = Number(member_id) || null;

      // Allow generation via subscription_id → member_id
      if (!memberId && subscription_id != null) {
        const subq = await pool
          .request()
          .input("sid", sql.Int, Number(subscription_id))
          .query(
            `SELECT TOP 1 member_id FROM dbo.GymSubscriptions WHERE subscription_id = @sid`
          );
        memberId = subq.recordset[0]?.member_id || null;
      }

      if (!memberId) {
        return res.status(400).json({
          error:
            "member_id (or subscription_id) is required for role=member",
        });
      }

      // Fetch member core fields
      const m = await pool
        .request()
        .input("mid", sql.Int, memberId)
        .query(`
          SELECT TOP 1 
            member_id,
            full_name,
            birth_date AS dob,
            height_cm,
            photo_url
          FROM dbo.GymMembers
          WHERE member_id = @mid
        `);

      const member = m.recordset[0];
      if (!member)
        return res.status(404).json({ error: "Member not found" });

      const sub_id = makeSubId("member", member.member_id);
      const qr_token = randomToken(48);

      const ins = await pool
        .request()
        .input("role", sql.NVarChar(20), "member")
        .input("subject_id", sql.Int, member.member_id)
        .input("sub_id", sql.NVarChar(50), sub_id)
        .input("full_name", sql.NVarChar(150), member.full_name)
        .input("dob", sql.Date, member.dob || null)
        .input(
          "height_cm",
          sql.Int,
          member.height_cm == null ? null : Number(member.height_cm)
        )
        .input("photo_url", sql.NVarChar(500), member.photo_url || null)
        .input("color", sql.NVarChar(20), color)
        .input("template", sql.NVarChar(30), template)
        .input("qr_token", sql.NVarChar(64), qr_token)
        .query(`
          INSERT INTO dbo.GymIdCards
            (role, subject_id, sub_id, full_name, dob, height_cm, photo_url, color, template, qr_token, created_at)
          OUTPUT INSERTED.*
          VALUES (@role, @subject_id, @sub_id, @full_name, @dob, @height_cm, @photo_url, @color, @template, @qr_token, SYSDATETIME())
        `);

      return res.json({ card: ins.recordset[0] });
    }

    /* ---------------- COACH CARD ---------------- */
    if (role === "coach") {
      if (!coach_id)
        return res
          .status(400)
          .json({ error: "coach_id is required for role=coach" });
      const cid = Number(coach_id);

      // Detect the actual coach table name (GymCoaches vs Coaches)
      const tRes = await pool.request().query(`
          SELECT TOP 1 name
          FROM sys.objects
          WHERE type = 'U' AND name IN ('GymCoaches','Coaches')
          ORDER BY CASE WHEN name='GymCoaches' THEN 0 ELSE 1 END
        `);
      const coachTable = tRes.recordset[0]?.name;
      if (!coachTable) {
        return res.status(500).json({
          error:
            "Coaches table not found (expected GymCoaches or Coaches)",
        });
      }

      // Pull only fields we’re sure exist
      const cq = await pool
        .request()
        .input("cid", sql.Int, cid)
        .query(`
          SELECT TOP 1 coach_id, full_name
          FROM dbo.${coachTable}
          WHERE coach_id = @cid
        `);

      const coach = cq.recordset[0];
      if (!coach)
        return res.status(404).json({ error: "Coach not found" });

      const sub_id = makeSubId("coach", coach.coach_id);
      const qr_token = randomToken(48);

      const ins = await pool
        .request()
        .input("role", sql.NVarChar(20), "coach")
        .input("subject_id", sql.Int, coach.coach_id)
        .input("sub_id", sql.NVarChar(50), sub_id)
        .input("full_name", sql.NVarChar(150), coach.full_name)
        .input("dob", sql.Date, null)
        .input("height_cm", sql.Int, null)
        .input("photo_url", sql.NVarChar(500), null)
        .input("color", sql.NVarChar(20), color)
        .input(
          "template",
          sql.NVarChar(30),
          template || "verticalB"
        )
        .input("qr_token", sql.NVarChar(64), qr_token)
        .query(`
          INSERT INTO dbo.GymIdCards
            (role, subject_id, sub_id, full_name, dob, height_cm, photo_url, color, template, qr_token, created_at)
          OUTPUT INSERTED.*
          VALUES (@role, @subject_id, @sub_id, @full_name, @dob, @height_cm, @photo_url, @color, @template, @qr_token, SYSDATETIME())
        `);

      return res.json({ card: ins.recordset[0] });
    }

    return res
      .status(400)
      .json({ error: 'Unsupported role (use "member" or "coach")' });
  } catch (err) {
    console.error("ID card generation failed:", err);
    return res.status(500).json({ error: "Failed to generate ID card" });
  }
});

/* ---------- simple fetch by id ---------- */
router.get("/:id(\\d+)", async (req, res) => {
  try {
    const pool = await getDatabase();
    const r = await pool
      .request()
      .input("id", sql.Int, Number(req.params.id))
      .query(`SELECT * FROM dbo.GymIdCards WHERE idcard_id = @id`);
    if (r.recordset.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ card: r.recordset[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------- Public view by token (for QR scans) ---------- */
router.get("/public/:token", async (req, res) => {
  try {
    const pool = await getDatabase();
    const r = await pool
      .request()
      .input("t", sql.NVarChar(64), req.params.token)
      .query(
        `SELECT TOP 1 * FROM dbo.GymIdCards WHERE qr_token = @t`
      );

    const c = r.recordset[0];
    if (!c) return res.status(404).send("Not found");

    // Final base URL used inside the QR code
    const baseUrl = DEFAULT_BASE_URL; // http://10.1.1.53:5000

    const cardUrl = `${baseUrl}/api/idcards/public/${encodeURIComponent(
      req.params.token
    )}`;

    const created = new Date(c.created_at);

    // ✅ Safe photo src like frontend
    const rawPhoto = c.photo_url ? String(c.photo_url).trim() : "";
    const photoSrc =
      rawPhoto && rawPhoto !== ""
        ? rawPhoto.startsWith("http") || rawPhoto.startsWith("data:")
          ? rawPhoto
          : `${baseUrl}/${rawPhoto.replace(/^\/+/, "")}`
        : null;

    res.send(`
      <html>
        <head>
          <title>Sport Zone ID</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background:#f3f5fb;
              margin:0;
              padding:24px;
            }
            .card {
              max-width:900px;
              margin:0 auto;
              background:#fff;
              border-radius:24px;
              padding:32px;
              box-shadow:0 18px 45px rgba(15,23,42,0.18);
              display:flex;
              flex-wrap:wrap;
              gap:24px;
            }
            .left { flex:1 1 260px; }
            .right {
              flex:0 0 260px;
              text-align:center;
              display:flex;
              flex-direction:column;
              justify-content:center;
              gap:12px;
            }
            .avatar {
              width:120px;
              height:120px;
              border-radius:50%;
              overflow:hidden;
              background:#f1f5f9;
              display:flex;
              align-items:center;
              justify-content:center;
              margin-bottom:16px;
            }
            .avatar img { width:100%; height:100%; object-fit:cover; }
            .pill {
              display:inline-block;
              padding:4px 14px;
              border-radius:999px;
              background:#0f766e;
              color:#fff;
              font-size:13px;
              font-weight:600;
            }
            h1 {
              margin:0 0 4px;
              font-size:28px;
            }
            .subtitle {
              text-transform:uppercase;
              letter-spacing:0.12em;
              font-size:12px;
              color:#64748b;
            }
            dl {
              margin:16px 0 0;
            }
            dt {
              font-weight:600;
              margin-top:4px;
            }
            dd {
              margin:0 0 6px;
            }
            .qr {
              background:#f8fafc;
              border-radius:20px;
              padding:16px;
              display:inline-block;
            }
            .small {
              font-size:12px;
              color:#64748b;
            }
            @media (max-width:700px) {
              .card { padding:20px; }
              .right { align-items:center; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="left">
              <div style="display:flex;gap:20px;align-items:center;">
                <div class="avatar">
                  ${
                    photoSrc
                      ? `<img src="${photoSrc}" alt="${c.full_name}" />`
                      : `<img src="https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(
                          c.full_name || "member"
                        )}" alt="avatar" />`
                  }
                </div>
                <div>
                  <h1>${c.full_name}</h1>
                  <div class="subtitle">SPORT ZONE ID (${String(
                    c.role || ""
                  ).toUpperCase()})</div>
                  <div style="margin-top:6px;">
                    <span class="pill">${c.sub_id}</span>
                  </div>
                </div>
              </div>

              <dl>
                <dt>Template:</dt>
                <dd>${c.template || "-"}</dd>
                <dt>Color:</dt>
                <dd>${c.color || "-"}</dd>
                <dt>DOB:</dt>
                <dd>${
                  c.dob ? new Date(c.dob).toLocaleDateString() : "-"
                }</dd>
                <dt>Height:</dt>
                <dd>${
                  c.height_cm != null ? c.height_cm + " cm" : "-"
                }</dd>
              </dl>

              <p class="small" style="margin-top:16px;">
                Created: ${created.toLocaleString()}
              </p>
            </div>

            <div class="right">
              <div style="font-weight:600;color:#1f2933;">Scan to verify</div>
              <div class="qr">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    cardUrl
                  )}"
                  alt="QR code"
                  style="display:block;"
                />
              </div>
              <div class="small">
                URL:<br/>
                ${cardUrl}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (e) {
    console.error("public token error:", e);
    res.status(500).send("Server error");
  }
});

module.exports = router;
