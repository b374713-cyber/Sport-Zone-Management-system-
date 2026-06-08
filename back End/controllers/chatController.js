
const { sql, getDatabase } = require("../config/database");

// -------------------- Safe fetch (Node 18+ has global fetch) --------------------
async function safeFetch(url, options) {
  if (typeof fetch === "function") return fetch(url, options);
  // fallback if your Node is old
  const nodeFetch = (await import("node-fetch")).default;
  return nodeFetch(url, options);
}

// -------------------- Expo Push Helper --------------------
function isValidExpoToken(token) {
  if (!token) return false;
  return (
    token.startsWith("ExponentPushToken[") ||
    token.startsWith("ExpoPushToken[") ||
    token.startsWith("ExponentPushToken") ||
    token.startsWith("ExpoPushToken")
  );
}

async function sendExpoPush(token, title, body, data = {}) {
  if (!isValidExpoToken(token)) {
    console.log("❌ No valid expo token found, skipping push:", token);
    return;
  }

  const payload = {
    to: token,
    sound: "default",
    title,
    body,
    data,
    priority: "high",
  };

  try {
    const res = await safeFetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    console.log("✅ Expo push response:", json);
    return json;
  } catch (e) {
    console.log("❌ Expo push failed:", e);
  }
}

// Temporary (simple) auth: read IDs from headers
function getCustomerId(req) {
  return Number(req.headers["x-customer-id"]);
}
function getUserId(req) {
  return Number(req.headers["x-user-id"]);
}

