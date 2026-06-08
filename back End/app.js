// // Back_end/app.js
// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// const router = express.Router();

// // ✅ Socket.IO + HTTP server
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Routes
// const authRoutes = require("./routes/auth");
// const employeeRoutes = require("./routes/employees");
// const sportsRoutes = require("./routes/sports");
// const gymRoutes = require("./routes/gym");
// const membersRoutes = require("./routes/members");
// const coachesRoutes = require("./routes/coaches");
// const assignmentsRoutes = require("./routes/assignments");
// const gamingRoutes = require("./routes/gaming");
// const gamingStatsRoutes = require("./routes/gamingStatistics");
// const storeProductsRoutes = require("./routes/storeProducts");
// const storeOpsRoutes = require("./routes/storeOps");
// const storeReservationsRoutes = require("./routes/storeReservations");
// const storeUploadRoutes = require("./routes/storeUpload");
// const storeAISuggestionsRoutes = require("./routes/storeAISuggestions");
// const eventCardsRoutes = require("./routes/eventCards");
// const aiSuggestionsRoutes = require("./routes/aiSuggestions");
// const statisticsRoutes = require("./routes/statistics");
// const jobsRoutes = require("./routes/jobs");
// const idCardsRoutes = require("./routes/idcards");
// const settingsRoutes = require("./routes/settings");
// const uploadsRoutes = require("./routes/uploads");
// const customerRoutes = require("./routes/customerRoutes");
// const storeInvoicesRoutes = require("./routes/storeInvoices");

// // ✅ Chat routes
// const chatRoutes = require("./routes/chatRoutes");
// const gymRemindersRoutes = require("./routes/gymReminders");

// // Mount routes - IMPORTANT: gymRoutes first, then gymRemindersRoutes
// app.use("/api/auth", authRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/sports", sportsRoutes);
// app.use("/api/gym", gymRoutes); // Gym subscription routes
// app.use("/api/gym", gymRemindersRoutes); // Gym reminder routes (AFTER gymRoutes)
// app.use("/api/gym/members", membersRoutes);
// app.use("/api/gym/coaches", coachesRoutes);
// app.use("/api/gym/assignments", assignmentsRoutes);
// app.use("/api/gaming", gamingRoutes);
// //app.use('/api/gaming', gamingRoutes);

// app.use("/api/gaming/statistics", gamingStatsRoutes);
// app.use("/api/customers", customerRoutes);

// app.use("/api/store/products", storeProductsRoutes);
// app.use("/api/store/stock", storeOpsRoutes);
// app.use("/api/store", storeReservationsRoutes);
// app.use("/api/store", storeUploadRoutes);
// app.use("/api/store", storeAISuggestionsRoutes);

// app.use("/api/events", eventCardsRoutes);
// app.use("/api/ai", aiSuggestionsRoutes);
// app.use("/api/statistics", statisticsRoutes);
// app.use("/api/jobs", jobsRoutes);
// app.use("/api/idcards", idCardsRoutes);
// app.use("/api/settings", settingsRoutes);
// app.use("/api/uploads", uploadsRoutes);

// // ✅ Live Chat API
// app.use("/api/chat", chatRoutes);
// app.use("/api/store/invoices", storeInvoicesRoutes);

// // ---------------------------------------------------
// // ✅ Root + Health + Test DB endpoints
// // ---------------------------------------------------
// const { sql, getDatabase } = require("./config/database");

// app.get("/", (_req, res) => {
//   res.json({
//     message: "🏆 Sport Zone Backend Server running!",
//     version: "1.0.0",
//     services: [
//       "Authentication",
//       "Employees",
//       "Sports Reservations",
//       "Gym",
//       "Store",
//       "Gaming",
//     ],
//     endpoints: {
//       auth: "/api/auth",
//       employees: "/api/employees",
//       sports: "/api/sports",
//       gym: "/api/gym",
//       coaches: "/api/gym/coaches",
//       assignments: "/api/gym/assignments",
//       uploads: "/api/uploads",
//       gaming: "/api/gaming",
//       store_products: "/api/store/products",
//       store_ops: "/api/store/stock/in | /api/store/stock/out",
//       store_upload: "/api/store/upload",
//       store_reserve: "/api/store/reserve",
//       chat: "/api/chat",
//       gym_reminders: "/api/gym/subscribers/weekly-plans",
//       test: "/api/test-db",
//       health: "/api/health",
//     },
//   });
// });

// app.get("/downloads/:file", (req, res) => {
//   const filePath = path.join(__dirname, "uploads", "gaming-receipts", req.params.file);
//   res.download(filePath); // forces download
// });

