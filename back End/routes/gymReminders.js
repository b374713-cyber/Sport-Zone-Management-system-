// routes/gymReminders.js
const express = require("express");
const router = express.Router();
const axios = require("axios"); // Add this import

const { sql, getDatabase } = require("../config/database");

/**
 * Tables used:
 * - dbo.GymPushTokens (customer_id UNIQUE, expo_push_token)
 * - dbo.GymWeeklyPlans (customer_id UNIQUE, days JSON)
 * - dbo.GymAttendance (attendance_id, customer_id, attended_at DATETIME)
 */

// ----------------------------------------------------
// 1) SAVE/UPDATE CUSTOMER EXPO PUSH TOKEN
// ----------------------------------------------------
router.post("/push-token/save", async (req, res) => {
  try {
    const { customer_id, expo_push_token } = req.body;
    if (!customer_id || !expo_push_token) {
      return res.status(400).json({ error: "customer_id and expo_push_token are required" });
    }

    const pool = await getDatabase();

    await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("expo_push_token", sql.NVarChar(255), expo_push_token)
      .query(`
        MERGE dbo.GymPushTokens AS T
        USING (SELECT @customer_id AS customer_id, @expo_push_token AS expo_push_token) AS S
        ON T.customer_id = S.customer_id
        WHEN MATCHED THEN
          UPDATE SET expo_push_token = S.expo_push_token, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (customer_id, expo_push_token) VALUES (S.customer_id, S.expo_push_token);
      `);

    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/gym/push-token/save error:", err);
    return res.status(500).json({ error: "Failed to save push token" });
  }
});

// ----------------------------------------------------
// Helper: Send Expo Push Notification
// ----------------------------------------------------
async function sendExpoPush(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    const resp = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      message,
      { headers: { "Content-Type": "application/json" } }
    );
    return resp.data;
  } catch (err) {
    console.error("Expo push error:", err.response?.data || err.message);
    throw err;
  }
}

// ----------------------------------------------------
// 2) ADMIN: LIST SUBSCRIBERS + WEEKLY PLAN DAYS
// ----------------------------------------------------
router.get("/subscribers/weekly-plans", async (_req, res) => {
  try {
    const pool = await getDatabase();

    const result = await pool.request().query(`
      SELECT
        c.customer_id,
        c.name,
        c.email,
        ISNULL(wp.days_json, '[]') AS days_json
      FROM dbo.Customers c
      INNER JOIN dbo.GymWeeklyPlans wp
        ON wp.customer_id = c.customer_id
      WHERE wp.days_json IS NOT NULL
        AND wp.days_json <> ''
        AND wp.days_json <> '[]'
      ORDER BY c.customer_id DESC;
    `);

    const subscribers = (result.recordset || []).map((row) => {
      let days = [];
      try {
        days = JSON.parse(row.days_json || "[]");
      } catch {
        days = [];
      }

      return {
        customer_id: row.customer_id,
        name: row.name || `Customer ${row.customer_id}`,
        email: row.email,
        days,
      };
    });

    return res.json({ success: true, subscribers });
  } catch (err) {
    console.error("GET /api/gym/subscribers/weekly-plans error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to load subscribers",
    });
  }
});

// ----------------------------------------------------
// 3) ADMIN: SEND REMINDER NOTIFICATION TO ONE CUSTOMER
// ----------------------------------------------------
router.post("/remind", async (req, res) => {
  try {
    const { customer_id, title, body } = req.body;
    if (!customer_id) {
      return res.status(400).json({ 
        success: false, 
        error: "customer_id is required" 
      });
    }

    const pool = await getDatabase();

    // Get push token for customer
    const tokenRes = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`
        SELECT TOP 1 expo_push_token 
        FROM dbo.GymPushTokens 
        WHERE customer_id = @customer_id
      `);

    if (!tokenRes.recordset || tokenRes.recordset.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "No push token found. Customer must open mobile app first." 
      });
    }

    const expoToken = tokenRes.recordset[0].expo_push_token;
    if (!expoToken) {
      return res.status(404).json({ 
        success: false,
        error: "Push token is empty" 
      });
    }

    // Get customer name for better logging
    const customerRes = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`
        SELECT TOP 1 name FROM dbo.Customers WHERE customer_id = @customer_id
      `);

    const customerName = customerRes.recordset[0]?.name || `Customer ${customer_id}`;

    // Send notification
    const result = await sendExpoPush(
      expoToken,
      title || "🏋️ Gym Reminder",
      body || "Don't forget your gym session today!",
      {
        type: "gym_admin_reminder",
        customer_id: customer_id.toString()
      }
    );

    console.log(`✅ Reminder sent to ${customerName} (ID: ${customer_id})`);

    return res.json({ 
      success: true, 
      message: `Reminder sent to ${customerName}`,
      customer_id,
      customer_name: customerName,
      expo_response: result
    });

  } catch (err) {
    console.error("POST /api/gym/remind error:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Failed to send reminder" 
    });
  }
});