// -------------------- Customer (Mobile) --------------------
exports.getOrCreateConversation = async (req, res) => {
  try {
    const customer_id = getCustomerId(req);
    if (!customer_id) return res.status(400).json({ error: "Missing x-customer-id" });

    const pool = await getDatabase();

    const found = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`
        SELECT conversation_id, customer_id, status, created_at, updated_at
        FROM chat_conversations
        WHERE customer_id=@customer_id
      `);

    if (found.recordset.length) {
      return res.json({ conversation: found.recordset[0] });
    }

    const created = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`
        INSERT INTO chat_conversations (customer_id)
        OUTPUT INSERTED.conversation_id, INSERTED.customer_id, INSERTED.status, INSERTED.created_at, INSERTED.updated_at
        VALUES (@customer_id)
      `);

    return res.json({ conversation: created.recordset[0] });
  } catch (err) {
    console.error("getOrCreateConversation error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMyMessages = async (req, res) => {
  try {
    const customer_id = getCustomerId(req);
    if (!customer_id) return res.status(400).json({ error: "Missing x-customer-id" });

    const pool = await getDatabase();

    const convo = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`SELECT conversation_id FROM chat_conversations WHERE customer_id=@customer_id`);

    if (!convo.recordset.length) return res.json({ conversation_id: null, messages: [] });

    const conversation_id = convo.recordset[0].conversation_id;

    const msgs = await pool
      .request()
      .input("conversation_id", sql.Int, conversation_id)
      .query(`
        SELECT message_id, sender_type, sender_id, body, created_at, is_read
        FROM chat_messages
        WHERE conversation_id=@conversation_id
        ORDER BY created_at ASC
      `);

    res.json({ conversation_id, messages: msgs.recordset });
  } catch (err) {
    console.error("getMyMessages error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.sendCustomerMessage = async (req, res) => {
  try {
    const customer_id = getCustomerId(req);
    const { body } = req.body;

    if (!customer_id) return res.status(400).json({ error: "Missing x-customer-id" });
    if (!body || !String(body).trim()) return res.status(400).json({ error: "Message body required" });

    const pool = await getDatabase();

    const convo = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(`SELECT conversation_id FROM chat_conversations WHERE customer_id=@customer_id`);

    if (!convo.recordset.length) return res.status(400).json({ error: "No conversation yet" });

    const conversation_id = convo.recordset[0].conversation_id;

    const inserted = await pool
      .request()
      .input("conversation_id", sql.Int, conversation_id)
      .input("sender_type", sql.NVarChar(20), "customer")
      .input("sender_id", sql.Int, customer_id)
      .input("body", sql.NVarChar(sql.MAX), body)
      .query(`
        INSERT INTO chat_messages (conversation_id, sender_type, sender_id, body)
        OUTPUT INSERTED.message_id, INSERTED.sender_type, INSERTED.sender_id, INSERTED.body, INSERTED.created_at, INSERTED.is_read
        VALUES (@conversation_id, @sender_type, @sender_id, @body)
      `);

    await pool
      .request()
      .input("conversation_id", sql.Int, conversation_id)
      .query(`UPDATE chat_conversations SET updated_at = SYSDATETIME() WHERE conversation_id=@conversation_id`);

    const io = req.app.get("io");
    if (io) {
      // ✅ Emit to conversation room (for admin who has this chat open)
      io.to(`conversation:${conversation_id}`).emit("message", inserted.recordset[0]);
      
      // ✅ Emit special event for admins to update their inbox UI
      io.to("admins").emit("new-customer-message", {
        ...inserted.recordset[0],
        conversation_id,
        // Include customer info for inbox update
        customer_id,
        timestamp: new Date().toISOString(),
        type: "customer_message"
      });
      
      console.log(`📤 Customer message sent, emitted to admins room`);
    }

    res.json({ message: inserted.recordset[0], conversation_id });
  } catch (err) {
    console.error("sendCustomerMessage error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -------------------- Push Token Save --------------------
// POST /api/chat/push-token

async function saveCustomerPushToken(req, res) {
  try {
    const customerId = getCustomerId(req);
    const { expo_push_token } = req.body || {};

    if (!customerId) return res.status(400).json({ error: "Missing x-customer-id" });
    if (!expo_push_token) return res.status(400).json({ error: "Missing expo_push_token" });

    const pool = await getDatabase();

    await pool
      .request()
      .input("customer_id", sql.Int, customerId)
      .input("expo_push_token", sql.NVarChar(255), expo_push_token)
      .query(`
        UPDATE Customers
        SET expo_push_token = @expo_push_token
        WHERE customer_id = @customer_id
      `);

    console.log("✅ Saved expo_push_token for customer:", customerId, expo_push_token);

    res.json({ ok: true });
  } catch (err) {
    console.error("saveCustomerPushToken error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
exports.saveCustomerPushToken = saveCustomerPushToken;

// -------------------- Admin/Employee (Web) --------------------
exports.adminListConversations = async (_req, res) => {
  try {
    const pool = await getDatabase();

    const rows = await pool.request().query(`
      SELECT c.conversation_id, c.customer_id, c.status, c.created_at, c.updated_at,
             cu.name AS customer_name, cu.phone AS customer_phone, cu.email AS customer_email
      FROM chat_conversations c
      JOIN Customers cu ON cu.customer_id = c.customer_id
      ORDER BY c.updated_at DESC
    `);

    res.json({ conversations: rows.recordset });
  } catch (err) {
    console.error("adminListConversations error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.adminGetMessages = async (req, res) => {
  try {
    const conversation_id = Number(req.params.conversationId);
    if (!conversation_id) return res.status(400).json({ error: "conversationId required" });

    const pool = await getDatabase();

    const msgs = await pool
      .request()
      .input("conversation_id", sql.Int, conversation_id)
      .query(`
        SELECT message_id, sender_type, sender_id, body, created_at, is_read
        FROM chat_messages
        WHERE conversation_id=@conversation_id
        ORDER BY created_at ASC
      `);

    res.json({ conversation_id, messages: msgs.recordset });
  } catch (err) {
    console.error("adminGetMessages error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.adminSendMessage = async (req, res) => {
  try {
    const user_id = getUserId(req);
    const { conversation_id, body } = req.body;

    if (!user_id) return res.status(400).json({ error: "Missing x-user-id" });
    if (!conversation_id) return res.status(400).json({ error: "conversation_id required" });
    if (!body || !String(body).trim()) return res.status(400).json({ error: "Message body required" });

    const pool = await getDatabase();

    const inserted = await pool
      .request()
      .input("conversation_id", sql.Int, Number(conversation_id))
      .input("sender_type", sql.NVarChar(20), "user")
      .input("sender_id", sql.Int, user_id)
      .input("body", sql.NVarChar(sql.MAX), body)
      .query(`
        INSERT INTO chat_messages (conversation_id, sender_type, sender_id, body)
        OUTPUT INSERTED.message_id, INSERTED.sender_type, INSERTED.sender_id, INSERTED.body, INSERTED.created_at, INSERTED.is_read
        VALUES (@conversation_id, @sender_type, @sender_id, @body)
      `);

    await pool
      .request()
      .input("conversation_id", sql.Int, Number(conversation_id))
      .query(`UPDATE chat_conversations SET updated_at = SYSDATETIME() WHERE conversation_id=@conversation_id`);

    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversation_id}`).emit("message", inserted.recordset[0]); // open chat
      io.to("admins").emit("message", inserted.recordset[0]); // ✅ inbox update for all admins
    }

    // -------------------- Push notify customer (background/closed) --------------------
    const convo = await pool
      .request()
      .input("conversation_id", sql.Int, Number(conversation_id))
      .query(`SELECT customer_id FROM chat_conversations WHERE conversation_id=@conversation_id`);

    if (convo.recordset.length) {
      const customer_id = convo.recordset[0].customer_id;

      const tokenRow = await pool
        .request()
        .input("customer_id", sql.Int, customer_id)
        .query(`SELECT TOP 1 expo_push_token FROM Customers WHERE customer_id=@customer_id`);

      const token = tokenRow.recordset[0]?.expo_push_token;

      // ✅ Send expo push (this will trigger notification when app is closed/background)
      await sendExpoPush(
        token,
        "Sport Zone",
        body.length > 60 ? body.slice(0, 60) + "..." : body,
        { conversation_id: Number(conversation_id) }
      );
      
      console.log(`📱 Expo push sent to customer ${customer_id}, token: ${token ? "Yes" : "No"}`);
    }

    res.json({ message: inserted.recordset[0] });
  } catch (err) {
    console.error("adminSendMessage error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