// app.get("/api/health", (_req, res) => {
//   res.json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     services: {
//       auth: "Available ✅",
//       employees: "Available ✅",
//       sports: "Available ✅",
//       gym: "Available ✅",
//       store: "Available ✅",
//       gaming: "Available ✅",
//       chat: "Available ✅",
//       gym_reminders: "Available ✅",
//     },
//   });
// });

// // Simple DB connectivity test
// app.get("/api/test-db", async (_req, res) => {
//   try {
//     const pool = await getDatabase();
//     const r = await pool.request().query("SELECT 1 AS test");
//     res.json({ ok: true, result: r.recordset });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// });

// // ------------------------------
// // ✅ AUTO-EXPIRE JOB (every 5 min)
// // ------------------------------
// async function autoExpireReservations() {
//   try {
//     const pool = await getDatabase();

//     const expiredRes = await pool.request().query(`
//       SELECT * FROM StoreReservations
//       WHERE status='Reserved' AND expires_at < GETDATE()
//     `);

//     const expired = expiredRes.recordset;
//     if (expired.length === 0) return;

//     await pool.request().query(`
//       UPDATE StoreReservations
//       SET status='Expired'
//       WHERE status='Reserved' AND expires_at < GETDATE()
//     `);

//     for (const r of expired) {
//       await pool
//         .request()
//         .input("product_id", sql.Int, r.product_id)
//         .input("quantity", sql.Int, r.quantity)
//         .query(`
//           UPDATE Products
//           SET stock_qty = stock_qty + @quantity
//           WHERE product_id=@product_id
//         `);
//     }

//     console.log(
//       `[AUTO-EXPIRE] Expired ${expired.length} reservations at ${new Date().toISOString()}`
//     );
//   } catch (err) {
//     console.error("[AUTO-EXPIRE] error:", err);
//   }
// }

// // run once at startup then every 5 minutes
// autoExpireReservations();
// setInterval(autoExpireReservations, 5 * 60 * 1000);

// // -------------------- 404 & error handlers --------------------
// app.use((req, res) => {
//   res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
// });

// app.use((err, _req, res, _next) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({ error: "Internal server error" });
// });

// // -------------------- Start server (Socket.IO enabled) --------------------
// const PORT = process.env.PORT || 5000;

// // ✅ Create HTTP server from Express app
// const server = http.createServer(app);

// // ✅ Attach Socket.IO to the HTTP server
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// // ✅ Store connected admin sockets
// const adminSockets = new Set();

// io.on("connection", (socket) => {
//   console.log(`🔌 New socket connection: ${socket.id}`);

//   // ✅ Admin joins a global admins room (for inbox live updates)
//   socket.on("join-admin", () => {
//     socket.join("admins");
//     adminSockets.add(socket.id);
//     console.log(`✅ Admin joined: ${socket.id}, total admins: ${adminSockets.size}`);
//   });

//   // Conversation room (for open chat live updates)
//   socket.on("join", ({ conversationId }) => {
//     if (!conversationId) return;
//     socket.join(`conversation:${conversationId}`);
//     console.log(`👥 Socket ${socket.id} joined conversation:${conversationId}`);
//   });

//   socket.on("leave", ({ conversationId }) => {
//     if (!conversationId) return;
//     socket.leave(`conversation:${conversationId}`);
//     console.log(`👋 Socket ${socket.id} left conversation:${conversationId}`);
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     adminSockets.delete(socket.id);
//     console.log(`❌ Socket disconnected: ${socket.id}, remaining admins: ${adminSockets.size}`);
//   });
// });

// // ✅ Make io available in routes/controllers
// app.set("io", io);

// // ✅ IMPORTANT: listen using server, not app.listen
// server.listen(PORT, () => {
//   console.log(`🚀 Sport Zone Server running on port ${PORT}`);
//   console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
//   console.log(`🗄️  Database Test: http://localhost:${PORT}/api/test-db`);
//   console.log(`⚽ Sports API: http://localhost:${PORT}/api/sports`);
//   console.log(`💪 Gym API: http://localhost:${PORT}/api/gym`);
//   console.log(`🔔 Gym Reminders: http://localhost:${PORT}/api/gym/subscribers/weekly-plans`);
//   console.log(`👨‍🏫 Coaches: http://localhost:${PORT}/api/gym/coaches`);
//   console.log(`🔗 Assignments: http://localhost:${PORT}/api/gym/assignments`);
//   console.log(`📷 Uploads: http://localhost:${PORT}/api/uploads/member-photo`);
//   console.log(`🎮 Gaming API: http://localhost:${PORT}/api/gaming`);
//   console.log(`🛍️ Store Products API: http://localhost:${PORT}/api/store/products`);
//   console.log(`🖼️ Store Upload API: http://localhost:${PORT}/api/store/upload`);
//   console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
// });
// Back_end/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const router = express.Router();

