
const express = require("express");
const sql = require("mssql");
const { getDatabase } = require("../config/database");
const axios = require("axios");
const { sendMail } = require("./mailer");
const PDFDocument = require("pdfkit");

const router = express.Router();

/* -----------------------------------------------------------
   GET /api/gym/subscriptions   (Active + Pending)
------------------------------------------------------------ */
router.get("/subscriptions", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT
        subscription_id,
        customer_id,
        member_id,
        full_name,
        phone,
        coach_id,
        plan_type,
        CONVERT(VARCHAR(10), start_date, 23) AS start_date,
        CONVERT(VARCHAR(10), end_date, 23)   AS end_date,
        price,
        status,
        created_at
      FROM dbo.GymSubscriptions
      ORDER BY subscription_id DESC;
    `);
    res.json({ subscriptions: result.recordset });
  } catch (err) {
    console.error("❌ Gym list error:", err);
    res.status(500).json({ error: "Failed to load subscriptions" });
  }
});

/* -----------------------------------------------------------
   GET /api/gym/subscriptions/names   (dropdown helper)
------------------------------------------------------------ */
router.get("/subscriptions/names", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT
        subscription_id,
        customer_id,
        member_id,
        full_name,
        phone,
        plan_type,
        CONVERT(VARCHAR(10), start_date, 23) AS start_date,
        CONVERT(VARCHAR(10), end_date, 23)   AS end_date
      FROM dbo.GymSubscriptions
      ORDER BY subscription_id DESC;
    `);

    res.json({ subscriptions: result.recordset });
  } catch (err) {
    console.error("❌ names list error:", err);
    res.status(500).json({ error: "Failed to load names" });
  }
});

/* -----------------------------------------------------------
   Helper: create GymMember
------------------------------------------------------------ */
async function createMember(pool, payload) {
  const {
    full_name,
    phone,
    email,
    gender,
    birth_date,
    height_cm,
    weight_kg,
    photo_url,
    notes,
    status = "Active",
  } = payload;

  const rs = await pool
    .request()
    .input("full_name", sql.NVarChar(150), String(full_name))
    .input("phone", sql.NVarChar(20), phone || null)
    .input("email", sql.NVarChar(120), email || null)
    .input("gender", sql.NVarChar(20), gender || null)
    .input("birth_date", sql.Date, birth_date || null)
    .input("height_cm", sql.Int, height_cm ?? null)
    .input("weight_kg", sql.Decimal(5, 2), weight_kg ?? null)
    .input("photo_url", sql.NVarChar(400), photo_url || null)
    .input("notes", sql.NVarChar(sql.MAX), notes || null)
    .input("status", sql.NVarChar(50), String(status))
    .query(`
      INSERT INTO dbo.GymMembers
        (full_name, phone, email, gender, birth_date, height_cm,
         weight_kg, photo_url, notes, status)
      OUTPUT INSERTED.member_id, INSERTED.full_name, INSERTED.phone
      VALUES (@full_name, @phone, @email, @gender, @birth_date,
              @height_cm, @weight_kg, @photo_url, @notes, @status);
    `);

  return rs.recordset[0];
}

////////////////////

function cleanJsonText(text) {
  let t = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // try to cut only the JSON part if model adds extra text
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) t = t.slice(first, last + 1);

  return t;
}
//////
router.get("/ai/report", async (req, res) => {
  try {
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();
    if (!from || !to) {
      return res.status(400).json({ error: "from and to are required (YYYY-MM-DD)" });
    }

    const pool = await getDatabase();

    // 1) Attendance counts in range (GymAttendance)
    const attendanceRes = await pool.request()
      .input("from", sql.Date, from)
      .input("to", sql.Date, to)
      .query(`
        SELECT a.customer_id, COUNT(*) AS attendance_count
        FROM dbo.GymAttendance a
        WHERE a.attended_at >= @from AND a.attended_at < DATEADD(day, 1, @to)
        GROUP BY a.customer_id
      `);

    // 2) Subscriptions for names + plan
    const subsRes = await pool.request().query(`
      SELECT customer_id, member_id, full_name, phone, plan_type, status
      FROM dbo.GymSubscriptions
    `);

    const subsByCustomer = new Map((subsRes.recordset || []).map(s => [String(s.customer_id), s]));

    let rows = (attendanceRes.recordset || []).map(r => {
      const sub = subsByCustomer.get(String(r.customer_id)) || {};
      return {
        customer_id: r.customer_id,
        member_id: sub.member_id ?? null,
        full_name: sub.full_name || "Unknown",
        phone: sub.phone || null,
        plan_type: sub.plan_type || null,
        status: sub.status || null,
        attendance_count: Number(r.attendance_count || 0),
      };
    });

    // Sort by attendance desc
    rows.sort((a, b) => b.attendance_count - a.attendance_count);

    // Add rank (for table)
    rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));

    const top10 = rows.slice(0, 10);
    const bottom10 = rows.slice(-10).slice().reverse();

    // 3) Weight change (best loss) from GymProgressLogs (optional)
    const weightRes = await pool.request()
      .input("from", sql.Date, from)
      .input("to", sql.Date, to)
      .query(`
        ;WITH logs AS (
          SELECT member_id, log_date, weight_kg,
                 ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY log_date ASC) AS rn_asc,
                 ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY log_date DESC) AS rn_desc
          FROM dbo.GymProgressLogs
          WHERE log_date >= @from AND log_date < DATEADD(day, 1, @to)
            AND weight_kg IS NOT NULL
        )
        SELECT
          a.member_id,
          MIN(CASE WHEN rn_asc = 1 THEN weight_kg END) AS start_weight,
          MIN(CASE WHEN rn_desc = 1 THEN weight_kg END) AS end_weight
        FROM logs a
        GROUP BY a.member_id
      `);

    const weightRows = (weightRes.recordset || [])
      .map(w => {
        const start = Number(w.start_weight);
        const end = Number(w.end_weight);
        const change = +(end - start).toFixed(2); // negative = loss
        return { member_id: w.member_id, start_weight: start, end_weight: end, weight_change: change };
      })
      .filter(x => Number.isFinite(x.weight_change))
      .sort((a, b) => a.weight_change - b.weight_change); // most loss first (more negative)

    const bestLoss = weightRows.slice(0, 10);

    // 4) Build AI narrative using Groq (optional)
    const GRQ_KEY = process.env.GRQ_ANYLZER_KEY;
    const GRQ_MODEL = process.env.GRQ_ANYLZER_MODEL || "llama-3.1-8b-instant";

    let aiNarrative = null;
    if (GRQ_KEY) {
      const aiPrompt = `
You are writing a professional gym management report.
Write a detailed but readable report in plain text (NOT JSON, NOT markdown).
Use short paragraphs and bullet points.
Include:
- Executive summary
- Attendance highlights (top, bottom)
- Membership / plan observations if possible
- Progress / transformation highlights (weight change)
- Action plan (3-6 concrete actions)

Data (JSON):
${JSON.stringify({ from, to, top10, bottom10, bestLoss, total_members: rows.length })}
`.trim();

      try {
        const aiRes = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: GRQ_MODEL,
            messages: [{ role: "user", content: aiPrompt }],
            temperature: 0.35,
            max_tokens: 1200
          },
          {
            headers: { Authorization: `Bearer ${GRQ_KEY}`, "Content-Type": "application/json" },
            timeout: 60000
          }
        );

        aiNarrative = aiRes.data?.choices?.[0]?.message?.content?.trim() || null;
      } catch (e) {
        console.log("AI narrative failed (continuing without AI):", e?.response?.data || e?.message);
        aiNarrative = null;
      }
    }

    // 5) Chart image (QuickChart) - attendance top10
    const labels = top10.map(x => x.full_name);
    const data = top10.map(x => x.attendance_count);
    const chartConfig = {
      type: "bar",
      data: { labels, datasets: [{ label: "Attendance Count", data }] },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } } }
      }
    };
    const chartUrl = "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig));

    let chartImg = null;
    try {
      const imgRes = await axios.get(chartUrl, { responseType: "arraybuffer", timeout: 60000 });
      chartImg = Buffer.from(imgRes.data);
    } catch (e) {
      chartImg = null;
    }

    // 6) Build PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="gym_report_${from}_to_${to}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Gym Performance Report", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(12).text(`Range: ${from} → ${to}`, { align: "center" });
    doc.moveDown(1);

    // AI narrative
    if (aiNarrative) {
      doc.fontSize(14).text("AI Manager Summary");
      doc.moveDown(0.4);
      doc.fontSize(11).text(aiNarrative, { lineGap: 2 });
      doc.moveDown(1);
    }

    // Full ranking (first page, 25 rows max to avoid overflow)
    doc.fontSize(14).text("Attendance Ranking (Descending)");
    doc.moveDown(0.5);

    const showRows = rows.slice(0, 25);
    showRows.forEach((m) => {
      doc.fontSize(10).text(
        `#${m.rank}  ${m.full_name} (Customer: ${m.customer_id}${m.member_id ? `, Member: ${m.member_id}` : ""})  —  ${m.attendance_count} visits  —  ${m.plan_type || "No Plan"}  ${m.status ? `(${m.status})` : ""}`
      );
    });

    if (rows.length > showRows.length) {
      doc.moveDown(0.4);
      doc.fontSize(10).text(`... and ${rows.length - showRows.length} more members (see app table).`);
    }

    doc.addPage();

    // Top / Bottom
    doc.fontSize(14).text("Top Attendance (Top 10)");
    doc.moveDown(0.5);
    top10.forEach((m, i) => {
      doc.fontSize(11).text(
        `${i + 1}. ${m.full_name} — ${m.attendance_count} visits — ${m.plan_type || "No Plan"} ${m.status ? `(${m.status})` : ""}`
      );
    });

    doc.moveDown(1);
    doc.fontSize(14).text("Lowest Attendance (Bottom 10)");
    doc.moveDown(0.5);
    bottom10.forEach((m, i) => {
      doc.fontSize(11).text(
        `${i + 1}. ${m.full_name} — ${m.attendance_count} visits — ${m.plan_type || "No Plan"} ${m.status ? `(${m.status})` : ""}`
      );
    });

    doc.moveDown(1);
    doc.fontSize(14).text("Best Weight Transformation (Most Loss)");
    doc.moveDown(0.5);

    if (bestLoss.length === 0) {
      doc.fontSize(11).text("No weight logs found in this range.");
    } else {
      bestLoss.forEach((w, i) => {
        doc.fontSize(11).text(
          `${i + 1}. Member: ${w.member_id} — ${w.start_weight}kg → ${w.end_weight}kg (change: ${w.weight_change}kg)`
        );
      });
    }

    // Charts
    doc.addPage();
    doc.fontSize(16).text("Charts");
    doc.moveDown(0.5);
    doc.fontSize(12).text("Top 10 Attendance (Bar Chart)");
    doc.moveDown(0.5);

    if (chartImg) {
      // Fit the image on the page
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc.image(chartImg, doc.page.margins.left, doc.y, { fit: [pageWidth, 380], align: "center" });
      doc.moveDown(1);
      doc.fontSize(10).text("Chart generated automatically.");
    } else {
      doc.fontSize(10).text("Chart image could not be generated. Link:");
      doc.fontSize(9).fillColor("blue").text(chartUrl);
      doc.fillColor("black");
    }

    doc.end();
  } catch (err) {
    console.error("❌ /ai/report error:", err?.response?.data || err);
    return res.status(500).json({ error: "Failed to generate PDF report" });
  }
});