// ----------------------------------------------------
// 4) GET PUSH TOKENS
// ----------------------------------------------------
router.get("/subscribers/push-tokens", async (_req, res) => {
  try {
    const pool = await getDatabase();

    const result = await pool.request().query(`
      SELECT 
        gpt.customer_id,
        gpt.expo_push_token,
        c.name,
        c.email,
        gpt.updated_at
      FROM dbo.GymPushTokens gpt
      LEFT JOIN dbo.Customers c ON c.customer_id = gpt.customer_id
      ORDER BY gpt.updated_at DESC
    `);

    return res.json({
      success: true,
      push_tokens: result.recordset || [],
      count: result.recordset?.length || 0
    });
  } catch (err) {
    console.error("GET /api/gym/subscribers/push-tokens error:", err);
    return res.json({
      success: true,
      push_tokens: [],
      count: 0
    });
  }
});

// ----------------------------------------------------
// 5) SEND REMINDER TO SUBSCRIBER
// ----------------------------------------------------
router.post("/subscribers/send-reminder", async (req, res) => {
  try {
    const { customer_id, message } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: "customer_id is required"
      });
    }

    console.log(`📤 Sending reminder to customer ${customer_id}`);
    const pool = await getDatabase();
    
    // Check if customer has push token
    const tokenResult = await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .query(`
        SELECT expo_push_token 
        FROM dbo.GymPushTokens 
        WHERE customer_id = @customer_id
      `);
    
    if (!tokenResult.recordset || tokenResult.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Customer doesn't have a push token. Open the mobile app first."
      });
    }

    const expoToken = tokenResult.recordset[0].expo_push_token;
    
    // Get customer details
    const customerResult = await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .query(`
        SELECT name, email FROM dbo.Customers WHERE customer_id = @customer_id
      `);
    
    const customer = customerResult.recordset[0];
    const customerName = customer?.name || `Customer ${customer_id}`;
    
    // Send push notification
    const expoResponse = await sendExpoPush(
      expoToken,
      "🏋️ Gym Reminder",
      message || "Don't forget your gym session today! 💪",
      {
        type: "gym_admin_reminder",
        customer_id: customer_id.toString()
      }
    );

    console.log(`✅ Push sent to ${customerName}:`, expoResponse);

    return res.json({
      success: true,
      message: `Reminder sent to ${customerName}`,
      customer_name: customerName,
      customer_id: customer_id,
      expo_response: expoResponse
    });
    
  } catch (err) {
    console.error("❌ Error sending reminder:", err);
    return res.status(500).json({ 
      success: false,
      error: "Failed to send reminder",
      details: err.message
    });
  }
});

// ----------------------------------------------------
// 6) CUSTOMER: ATTENDANCE CHECK-IN (MOBILE BUTTON)
// ----------------------------------------------------
router.post("/attendance/checkin", async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) return res.status(400).json({ error: "customer_id is required" });

    const pool = await getDatabase();

    // prevent duplicate check-in in same day
    const exists = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`
        SELECT TOP 1 attendance_id
        FROM dbo.GymAttendance
        WHERE customer_id=@customer_id
          AND CAST(attended_at AS DATE) = CAST(GETDATE() AS DATE)
      `);

    if (exists.recordset?.length) {
      return res.json({ ok: true, already: true, message: "Already checked-in today" });
    }

    await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`INSERT INTO dbo.GymAttendance (customer_id, attended_at) VALUES (@customer_id, GETDATE())`);

    return res.json({ ok: true, message: "Checked-in successfully" });
  } catch (err) {
    console.error("POST /api/gym/attendance/checkin error:", err);
    return res.status(500).json({ error: "Failed to check-in" });
  }
});

// ----------------------------------------------------
// 7) ADMIN: ATTENDANCE LISTS (today/week/month/3months)
// ----------------------------------------------------
router.get("/attendance/list", async (req, res) => {
  try {
    const range = String(req.query.range || "today").toLowerCase();
    let daysBack = 0;

    if (range === "today") daysBack = 0;
    else if (range === "week") daysBack = 7;
    else if (range === "month") daysBack = 30;
    else if (range === "3months") daysBack = 90;
    else daysBack = 0;

    const pool = await getDatabase();

    const q =
      daysBack === 0
        ? `
          SELECT a.attended_at, c.customer_id, c.name AS customer_name
          FROM dbo.GymAttendance a
          JOIN dbo.Customers c ON c.customer_id = a.customer_id
          WHERE CAST(a.attended_at AS DATE) = CAST(GETDATE() AS DATE)
          ORDER BY a.attended_at DESC
        `
        : `
          SELECT a.attended_at, c.customer_id, c.name AS customer_name
          FROM dbo.GymAttendance a
          JOIN dbo.Customers c ON c.customer_id = a.customer_id
          WHERE a.attended_at >= DATEADD(day, -${daysBack}, GETDATE())
          ORDER BY a.attended_at DESC
        `;

    const r = await pool.request().query(q);

    return res.json({ ok: true, range, rows: r.recordset || [] });
  } catch (err) {
    console.error("GET /api/gym/attendance/list error:", err);
    return res.status(500).json({ error: "Failed to load attendance" });
  }
});

module.exports = router;