// ✅ Socket.IO + HTTP server
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const sportsRoutes = require("./routes/sports");
const gymRoutes = require("./routes/gym");
const membersRoutes = require("./routes/members");
const coachesRoutes = require("./routes/coaches");
const assignmentsRoutes = require("./routes/assignments");
const gamingRoutes = require("./routes/gaming");
const gamingStatsRoutes = require("./routes/gamingStatistics");
const storeProductsRoutes = require("./routes/storeProducts");
const storeOpsRoutes = require("./routes/storeOps");
const storeReservationsRoutes = require("./routes/storeReservations");
const storeUploadRoutes = require("./routes/storeUpload");
const storeAISuggestionsRoutes = require("./routes/storeAISuggestions");
const eventCardsRoutes = require("./routes/eventCards");
const aiSuggestionsRoutes = require("./routes/aiSuggestions");
const statisticsRoutes = require("./routes/statistics");
const jobsRoutes = require("./routes/jobs");
const idCardsRoutes = require("./routes/idcards");
const settingsRoutes = require("./routes/settings");
const uploadsRoutes = require("./routes/uploads");
const customerRoutes = require("./routes/customerRoutes");
const storeInvoicesRoutes = require("./routes/storeInvoices");
const aiStoreSuggestionMbRoutes = require("./routes/ai_store_saggestion_mb");

// ✅ Chat routes
const chatRoutes = require("./routes/chatRoutes");
const gymRemindersRoutes = require("./routes/gymReminders");
const bookingsHistoryRoutes = require("./routes/bookingsHistory");

const storeStatsWeb = require("./routes/store_stats_web");
app.use("/api", storeStatsWeb);

app.use("/api/bookings", bookingsHistoryRoutes);

// Mount routes - IMPORTANT: gymRoutes first, then gymRemindersRoutes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/sports", sportsRoutes);
app.use("/api/gym", gymRoutes); // Gym subscription routes
app.use("/api/gym", gymRemindersRoutes); // Gym reminder routes (AFTER gymRoutes)
app.use("/api/gym/members", membersRoutes);
app.use("/api/gym/coaches", coachesRoutes);
app.use("/api/gym/assignments", assignmentsRoutes);
app.use("/api/gaming", gamingRoutes);
//app.use('/api/gaming', gamingRoutes);

app.use("/api/gaming/statistics", gamingStatsRoutes);
app.use("/api/customers", customerRoutes);

app.use("/api/store/products", storeProductsRoutes);
app.use("/api/store/stock", storeOpsRoutes);
app.use("/api/store", storeReservationsRoutes);
app.use("/api/store", storeUploadRoutes);
app.use("/api/store", storeAISuggestionsRoutes);
app.use("/api/store", aiStoreSuggestionMbRoutes);

app.use("/api/events", eventCardsRoutes);
app.use("/api/ai", aiSuggestionsRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/idcards", idCardsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/uploads", uploadsRoutes);

// ✅ Live Chat API
app.use("/api/chat", chatRoutes);
app.use("/api/store/invoices", storeInvoicesRoutes);

// ---------------------------------------------------
// ✅ Root + Health + Test DB endpoints
// ---------------------------------------------------
const { sql, getDatabase } = require("./config/database");

app.get("/", (_req, res) => {
  res.json({
    message: "🏆 Sport Zone Backend Server running!",
    version: "1.0.0",
    services: [
      "Authentication",
      "Employees",
      "Sports Reservations",
      "Gym",
      "Store",
      "Gaming",
    ],
    endpoints: {
      auth: "/api/auth",
      employees: "/api/employees",
      sports: "/api/sports",
      gym: "/api/gym",
      coaches: "/api/gym/coaches",
      assignments: "/api/gym/assignments",
      uploads: "/api/uploads",
      gaming: "/api/gaming",
      store_products: "/api/store/products",
      store_ops: "/api/store/stock/in | /api/store/stock/out",
      store_upload: "/api/store/upload",
      store_reserve: "/api/store/reserve",
      chat: "/api/chat",
      gym_reminders: "/api/gym/subscribers/weekly-plans",
      test: "/api/test-db",
      health: "/api/health",
    },
  });
});