/* -----------------------------------------------------------
   ✅ Extract first valid JSON object from a string
   FIXED: brace-balancing so we don't cut wrong JSON
------------------------------------------------------------ */
function extractJsonObject(text) {
  if (!text) return null;

  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) {
      return text.slice(start, i + 1).trim();
    }
  }
  return null; // unbalanced / truncated
}

/* -----------------------------------------------------------
   Helper: update GymMember
------------------------------------------------------------ */
async function updateMember(pool, memberId, payload) {
  const {
    full_name,
    phone,
    email,
    gender,
    birth_date,
    height_cm,
    weight_kg,
    photo_url,
    notes,
    status = "Active",
  } = payload;

  const rs = await pool
    .request()
    .input("id", sql.Int, memberId)
    .input("full_name", sql.NVarChar(150), String(full_name))
    .input("phone", sql.NVarChar(20), phone || null)
    .input("email", sql.NVarChar(120), email || null)
    .input("gender", sql.NVarChar(20), gender || null)
    .input("birth_date", sql.Date, birth_date || null)
    .input("height_cm", sql.Int, height_cm ?? null)
    .input("weight_kg", sql.Decimal(5, 2), weight_kg ?? null)
    .input("photo_url", sql.NVarChar(400), photo_url || null)
    .input("notes", sql.NVarChar(sql.MAX), notes || null)
    .input("status", sql.NVarChar(50), String(status))
    .query(`
      UPDATE dbo.GymMembers
         SET full_name = @full_name,
             phone     = @phone,
             email     = @email,
             gender    = @gender,
             birth_date= @birth_date,
             height_cm = @height_cm,
             weight_kg = @weight_kg,
             photo_url = @photo_url,
             notes     = @notes,
             status    = @status
      OUTPUT INSERTED.member_id, INSERTED.full_name, INSERTED.phone
       WHERE member_id = @id;
    `);

  return rs.recordset[0];
}
////////////////////////////////////////////////////////////////
async function getMemberIdByCustomerId(pool, customerId) {
  const r = await pool.request()
    .input("customer_id", sql.Int, customerId)
    .query(`
      SELECT TOP 1 member_id
      FROM dbo.GymSubscriptions
      WHERE customer_id = @customer_id
        AND member_id IS NOT NULL
      ORDER BY subscription_id DESC;
    `);

  return r.recordset?.[0]?.member_id || null;
}

/* -----------------------------------------------------------
   MOBILE: get last subscription for customer
------------------------------------------------------------ */
router.get("/subscriptions/customer/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const pool = await getDatabase();

    const result = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT TOP 1
          subscription_id,
          customer_id,
          member_id,
          full_name,
          phone,
          coach_id,
          plan_type,
          CONVERT(VARCHAR(10), start_date, 23) AS start_date,
          CONVERT(VARCHAR(10), end_date, 23)   AS end_date,
          price,
          status,
          created_at
        FROM dbo.GymSubscriptions
        WHERE customer_id = @cid
        ORDER BY created_at DESC;
      `);

    if (result.recordset.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: result.recordset[0] });
  } catch (err) {
    console.error("get customer subscription error:", err);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

/* -----------------------------------------------------------
   list pending applications
------------------------------------------------------------ */
router.get("/subscriptions/pending", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT
        subscription_id,
        customer_id,
        member_id,
        full_name,
        phone,
        coach_id,
        plan_type,
        CONVERT(VARCHAR(10), start_date, 23) AS start_date,
        CONVERT(VARCHAR(10), end_date, 23)   AS end_date,
        price,
        status,
        created_at
      FROM dbo.GymSubscriptions
      WHERE status='Pending'
      ORDER BY created_at DESC;
    `);
    res.json({ subscriptions: result.recordset });
  } catch (err) {
    console.error("get pending error:", err);
    res.status(500).json({ error: "Failed to fetch pending subscriptions" });
  }
});

/* -----------------------------------------------------------
   MOBILE APPLICATION REQUEST (creates Pending)
------------------------------------------------------------ */

router.post("/subscribers/send-reminder", async (req, res) => {
  try {
    const { customer_id, message } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, error: "customer_id is required" });
    }

    const pool = await getDatabase();

    // Get push token
    const tokenResult = await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .query(`SELECT TOP 1 expo_push_token FROM dbo.GymPushTokens WHERE customer_id=@customer_id`);

    const expoToken = tokenResult.recordset?.[0]?.expo_push_token;
    if (!expoToken) {
      return res.status(400).json({
        success: false,
        error: "No push token. Customer must open the mobile app once."
      });
    }

    // Send via Expo
    const payload = {
      to: expoToken,
      sound: "default",
      title: "🏋️ Gym Reminder",
      body: message || "Don't forget your gym session today! 💪",
      data: { type: "gym_admin_reminder", customer_id }
    };

    const expoRes = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    return res.json({
      success: true,
      message: "Push sent",
      expoResponse: expoRes.data
    });

  } catch (err) {
    console.error("send-reminder error:", err);
    return res.status(500).json({ success: false, error: "Failed to send reminder" });
  }
});

router.post("/subscriptions/request", async (req, res) => {
  try {
    const {
      customer_id,
      coach_id,
      plan_type,
      start_date,
      end_date,
      price = 0,

      full_name,
      phone,
      email,
      gender,
      birth_date,
      height_cm,
      weight_kg,
      photo_url,
      notes,
    } = req.body;

    if (!full_name || !plan_type || !start_date || !end_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const pool = await getDatabase();

    const member = await createMember(pool, {
      full_name,
      phone,
      email,
      gender,
      birth_date,
      height_cm,
      weight_kg,
      photo_url,
      notes,
      status: "Active",
    });

    const result = await pool
      .request()
      .input("customer_id", sql.Int, customer_id || null)
      .input("member_id", sql.Int, member.member_id)
      .input("full_name", sql.NVarChar(150), member.full_name)
      .input("phone", sql.NVarChar(20), phone || null)
      .input("coach_id", sql.Int, coach_id || null)
      .input("plan_type", sql.NVarChar(100), String(plan_type))
      .input("start_date", sql.Date, start_date)
      .input("end_date", sql.Date, end_date)
      .input("price", sql.Decimal(10, 2), Number(price) || 0)
      .input("status", sql.NVarChar(50), "Pending")
      .query(`
        INSERT INTO dbo.GymSubscriptions
          (customer_id, member_id, full_name, phone, coach_id, plan_type,
           start_date, end_date, price, status)
        OUTPUT
          INSERTED.subscription_id,
          INSERTED.customer_id,
          INSERTED.member_id,
          INSERTED.full_name,
          INSERTED.phone,
          INSERTED.coach_id,
          INSERTED.plan_type,
          CONVERT(VARCHAR(10), INSERTED.start_date, 23) AS start_date,
          CONVERT(VARCHAR(10), INSERTED.end_date, 23)   AS end_date,
          INSERTED.price,
          INSERTED.status,
          INSERTED.created_at
        VALUES (@customer_id, @member_id, @full_name, @phone, @coach_id,
                @plan_type, @start_date, @end_date, @price, @status);
      `);
       try {
  const custRes = await pool.request()
    .input("cid", sql.Int, customer_id)
    .query(`SELECT email, name FROM dbo.Customers WHERE customer_id=@cid`);

  const customerEmail = custRes.recordset[0]?.email;
  const customerName = custRes.recordset[0]?.name || full_name || "Customer";

  if (customerEmail) {
    await sendMail(
      customerEmail,
      "✅ Gym Subscription Request Received",
      `
      <h3>Gym Subscription Request</h3>
      <p>Hello ${customerName},</p>
      <p>Your subscription request was received.</p>
      <p><b>Plan:</b> ${plan_type}</p>
      <p><b>Start:</b> ${start_date}</p>
      <p><b>End:</b> ${end_date}</p>
      <p><b>Status:</b> Pending</p>
      `
    );
  }
} catch (mailErr) {
  console.log("Gym mail error:", mailErr);
}

    return res.status(201).json({
      message: "Application sent successfully",
      subscription: result.recordset[0],
      member,
    });
  } catch (err) {
    console.error("❌ request subscription error:", err);
    return res.status(500).json({
      error: "Failed to create pending subscription",
    });
  }
});

/* -----------------------------------------------------------
   WEB ADMIN: create Active directly
------------------------------------------------------------ */
router.post("/subscriptions", async (req, res) => {
  try {
    const {
      customer_id,
      coach_id,
      plan_type,
      start_date,
      end_date,
      price = 0,
      status,
      full_name,
      phone,
      email,
      gender,
      birth_date,
      height_cm,
      weight_kg,
      photo_url,
      notes,
    } = req.body;

    if (!full_name || !plan_type || !start_date || !end_date || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const pool = await getDatabase();

    const member = await createMember(pool, {
      full_name,
      phone,
      email,
      gender,
      birth_date,
      height_cm,
      weight_kg,
      photo_url,
      notes,
      status: "Active",
    });

    const result = await pool
      .request()
      .input("customer_id", sql.Int, customer_id || null)
      .input("member_id", sql.Int, member.member_id)
      .input("full_name", sql.NVarChar(150), member.full_name)
      .input("phone", sql.NVarChar(20), phone || null)
      .input("coach_id", sql.Int, coach_id || null)
      .input("plan_type", sql.NVarChar(100), String(plan_type))
      .input("start_date", sql.Date, start_date)
      .input("end_date", sql.Date, end_date)
      .input("price", sql.Decimal(10, 2), Number(price) || 0)
      .input("status", sql.NVarChar(50), String(status))
      .query(`
        INSERT INTO dbo.GymSubscriptions
          (customer_id, member_id, full_name, phone, coach_id, plan_type,
           start_date, end_date, price, status)
        OUTPUT INSERTED.*
        VALUES (@customer_id, @member_id, @full_name, @phone, @coach_id,
                @plan_type, @start_date, @end_date, @price, @status);
      `);

    res.status(201).json({ subscription: result.recordset[0], member });
  } catch (err) {
    console.error(
      "❌ Gym create error:",
      err?.originalError?.info?.message || err.message
    );
    res.status(500).json({ error: "Failed to add subscription" });
  }
});

/* -----------------------------------------------------------
   PUT /api/gym/subscriptions/:id
------------------------------------------------------------ */
router.put("/subscriptions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      customer_id,
      coach_id,
      plan_type,
      start_date,
      end_date,
      price = 0,
      status,
      full_name,
      phone,
      email,
      gender,
      birth_date,
      height_cm,
      weight_kg,
      photo_url,
      notes,
    } = req.body;

    const pool = await getDatabase();

    const info = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        `SELECT TOP 1 member_id FROM dbo.GymSubscriptions WHERE subscription_id=@id;`
      );

    let memberId = info.recordset[0]?.member_id || null;
    let member;

    if (memberId) {
      member = await updateMember(pool, memberId, {
        full_name,
        phone,
        email,
        gender,
        birth_date,
        height_cm,
        weight_kg,
        photo_url,
        notes,
        status: "Active",
      });
    } else {
      member = await createMember(pool, {
        full_name,
        phone,
        email,
        gender,
        birth_date,
        height_cm,
        weight_kg,
        photo_url,
        notes,
        status: "Active",
      });
      memberId = member.member_id;
    }

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("customer_id", sql.Int, customer_id || null)
      .input("member_id", sql.Int, memberId)
      .input("full_name", sql.NVarChar(150), member.full_name)
      .input("phone", sql.NVarChar(20), phone || null)
      .input("coach_id", sql.Int, coach_id || null)
      .input("plan_type", sql.NVarChar(100), String(plan_type))
      .input("start_date", sql.Date, start_date)
      .input("end_date", sql.Date, end_date)
      .input("price", sql.Decimal(10, 2), Number(price) || 0)
      .input("status", sql.NVarChar(50), String(status))
      .query(`
        UPDATE dbo.GymSubscriptions
           SET customer_id=@customer_id,
               member_id=@member_id,
               full_name=@full_name,
               phone=@phone,
               coach_id=@coach_id,
               plan_type=@plan_type,
               start_date=@start_date,
               end_date=@end_date,
               price=@price,
               status=@status
        OUTPUT INSERTED.*
        WHERE subscription_id=@id;
      `);

    res.json({ subscription: result.recordset[0], member });
  } catch (err) {
    console.error(
      "❌ Gym update error:",
      err?.originalError?.info?.message || err.message
    );
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

/* -----------------------------------------------------------
   PATCH approve pending -> active
------------------------------------------------------------ */
router.patch("/subscriptions/:id/approve", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = await getDatabase();

    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE dbo.GymSubscriptions
        SET status='Active'
        WHERE subscription_id=@id;
      `);

    res.json({ message: "Subscription approved successfully" });
  } catch (err) {
    console.error("approve error:", err);
    res.status(500).json({ error: "Failed to approve subscription" });
  }
});

/* -----------------------------------------------------------
   DELETE /api/gym/subscriptions/:id
------------------------------------------------------------ */
router.delete("/subscriptions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = await getDatabase();

    const info = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT TOP 1 member_id
        FROM dbo.GymSubscriptions
        WHERE subscription_id=@id;
      `);

    const memberId = info.recordset[0]?.member_id || null;

    await pool
      .request()
      .input("sid", sql.Int, id)
      .query(`DELETE FROM dbo.GymAIPlans WHERE subscription_id=@sid;`);

    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM dbo.GymSubscriptions WHERE subscription_id=@id;`);

    if (memberId) {
      await pool
        .request()
        .input("mid", sql.Int, memberId)
        .query(`
          DELETE FROM dbo.GymIdCards
          WHERE role=N'member' AND subject_id=@mid;

          DELETE FROM dbo.CoachMemberAssignments
          WHERE member_id=@mid;

          DELETE FROM dbo.GymMembers
          WHERE member_id=@mid;
        `);
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(
      "❌ Gym delete error:",
      err?.originalError?.info?.message || err
    );
    res.status(500).json({
      error:
        err?.originalError?.info?.message || "Failed to delete subscription",
    });
  }
});

/* -----------------------------------------------------------
   CUSTOMERS dropdown
------------------------------------------------------------ */
router.get("/customers", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT customer_id, name, phone, email, birth_date, gender, address, photo_url
      FROM Customers
      ORDER BY name;
    `);
    res.json({ customers: result.recordset });
  } catch (err) {
    console.error("get customers error:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

/* ===========================================================
   AI Gym Plan (GROQ)
   POST /api/gym/ai-plan
=========================================================== */
router.post("/ai-plan", async (req, res) => {
  try {
    const {
      full_name, age, weight, height, gender,
      subscription_months, experience_level, goal,
      days_per_week, plan_duration_weeks
    } = req.body;

    if (!age || !weight || !goal || !days_per_week) {
      return res.status(400).json({
        error: "age, weight, goal, days_per_week are required"
      });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: "Missing GROQ_API_KEY in .env"
      });
    }

    const duration = Number(plan_duration_weeks || 4);
    const days = Number(days_per_week);

    // ✅ short + strict JSON prompt to reduce truncation
    const prompt = `
You are a professional fitness coach.
You MUST reply with ONLY valid JSON (no markdown, no explanation).
Keep JSON compact. Avoid long paragraphs.

Rules:
- disclaimer MUST be ONE short sentence (max 12 words).
- notes MUST be short (max 10 words).
- Each day: 6–8 exercises (not more than 8).
- weekly_plan MUST include ALL weeks from 1 to duration_weeks.
- each week MUST include exactly days_per_week days.
- Do NOT add extra keys.
- Return ONLY JSON.

User data:
name=${full_name || "member"}
age=${age}
weight_kg=${weight}
height_cm=${height || "unknown"}
gender=${gender || "unknown"}
subscription_months=${subscription_months || "unknown"}
experience_level=${experience_level || "beginner"}
goal=${goal}
days_per_week=${days}
duration_weeks=${duration}

Return JSON exactly in this schema:
{
  "summary": {
    "goal": "...",
    "experience_level": "...",
    "duration_weeks": number,
    "days_per_week": number
  },
  "weekly_plan": [
    {
      "week": number,
      "days": [
        {
          "day": "Day 1",
          "focus": "Push/Pull/Legs/Cardio/Full Body",
          "exercises": [
            {"name": "...", "sets": number, "reps": "8-12", "rest_sec": number}
          ],
          "notes": "short"
        }
      ]
    }
  ],
  "nutrition_tips": ["tip1","tip2"],
  "disclaimer": "short"
}
`;

    async function callGroq(userPrompt) {
      return axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: GROQ_MODEL,
          messages: [{ role: "user", content: userPrompt }],
          temperature: 0.2,
          max_tokens: 3000
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 60000
        }
      );
    }

    // 1️⃣ first call
    const groqRes1 = await callGroq(prompt);
    let text1 = groqRes1.data?.choices?.[0]?.message?.content || "";

    console.log("Raw AI Response (1):", String(text1).slice(0, 800));

    let cleaned1 = String(text1)
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    cleaned1 = extractJsonObject(cleaned1);

    if (!cleaned1) {
      return res.status(200).json({
        plan: null,
        raw: String(text1).slice(0, 1500),
        warning: "AI returned no JSON object."
      });
    }

    try {
      const planJson1 = JSON.parse(cleaned1);
      return res.json({ plan: planJson1 });
    } catch (e1) {
      console.log("Parse failed (1). Retrying with repair prompt...");
    }

    // 2️⃣ retry
    const repairPrompt = `
Fix the JSON below.
Return ONLY VALID JSON. Do not remove fields, only repair/truncate safely.

Broken JSON:
${cleaned1}
`;

    const groqRes2 = await callGroq(repairPrompt);
    let text2 = groqRes2.data?.choices?.[0]?.message?.content || "";

    console.log("Raw AI Response (2):", String(text2).slice(0, 800));

    let cleaned2 = String(text2)
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    cleaned2 = extractJsonObject(cleaned2);

    // ✅ fallback to first JSON if retry returns text
    if (!cleaned2) {
      try {
        const fallback = JSON.parse(cleaned1);
        return res.json({
          plan: fallback,
          warning: "Used first JSON; retry returned text."
        });
      } catch {
        return res.status(200).json({
          plan: null,
          raw: String(text2).slice(0, 1500),
          warning: "AI returned no JSON object on retry."
        });
      }
    }

    try {
      const planJson2 = JSON.parse(cleaned2);
      return res.json({ plan: planJson2 });
    } catch (e2) {
      // ✅ second fallback to first JSON
      try {
        const fallback = JSON.parse(cleaned1);
        return res.json({
          plan: fallback,
          warning: "Used first JSON; retry JSON broken."
        });
      } catch {
        return res.status(200).json({
          plan: null,
          raw: cleaned2.slice(0, 1500),
          warning: "AI returned broken JSON after retry."
        });
      }
    }
  } catch (err) {
    console.error("❌ Groq AI plan error:", err?.response?.data || err);
    return res.status(500).json({
      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to generate plan"
    });
  }
});