app.get("/downloads/:file", (req, res) => {
  const filePath = path.join(__dirname, "uploads", "gaming-receipts", req.params.file);
  res.download(filePath); // forces download
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      auth: "Available ✅",
      employees: "Available ✅",
      sports: "Available ✅",
      gym: "Available ✅",
      store: "Available ✅",
      gaming: "Available ✅",
      chat: "Available ✅",
      gym_reminders: "Available ✅",
    },
  });
});

// Simple DB connectivity test
app.get("/api/test-db", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const r = await pool.request().query("SELECT 1 AS test");
    res.json({ ok: true, result: r.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------------------------
// ✅ AUTO-EXPIRE JOB (every 5 min) - MULTI-ITEM SAFE
// ------------------------------
async function autoExpireReservations() {
  try {
    const pool = await getDatabase();

    // 1) Find expired reservation ids
    const expiredRes = await pool.request().query(`
      SELECT reservation_id
      FROM StoreReservations
      WHERE status='Reserved' AND expires_at < GETDATE()
    `);

    const expired = expiredRes.recordset || [];
    if (expired.length === 0) return;

    // 2) Mark them expired
    await pool.request().query(`
      UPDATE StoreReservations
      SET status='Expired'
      WHERE status='Reserved' AND expires_at < GETDATE()
    `);

    // 3) Restore stock based on StoreReservationItems
    for (const row of expired) {
      const reservationId = row.reservation_id;

      const itemsRes = await pool
        .request()
        .input("reservation_id", sql.Int, reservationId)
        .query(`
          SELECT product_id, SUM(quantity) AS qty
          FROM StoreReservationItems
          WHERE reservation_id = @reservation_id
          GROUP BY product_id
        `);

      const items = itemsRes.recordset || [];
      for (const it of items) {
        await pool
          .request()
          .input("product_id", sql.Int, it.product_id)
          .input("qty", sql.Int, it.qty)
          .query(`
            UPDATE Products
            SET stock_qty = stock_qty + @qty
            WHERE product_id=@product_id
          `);
      }
    }

    console.log(
      `[AUTO-EXPIRE] Expired ${expired.length} reservations at ${new Date().toISOString()}`
    );
  } catch (err) {
    console.error("[AUTO-EXPIRE] error:", err);
  }
}

// run once at startup then every 5 minutes
autoExpireReservations();
setInterval(autoExpireReservations, 5 * 60 * 1000);

// -------------------- 404 & error handlers --------------------
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// -------------------- Start server (Socket.IO enabled) --------------------
const PORT = process.env.PORT || 5000;

// ✅ Create HTTP server from Express app
const server = http.createServer(app);

// ✅ Attach Socket.IO to the HTTP server
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ✅ Store connected admin sockets
const adminSockets = new Set();

io.on("connection", (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // ✅ Admin joins a global admins room (for inbox live updates)
  socket.on("join-admin", () => {
    socket.join("admins");
    adminSockets.add(socket.id);
    console.log(`✅ Admin joined: ${socket.id}, total admins: ${adminSockets.size}`);
  });

  // Conversation room (for open chat live updates)
  socket.on("join", ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(`conversation:${conversationId}`);
    console.log(`👥 Socket ${socket.id} joined conversation:${conversationId}`);
  });

  socket.on("leave", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
    console.log(`👋 Socket ${socket.id} left conversation:${conversationId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    adminSockets.delete(socket.id);
    console.log(`❌ Socket disconnected: ${socket.id}, remaining admins: ${adminSockets.size}`);
  });
});

// ✅ Make io available in routes/controllers
app.set("io", io);

// ✅ IMPORTANT: listen using server, not app.listen
server.listen(PORT, () => {
  console.log(`🚀 Sport Zone Server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🗄️  Database Test: http://localhost:${PORT}/api/test-db`);
  console.log(`⚽ Sports API: http://localhost:${PORT}/api/sports`);
  console.log(`💪 Gym API: http://localhost:${PORT}/api/gym`);
  console.log(`🔔 Gym Reminders: http://localhost:${PORT}/api/gym/subscribers/weekly-plans`);
  console.log(`👨‍🏫 Coaches: http://localhost:${PORT}/api/gym/coaches`);
  console.log(`🔗 Assignments: http://localhost:${PORT}/api/gym/assignments`);
  console.log(`📷 Uploads: http://localhost:${PORT}/api/uploads/member-photo`);
  console.log(`🎮 Gaming API: http://localhost:${PORT}/api/gaming`);
  console.log(`🛍️ Store Products API: http://localhost:${PORT}/api/store/products`);
  console.log(`🖼️ Store Upload API: http://localhost:${PORT}/api/store/upload`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
});