/* ===========================================================
   Save AI Plan
=========================================================== */
router.post("/ai-plans/save", async (req, res) => {
  try {
    const {
      subscription_id,
      member_id,
      full_name,
      age,
      weight,
      height,
      gender,
      experience_level,
      goal,
      days_per_week,
      duration_weeks,
      plan_json,
    } = req.body;

    if (
      !subscription_id ||
      !full_name ||
      !age ||
      !weight ||
      !goal ||
      !plan_json
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields to save plan" });
    }

    const pool = await getDatabase();

    const result = await pool
      .request()
      .input("subscription_id", sql.Int, subscription_id)
      .input("member_id", member_id == null ? null : sql.Int, member_id)
      .input("full_name", sql.NVarChar(150), full_name)
      .input("age", sql.Int, age)
      .input("weight", sql.Decimal(5, 2), weight)
      .input("height", height == null ? null : sql.Decimal(5, 2), height)
      .input("gender", gender == null ? null : sql.NVarChar(10), gender)
      .input("experience_level", sql.NVarChar(20), experience_level)
      .input("goal", sql.NVarChar(20), goal)
      .input("days_per_week", sql.Int, days_per_week)
      .input("duration_weeks", sql.Int, duration_weeks)
      .input("plan_json", sql.NVarChar(sql.MAX), JSON.stringify(plan_json))
      .query(`
        INSERT INTO dbo.GymAIPlans
          (subscription_id, member_id, full_name, age, weight, height, gender,
           experience_level, goal, days_per_week, duration_weeks, plan_json)
        OUTPUT INSERTED.plan_id, INSERTED.created_at
        VALUES
          (@subscription_id, @member_id, @full_name, @age, @weight, @height, @gender,
           @experience_level, @goal, @days_per_week, @duration_weeks, @plan_json);
      `);

    res.status(201).json({ saved: result.recordset[0] });
  } catch (err) {
    console.error("❌ save plan error:", err);
    res.status(500).json({ error: "Failed to save plan" });
  }
});

/* ===========================================================
   List AI Plans
=========================================================== */
router.get("/ai-plans", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT
        plan_id, subscription_id, member_id, full_name,
        age, weight, height, gender, experience_level, goal,
        days_per_week, duration_weeks, plan_json, created_at
      FROM dbo.GymAIPlans
      ORDER BY plan_id DESC;
    `);

    res.json({ plans: result.recordset });
  } catch (err) {
    console.error("❌ list plans error:", err);
    res.status(500).json({ error: "Failed to load plans" });
  }
});


/* ===========================================================
   Get Latest AI Plan For Customer
   GET /api/gym/ai-plans/latest/:customerId
=========================================================== */
router.get("/ai-plans/latest/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) {
      return res.status(400).json({ error: "Invalid customer id" });
    }

    const pool = await getDatabase();

    // We find the latest plan linked to this customer via subscription
    const result = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT TOP 1 P.*
        FROM dbo.GymAIPlans P
        INNER JOIN dbo.GymSubscriptions S
          ON S.subscription_id = P.subscription_id
        WHERE S.customer_id = @cid
        ORDER BY P.plan_id DESC;
      `);

    if (!result.recordset[0]) {
      return res.json({ plan: null });
    }

    const row = result.recordset[0];
    let parsedPlan = null;

    try {
      parsedPlan = JSON.parse(row.plan_json || "{}");
    } catch {
      parsedPlan = null;
    }

    return res.json({
      plan: parsedPlan,
      meta: {
        plan_id: row.plan_id,
        created_at: row.created_at,
        full_name: row.full_name,
        goal: row.goal,
        days_per_week: row.days_per_week,
        duration_weeks: row.duration_weeks,
      }
    });
  } catch (err) {
    console.error("❌ latest plan error:", err);
    res.status(500).json({ error: "Failed to load latest plan" });
  }
});

/* ===========================================================
   Delete AI Plan
=========================================================== */
router.delete("/ai-plans/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid plan id" });

    const pool = await getDatabase();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM dbo.GymAIPlans
        WHERE plan_id = @id;
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    console.error("❌ Delete plan error:", err);
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

/* ===========================================================
   WEEKLY PLAN (mobile)
=========================================================== */

// GET weekly plan for a customer
router.get("/weekly-plan/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const pool = await getDatabase();

    const result = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT TOP 1 weekly_plan_id, customer_id, days_json, created_at
        FROM dbo.GymWeeklyPlans
        WHERE customer_id=@cid
        ORDER BY weekly_plan_id DESC;
      `);

    if (!result.recordset[0]) return res.json({ plan: null });

    const row = result.recordset[0];
    res.json({
      plan: {
        ...row,
        days: JSON.parse(row.days_json || "[]"),
      },
    });
  } catch (err) {
    console.error("weekly plan get error:", err);
    res.status(500).json({ error: "Failed to load weekly plan" });
  }
});

// SAVE weekly plan
router.post("/weekly-plan/save", async (req, res) => {
  try {
    const { customer_id, days } = req.body;
    if (!customer_id || !Array.isArray(days)) {
      return res
        .status(400)
        .json({ error: "customer_id and days[] required" });
    }

    const pool = await getDatabase();
    const result = await pool
      .request()
      .input("cid", sql.Int, customer_id)
      .input("days_json", sql.NVarChar(sql.MAX), JSON.stringify(days))
      .query(`
        INSERT INTO dbo.GymWeeklyPlans (customer_id, days_json)
        OUTPUT INSERTED.weekly_plan_id, INSERTED.created_at
        VALUES (@cid, @days_json);
      `);

    res.status(201).json({ saved: result.recordset[0] });
  } catch (err) {
    console.error("weekly plan save error:", err);
    res.status(500).json({ error: "Failed to save weekly plan" });
  }
});
/* ===========================================================
   AI Nutrition Plan (Groq)
   POST /api/gym/nutrition-plan
=========================================================== */
router.post("/nutrition-plan", async (req, res) => {
  try {
    const {
      full_name, age, weight, height, gender,
      goal, days_per_week, plan_duration_weeks,
      diet_type, allergies
    } = req.body;

    if (!age || !weight || !height || !goal) {
      return res.status(400).json({
        error: "age, weight, height, goal are required"
      });
    }

    const GROQ_KEY = process.env.GROQ_NUTRITION_KEY || process.env.GROQ_API_KEY;
    const GROQ_MODEL =
      process.env.GROQ_NUTRITION_MODEL || "llama-3.3-70b-versatile";

    if (!GROQ_KEY) {
      return res.status(500).json({ error: "Missing GROQ_NUTRITION_KEY in .env" });
    }

    const duration = Number(plan_duration_weeks || 4);
    const days = Number(days_per_week || 3);

    const prompt = `
You are a professional nutrition coach.
You MUST reply with ONLY valid minified JSON (no markdown, no explanation).

User:
name=${full_name || "member"}
age=${age}
weight_kg=${weight}
height_cm=${height}
gender=${gender || "unknown"}
goal=${goal}
days_per_week=${days}
duration_weeks=${duration}
diet_type=${diet_type || "normal"}
allergies=${allergies || "none"}

Return JSON exactly in this schema:
{
  "summary": {
    "goal": "...",
    "duration_weeks": number,
    "meals_per_day": number,
    "calories_target": number
  },
  "weekly_nutrition": [
    {
      "week": number,
      "days": [
        {
          "day": "Day 1",
          "meals": [
            {"title":"Breakfast","calories":number,"items":["..."]},
            {"title":"Lunch","calories":number,"items":["..."]},
            {"title":"Dinner","calories":number,"items":["..."]}
          ],
          "notes":"short"
        }
      ]
    }
  ],
  "tips":["tip1","tip2"],
  "disclaimer":"short"
}
`;

    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 2000
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    let text = groqRes.data?.choices?.[0]?.message?.content || "";
    console.log("Raw Groq Nutrition:", text.slice(0, 800));

    // reuse your helper
    let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    cleaned = extractJsonObject(cleaned);

    if (!cleaned) {
      return res.status(200).json({
        plan: null,
        raw: text.slice(0, 1500),
        warning: "AI returned no JSON object."
      });
    }

    try {
      const planJson = JSON.parse(cleaned);
      return res.json({ plan: planJson });
    } catch (e) {
      return res.status(200).json({
        plan: null,
        raw: cleaned.slice(0, 1500),
        warning: "AI returned broken JSON."
      });
    }
  } catch (err) {
    console.error("❌ Groq nutrition error:", err?.response?.data || err);
    return res.status(500).json({
      error:
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        "Failed to generate nutrition plan"
    });
  }
});

/* -----------------------------------------------------------
   GET /api/gym/debug-weekly-plans
   Debug endpoint to check data
------------------------------------------------------------ */
router.get("/debug-weekly-plans", async (_req, res) => {
  try {
    const pool = await getDatabase();
    
    // Check what's in GymWeeklyPlans
    const weeklyPlans = await pool.request().query(`
      SELECT 
        customer_id,
        COUNT(*) as plan_count,
        MAX(created_at) as latest_plan,
        MIN(created_at) as earliest_plan
      FROM dbo.GymWeeklyPlans
      GROUP BY customer_id
      ORDER BY customer_id
    `);
    
    // Check a sample of the data
    const sampleData = await pool.request().query(`
      SELECT TOP 3 
        weekly_plan_id,
        customer_id,
        days_json,
        created_at,
        LEN(days_json) as days_length
      FROM dbo.GymWeeklyPlans
      ORDER BY created_at DESC
    `);
    
    // Check push tokens
    const pushTokens = await pool.request().query(`
      SELECT COUNT(*) as token_count FROM dbo.GymPushTokens
    `);
    
    // Check customers
    const customers = await pool.request().query(`
      SELECT COUNT(*) as total_customers FROM dbo.Customers
    `);
    
    res.json({
      summary: {
        total_customers: customers.recordset[0]?.total_customers,
        weekly_plans: weeklyPlans.recordset,
        push_tokens: pushTokens.recordset[0]?.token_count,
      },
      sample_plans: sampleData.recordset,
      customers_with_plans: weeklyPlans.recordset.map(p => ({
        customer_id: p.customer_id,
        plan_count: p.plan_count,
        latest_plan: p.latest_plan,
        earliest_plan: p.earliest_plan
      }))
    });
    
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});
/* -----------------------------------------------------------
   POST /api/gym/test-push-token
   For testing - manually add a push token for a customer
------------------------------------------------------------ */
router.post("/test-push-token", async (req, res) => {
  try {
    const { customer_id, expo_push_token } = req.body;
    
    if (!customer_id || !expo_push_token) {
      return res.status(400).json({ error: "customer_id and expo_push_token required" });
    }
    
    const pool = await getDatabase();
    
    await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .input("expo_push_token", sql.NVarChar(255), expo_push_token)
      .query(`
        MERGE dbo.GymPushTokens AS target
        USING (SELECT @customer_id as customer_id, @expo_push_token as expo_push_token) AS source
        ON target.customer_id = source.customer_id
        WHEN MATCHED THEN
          UPDATE SET expo_push_token = source.expo_push_token, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (customer_id, expo_push_token) VALUES (source.customer_id, source.expo_push_token);
      `);
    
    res.json({ success: true, message: "Push token saved/updated" });
  } catch (err) {
    console.error("Test push token error:", err);
    res.status(500).json({ error: "Failed to save push token" });
  }
});
// -----------------------------------------------------------
// ✅ Progression Logs (one per day per member)
// POST /api/gym/progress/log
// body: { customer_id, log_date?, weight_kg, calories, protein_g, carbs_g, fat_g,
//         water_liters, meals_count, steps, sleep_hours, notes, height_cm? }
// -----------------------------------------------------------
router.post("/progress/log", async (req, res) => {
  try {
    const {
      customer_id,
      log_date, // "YYYY-MM-DD" optional
      weight_kg,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      water_liters,
      meals_count,
      steps,
      sleep_hours,
      notes,
      height_cm, // optional: store on GymMembers
    } = req.body || {};

    if (!customer_id) {
      return res.status(400).json({ error: "customer_id is required" });
    }

    const pool = await getDatabase();

    const memberId = await getMemberIdByCustomerId(pool, Number(customer_id));
    if (!memberId) {
      return res.status(404).json({ error: "No member_id found for this customer_id" });
    }

    // Use today's date if not provided
    const dateStr = log_date && String(log_date).trim() ? String(log_date).trim() : null;

    // Upsert log row (update if exists, else insert)
    const q = `
      IF EXISTS (
        SELECT 1
        FROM dbo.GymProgressLogs
        WHERE member_id = @member_id
          AND log_date  = COALESCE(@log_date, CAST(GETDATE() AS date))
      )
      BEGIN
        UPDATE dbo.GymProgressLogs
        SET
          weight_kg     = @weight_kg,
          calories      = @calories,
          protein_g     = @protein_g,
          carbs_g       = @carbs_g,
          fat_g         = @fat_g,
          water_liters  = @water_liters,
          meals_count   = @meals_count,
          steps         = @steps,
          sleep_hours   = @sleep_hours,
          notes         = @notes
        WHERE member_id = @member_id
          AND log_date  = COALESCE(@log_date, CAST(GETDATE() AS date));
      END
      ELSE
      BEGIN
        INSERT INTO dbo.GymProgressLogs
          (member_id, log_date, weight_kg, calories, protein_g, carbs_g, fat_g,
           water_liters, meals_count, steps, sleep_hours, notes)
        VALUES
          (@member_id, COALESCE(@log_date, CAST(GETDATE() AS date)),
           @weight_kg, @calories, @protein_g, @carbs_g, @fat_g,
           @water_liters, @meals_count, @steps, @sleep_hours, @notes);
      END

      SELECT TOP 1 *
      FROM dbo.GymProgressLogs
      WHERE member_id = @member_id
        AND log_date  = COALESCE(@log_date, CAST(GETDATE() AS date));
    `;

    const result = await pool.request()
      .input("member_id", sql.Int, memberId)
      .input("log_date", sql.Date, dateStr ? new Date(dateStr) : null)
      .input("weight_kg", sql.Decimal(5, 2), weight_kg ?? null)
      .input("calories", sql.Int, calories ?? null)
      .input("protein_g", sql.Int, protein_g ?? null)
      .input("carbs_g", sql.Int, carbs_g ?? null)
      .input("fat_g", sql.Int, fat_g ?? null)
      .input("water_liters", sql.Decimal(4, 2), water_liters ?? null)
      .input("meals_count", sql.Int, meals_count ?? null)
      .input("steps", sql.Int, steps ?? null)
      .input("sleep_hours", sql.Decimal(4, 2), sleep_hours ?? null)
      .input("notes", sql.NVarChar(500), notes ?? null)
      .query(q);

    // Optional: update member height/weight “profile”
    if (height_cm != null || weight_kg != null) {
      await pool.request()
        .input("member_id", sql.Int, memberId)
        .input("height_cm", sql.Int, height_cm ?? null)
        .input("weight_kg", sql.Decimal(5, 2), weight_kg ?? null)
        .query(`
          UPDATE dbo.GymMembers
          SET
            height_cm = COALESCE(@height_cm, height_cm),
            weight_kg = COALESCE(@weight_kg, weight_kg)
          WHERE member_id = @member_id;
        `);
    }

    return res.json({ ok: true, log: result.recordset?.[0] || null });
  } catch (err) {
    console.error("❌ progress log save error:", err);
    res.status(500).json({ error: "Failed to save progress log" });
  }
});
// -----------------------------------------------------------
// GET /api/gym/progress/logs/customer/:customerId?from=YYYY-MM-DD&to=YYYY-MM-DD
// -----------------------------------------------------------
router.get("/progress/logs/customer/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const { from, to } = req.query;

    const pool = await getDatabase();
    const memberId = await getMemberIdByCustomerId(pool, customerId);
    if (!memberId) return res.status(404).json({ error: "No member_id found" });

    const r = await pool.request()
      .input("member_id", sql.Int, memberId)
      .input("from", sql.Date, from ? new Date(String(from)) : null)
      .input("to", sql.Date, to ? new Date(String(to)) : null)
      // In the GET /progress/logs/customer/:customerId route
.query(`
  SELECT
    id,
    member_id,
    CONVERT(VARCHAR(10), log_date, 23) AS log_date,
    weight_kg, calories, protein_g, carbs_g, fat_g,
    water_liters, meals_count, 
    steps,                    -- ADD THIS
    sleep_hours,              -- ADD THIS
    notes,
    created_at
  FROM dbo.GymProgressLogs
  WHERE member_id = @member_id
    AND (@from IS NULL OR log_date >= @from)
    AND (@to   IS NULL OR log_date <= @to)
  ORDER BY log_date DESC;
`);
    res.json({ ok: true, logs: r.recordset || [] });
  } catch (err) {
    console.error("❌ progress logs fetch error:", err);
    res.status(500).json({ error: "Failed to load progress logs" });
  }
});
// ===========================================================
// ATTENDANCE + PROGRESSION (Progress Logs)
// ===========================================================

// helper: get member_id from customer_id (latest subscription)
async function getMemberIdByCustomerId(pool, customerId) {
  const rs = await pool.request()
    .input("cid", sql.Int, customerId)
    .query(`
      SELECT TOP 1 member_id
      FROM dbo.GymSubscriptions
      WHERE customer_id = @cid
        AND member_id IS NOT NULL
      ORDER BY subscription_id DESC;
    `);

  return rs.recordset?.[0]?.member_id ?? null;
}

/**
 * POST /api/gym/attendance/checkin
 * body: { customer_id }
 * Inserts one attendance row per day (if already checked in today -> already=true)
 */
router.post("/attendance/checkin", async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) return res.status(400).json({ error: "customer_id is required" });

    const pool = await getDatabase();

    // already today?
    const exists = await pool.request()
      .input("cid", sql.Int, customer_id)
      .query(`
        SELECT TOP 1 attendance_id
        FROM dbo.GymAttendance
        WHERE customer_id = @cid
          AND CAST(attended_at AS date) = CAST(GETDATE() AS date)
        ORDER BY attended_at DESC;
      `);

    if (exists.recordset.length > 0) {
      return res.json({ ok: true, already: true });
    }

    await pool.request()
      .input("cid", sql.Int, customer_id)
      .query(`
        INSERT INTO dbo.GymAttendance (customer_id, attended_at)
        VALUES (@cid, GETDATE());
      `);

    return res.json({ ok: true, already: false });
  } catch (err) {
    console.error("❌ attendance checkin error:", err);
    res.status(500).json({ error: "Failed to check in" });
  }
});
// ✅ Manual insert attendance for old dates (admin / web)
router.post("/attendance/manual", async (req, res) => {
  try {
    const { customer_id, log_date, attended_at } = req.body;
    if (!customer_id || !log_date) {
      return res.status(400).json({ error: "customer_id and log_date required" });
    }

    // log_date must be 'YYYY-MM-DD'
    // attended_at optional: ISO string or datetime
    const attendedTime = attended_at ? new Date(attended_at) : new Date(`${log_date}T12:00:00`);

    // Prevent duplicates (same day)
    const exists = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("log_date", sql.Date, log_date)
      .query(`
        SELECT TOP 1 attendance_id
        FROM GymAttendanceLogs
        WHERE customer_id=@customer_id AND log_date=@log_date
      `);

    if (exists.recordset.length > 0) {
      return res.json({ success: true, already: true });
    }

    await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("log_date", sql.Date, log_date)
      .input("attended_at", sql.DateTime, attendedTime)
      .query(`
        INSERT INTO GymAttendanceLogs (customer_id, log_date, attended_at)
        VALUES (@customer_id, @log_date, @attended_at)
      `);

    return res.json({ success: true, already: false });
  } catch (e) {
    console.error("attendance manual insert error:", e);
    return res.status(500).json({ error: "Failed to insert attendance" });
  }
});

/**
 * GET /api/gym/attendance/streak/:customerId
 * streak = consecutive days ending today
 */
router.get("/attendance/streak/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) return res.status(400).json({ error: "Invalid customerId" });

    const pool = await getDatabase();

    const rs = await pool.request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT DISTINCT CAST(attended_at AS date) AS d
        FROM dbo.GymAttendance
        WHERE customer_id = @cid
          AND attended_at >= DATEADD(day, -120, GETDATE())
        ORDER BY d DESC;
      `);

    const dates = rs.recordset.map(r => new Date(r.d));
    // normalize today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let cursor = new Date(today);

    for (const d of dates) {
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === cursor.getTime()) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        // if first date isn't today, streak becomes 0
        break;
      }
    }

    return res.json({ streak });
  } catch (err) {
    console.error("❌ attendance streak error:", err);
    res.status(500).json({ error: "Failed to load streak" });
  }
});
// ✅ Attendance summary for charts (web)
router.get("/attendance/summary/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const { from, to, group = "day" } = req.query;

    const groupExpr =
      group === "month"
        ? "FORMAT(log_date, 'yyyy-MM')"
        : group === "week"
        ? "FORMAT(DATEADD(day, 1-DATEPART(weekday, log_date), log_date), 'yyyy-MM-dd')" // week start
        : "FORMAT(log_date, 'yyyy-MM-dd')";

    let where = "WHERE customer_id=@customerId";
    if (from) where += " AND log_date >= @from";
    if (to) where += " AND log_date <= @to";

    const q = `
      SELECT ${groupExpr} as bucket, COUNT(*) as total
      FROM GymAttendanceLogs
      ${where}
      GROUP BY ${groupExpr}
      ORDER BY bucket ASC
    `;

    const r = await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .input("from", sql.Date, from || null)
      .input("to", sql.Date, to || null)
      .query(q);

    return res.json({ success: true, group, items: r.recordset });
  } catch (e) {
    console.error("attendance summary error:", e);
    return res.status(500).json({ error: "Failed to load summary" });
  }
});

/**
 * GET /api/gym/attendance/history/:customerId?from=YYYY-MM-DD&to=YYYY-MM-DD
 * (use later in Web dashboard daily/weekly/monthly)
 */
router.get("/attendance/history/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const { from, to } = req.query;

    if (!customerId) return res.status(400).json({ error: "Invalid customerId" });

    const pool = await getDatabase();

    const q = `
      SELECT attendance_id, customer_id,
             CONVERT(varchar(19), attended_at, 120) AS attended_at
      FROM dbo.GymAttendance
      WHERE customer_id = @cid
        AND (@from IS NULL OR attended_at >= @from)
        AND (@to   IS NULL OR attended_at <  DATEADD(day, 1, @to))
      ORDER BY attended_at DESC;
    `;

    const rs = await pool.request()
      .input("cid", sql.Int, customerId)
      .input("from", sql.Date, from ? new Date(String(from)) : null)
      .input("to", sql.Date, to ? new Date(String(to)) : null)
      .query(q);

    res.json({ rows: rs.recordset });
  } catch (err) {
    console.error("❌ attendance history error:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});
router.get("/attendance/debug-db", async (_req, res) => {
  const pool = await getDatabase();
  const db = await pool.request().query("SELECT DB_NAME() AS db");
  const cnt = await pool.request().query("SELECT COUNT(*) AS total FROM dbo.GymAttendance");
  res.json({ db: db.recordset[0].db, total: cnt.recordset[0].total });
});


// GET /api/gym/attendance/today?date=YYYY-MM-DD
router.get("/attendance/today", async (req, res) => {
  try {
    const pool = await getDatabase();
    const dateStr = req.query.date ? String(req.query.date).trim() : null;

    const q = `
      DECLARE @d date = COALESCE(TRY_CONVERT(date, @dateStr, 23), CAST(GETDATE() AS date));

      SELECT
        A.attendance_id,
        A.customer_id,
        CONVERT(varchar(19), A.attended_at, 120) AS attended_at,
        S.member_id,
        COALESCE(S.full_name, C.name) AS full_name,
        COALESCE(S.phone, C.phone) AS phone,
        S.plan_type,
        S.status
      FROM dbo.GymAttendance A
      OUTER APPLY (
        SELECT TOP 1 member_id, full_name, phone, plan_type, status
        FROM dbo.GymSubscriptions
        WHERE customer_id = A.customer_id
        ORDER BY subscription_id DESC
      ) S
      LEFT JOIN dbo.Customers C ON C.customer_id = A.customer_id
      WHERE CAST(A.attended_at AS date) = @d
      ORDER BY A.attended_at DESC;

      SELECT @d AS used_date;
    `;

    const r = await pool.request()
      .input("dateStr", sql.VarChar(10), dateStr) // ✅ string, not JS Date
      .query(q);

    const rows = r.recordsets?.[0] || [];
    const used_date = r.recordsets?.[1]?.[0]?.used_date || null;

    res.json({ ok: true, requested: dateStr, used_date, rows });
  } catch (e) {
    console.error("attendance today error:", e);
    res.status(500).json({ ok: false, error: "Failed to load today attendance" });
  }
});


/* ===========================================================
   ✅ AI Analysis: Attendance + Progress Trends (Gemini)
   GET /api/gym/ai/analyze?from=YYYY-MM-DD&to=YYYY-MM-DD
   Notes:
   - Gemini API key stays in backend only (process.env.GEMINI_API_KEY)
   - Returns compact member summaries + AI insights
=========================================================== */
router.get("/ai/analyze", async (req, res) => {
  try {
    const pool = await getDatabase();

    // default range: last 28 days
    const toStr = (req.query.to ? String(req.query.to) : "").trim();
    const fromStr = (req.query.from ? String(req.query.from) : "").trim();

    const toDate = toStr ? new Date(toStr) : new Date();
    const fromDate = fromStr
      ? new Date(fromStr)
      : new Date(new Date(toDate).getTime() - 28 * 86400000);

    // normalize time window
    if (Number.isNaN(toDate.getTime()) || Number.isNaN(fromDate.getTime())) {
      return res.status(400).json({ ok: false, error: "Invalid from/to date. Use YYYY-MM-DD." });
    }
    if (fromDate > toDate) {
      return res.status(400).json({ ok: false, error: "`from` must be <= `to`" });
    }




    // --- 1) Load subscriptions (map customer -> member + name/plan/status) ---
    const subs = await pool.request().query(`
      SELECT
        subscription_id,
        customer_id,
        member_id,
        full_name,
        phone,
        plan_type,
        status,
        CONVERT(VARCHAR(10), start_date, 23) AS start_date,
        CONVERT(VARCHAR(10), end_date, 23)   AS end_date,
        created_at
      FROM dbo.GymSubscriptions
      ORDER BY subscription_id DESC;
    `);

    // keep latest subscription per customer_id
    const latestByCustomer = new Map();
    for (const s of subs.recordset || []) {
      if (!latestByCustomer.has(s.customer_id)) latestByCustomer.set(s.customer_id, s);
    }

    // --- 2) Attendance in range ---
    const att = await pool.request()
      .input("from", sql.Date, fromDate)
      .input("to", sql.Date, toDate)
      .query(`
        SELECT
          customer_id,
          CONVERT(VARCHAR(10), CAST(attended_at AS date), 23) AS day
        FROM dbo.GymAttendance
        WHERE attended_at >= @from
          AND attended_at < DATEADD(day, 1, @to);
      `);

    // --- 3) Progress logs in range ---
    const prog = await pool.request()
      .input("from", sql.Date, fromDate)
      .input("to", sql.Date, toDate)
      .query(`
        SELECT
          member_id,
          CONVERT(VARCHAR(10), log_date, 23) AS log_date,
          weight_kg,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          water_liters,
          steps,
          sleep_hours,
          meals_count
        FROM dbo.GymProgressLogs
        WHERE log_date >= @from
          AND log_date <= @to;
      `);

    // --- Build per-member summary dataset (compact, AI-friendly) ---
    const byMember = new Map();

    function ensureMember(member_id, customer_id) {
      const key = String(member_id ?? customer_id ?? "");
      if (!key) return null;
      if (!byMember.has(key)) {
        const sub = customer_id ? latestByCustomer.get(customer_id) : null;
        byMember.set(key, {
          key,
          customer_id: customer_id ?? sub?.customer_id ?? null,
          member_id: member_id ?? sub?.member_id ?? null,
          full_name: sub?.full_name || null,
          plan_type: sub?.plan_type || null,
          status: sub?.status || null,
          attendance_days: [],
          progress_logs: [],
        });
      }
      return byMember.get(key);
    }

    // attendance: group by customer -> (member)
    for (const row of att.recordset || []) {
      const sub = latestByCustomer.get(row.customer_id);
      const member_id = sub?.member_id ?? null;
      const m = ensureMember(member_id, row.customer_id);
      if (m) m.attendance_days.push(row.day);
    }

    // progress logs: group by member_id
    for (const row of prog.recordset || []) {
      const m = ensureMember(row.member_id, null);
      if (m) m.progress_logs.push(row);
    }

    // finalize metrics
    const msPerDay = 86400000;
    const totalDays = Math.max(1, Math.round((toDate - fromDate) / msPerDay) + 1);
    const weeks = Math.max(1, Math.ceil(totalDays / 7));

    function firstLast(arr, field) {
      const clean = (arr || []).filter(x => x[field] != null).sort((a,b) => (a.log_date || "").localeCompare(b.log_date || ""));
      if (!clean.length) return { first: null, last: null, change: null };
      const first = Number(clean[0][field]);
      const last = Number(clean[clean.length - 1][field]);
      if (!Number.isFinite(first) || !Number.isFinite(last)) return { first: null, last: null, change: null };
      return { first, last, change: +(last - first).toFixed(2) };
    }

    const members = [];
    for (const m of byMember.values()) {
      const uniqueDays = Array.from(new Set(m.attendance_days));
      const attendanceCount = uniqueDays.length;

      const logs = (m.progress_logs || []).slice().sort((a,b) => (a.log_date || "").localeCompare(b.log_date || ""));
      const weight = firstLast(logs, "weight_kg");
      const steps = firstLast(logs, "steps");
      const calories = firstLast(logs, "calories");

      members.push({
        customer_id: m.customer_id,
        member_id: m.member_id,
        full_name: m.full_name,
        plan_type: m.plan_type,
        status: m.status,
        attendance_total: attendanceCount,
        attendance_per_week: +(attendanceCount / weeks).toFixed(2),
        attendance_rate: +((attendanceCount / totalDays) * 100).toFixed(1),
        weight_change_kg: weight.change,
        steps_change: steps.change,
        calories_change: calories.change,
        logs_count: logs.length,
      });
    }

    // --- 4) Call Gemini with compact JSON data ---
    const dataset = {
      range: {
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
        days: totalDays,
        weeks,
      },
      members,
    };

    const prompt = `
You are a gym performance analyst.
Given the JSON dataset, produce a concise analysis for managers.

Return ONLY valid JSON (no markdown). Use this schema:
{
  "summary": {
    "overall_attendance_rate_avg": number,
    "overall_notes": "string",
    "key_trends": ["..."]
  },
  "top_improvers": [
    {"member_id": number|null, "full_name": "string|null", "reason": "string"}
  ],
  "at_risk": [
    {"member_id": number|null, "full_name": "string|null", "reason": "string"}
  ],
  "member_insights": [
    {"member_id": number|null, "full_name": "string|null", "attendance": "string", "progress": "string", "next_action": "string"}
  ],
  "recommendations": ["..."]
}

Dataset:
${JSON.stringify(dataset)}
`.trim();

   /////

   const GRQ_ANYLZER_KEY = process.env.GRQ_ANYLZER_KEY;
const GRQ_ANYLZER_MODEL = process.env.GRQ_ANYLZER_MODEL || "llama-3.3-70b-versatile";

if (!GRQ_ANYLZER_KEY) {
  return res.status(500).json({ ok: false, error: "Missing GRQ_ANYLZER_KEY in .env" });
}

const groqUrl = "https://api.groq.com/openai/v1/chat/completions";

const groqRes = await axios.post(
  groqUrl,
  {
    model: GRQ_ANYLZER_MODEL,
    messages: [
      { role: "system", content: "You are a gym performance analyst. Return ONLY valid JSON. No markdown." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 3000,
    // If Groq supports strict JSON mode for your account/model, you can keep parsing anyway.
    // response_format: { type: "json_object" },
  },
  {
    headers: {
      Authorization: `Bearer ${GRQ_ANYLZER_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 60000
  }
);

const aiText = groqRes?.data?.choices?.[0]?.message?.content || "";




//////
    // try parse json using your existing helper (extractJsonObject)
    let parsed = null;
    try {
      const cleaned = extractJsonObject(String(aiText).replace(/```json/gi, "").replace(/```/g, "").trim());
      if (cleaned) parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = null;
    }

    return res.json({
      ok: true,
      from: dataset.range.from,
      to: dataset.range.to,
      dataset,
      analysis_raw: aiText,
      analysis: parsed,
    });
  } catch (err) {
    console.error("❌ Gemini analyze error:", err?.response?.data || err);
    return res.status(500).json({
      ok: false,
      error: err?.response?.data?.error?.message || err?.message || "Failed to analyze"
    });
  }
});
// Add to gym.js:

/* GET /api/gym/coaches - List all coaches */
router.get("/coaches", async (req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT 
        coach_id,
        full_name,
        phone,
        email,
        specialties,
        experience_years,
        certifications,
        hourly_rate,
        bio,
        status,
        photo_url,
        birth_date
      FROM dbo.Coaches
      WHERE status = 'Active'
      ORDER BY full_name
    `);
    res.json({ coaches: result.recordset });
  } catch (err) {
    console.error("GET /coaches error:", err);
    res.status(500).json({ error: "Failed to load coaches" });
  }
});

/* GET /api/gym/coaches/:id - Get single coach */
router.get("/coaches/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = await getDatabase();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT * FROM dbo.Coaches WHERE coach_id = @id
      `);
    
    if (!result.recordset[0]) {
      return res.status(404).json({ error: "Coach not found" });
    }
    
    res.json({ coach: result.recordset[0] });
  } catch (err) {
    console.error("GET /coaches/:id error:", err);
    res.status(500).json({ error: "Failed to load coach" });
  }
});

/* GET /api/gym/members/by-customer/:customerId */
router.get("/members/by-customer/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const pool = await getDatabase();
    
    const result = await pool.request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT TOP 1 
          gm.member_id,
          gm.full_name,
          gm.phone,
          gm.email,
          gm.status
        FROM dbo.GymSubscriptions gs
        LEFT JOIN dbo.GymMembers gm ON gm.member_id = gs.member_id
        WHERE gs.customer_id = @cid
          AND gs.member_id IS NOT NULL
        ORDER BY gs.subscription_id DESC
      `);
    
    if (!result.recordset[0]) {
      return res.status(404).json({ error: "No member found for this customer" });
    }
    
    res.json({ member: result.recordset[0] });
  } catch (err) {
    console.error("GET /members/by-customer error:", err);
    res.status(500).json({ error: "Failed to load member" });
  }
});
// GET /api/gym/members/customer/:customerId
router.get("/members/customer/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const pool = await getDatabase();

    const memberId = await getMemberIdByCustomerId(pool, customerId);
    if (!memberId) return res.json({ member: null });

    const r = await pool.request()
      .input("member_id", sql.Int, memberId)
      .query(`
        SELECT TOP 1
          member_id,
          full_name,
          gender,
          birth_date,
          height_cm,
          weight_kg
        FROM dbo.GymMembers
        WHERE member_id = @member_id;
      `);

    res.json({ member: r.recordset?.[0] || null });
  } catch (err) {
    console.error("get member profile error:", err);
    res.status(500).json({ error: "Failed to fetch member profile" });
  }
});
// ✅ MOBILE: get profile metrics (height/weight/age) by customerId
router.get("/profile/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) return res.status(400).json({ error: "Invalid customerId" });

    const pool = await getDatabase();

    // Get latest member record linked to the customer's latest subscription
    const result = await pool
      .request()
      .input("cid", sql.Int, customerId)
      .query(`
        SELECT TOP 1
          m.height_cm,
          m.weight_kg,
          CONVERT(VARCHAR(10), COALESCE(m.birth_date, c.birth_date), 23) AS birth_date
        FROM dbo.GymSubscriptions s
        LEFT JOIN dbo.GymMembers m ON m.member_id = s.member_id
        LEFT JOIN dbo.Customers  c ON c.customer_id = s.customer_id
        WHERE s.customer_id = @cid
        ORDER BY s.subscription_id DESC;
      `);

    const row = result.recordset?.[0];
    if (!row) {
      return res.json({
        height_cm: null,
        weight_kg: null,
        birth_date: null,
        age: null,
      });
    }

    // Compute age from birth_date
    let age = null;
    if (row.birth_date) {
      const dob = new Date(row.birth_date);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (age < 0) age = 0;
      }
    }

    return res.json({
      height_cm: row.height_cm ?? null,
      weight_kg: row.weight_kg ?? null,
      birth_date: row.birth_date ?? null,
      age,
    });
  } catch (err) {
    console.error("❌ profile route error:", err);
    return res.status(500).json({ error: "Failed to load profile metrics" });
  }
});

module.exports = router;

module.exports = router;