// // // Back_end/routes/jobs.js
// // const express = require("express");
// // const router = express.Router();
// // const path = require("path");
// // const fs = require("fs");
// // const multer = require("multer");
// // const { sql, getDatabase } = require("../config/database");

// // // Ensure uploads dir
// // const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
// // if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// // // Multer storage for CV images
// // const storage = multer.diskStorage({
// //   destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
// //   filename: (_req, file, cb) => {
// //     const ext = path.extname(file.originalname || ".png");
// //     cb(null, `cv_${Date.now()}${ext}`);
// //   }
// // });
// // const upload = multer({ storage });

// // /**
// //  * POST /api/jobs/apply
// //  * Accepts multipart form:
// //  *  - full_name (required)
// //  *  - email (required)
// //  *  - phone (optional)
// //  *  - cv_link (optional)
// //  *  - cv_image (optional file)
// //  */
// // router.post("/apply", upload.single("cv_image"), async (req, res) => {
// //   try {
// //     const { full_name, email, phone, cv_link } = req.body || {};
// //     if (!full_name || !email) {
// //       return res.status(400).json({ error: "full_name and email are required" });
// //     }

// //     const cvImagePath = req.file ? `/uploads/${req.file.filename}` : null;

// //     const pool = await getDatabase();
// //     await pool
// //       .request()
// //       .input("full_name", sql.NVarChar, full_name)
// //       .input("email", sql.NVarChar, email)
// //       .input("phone", sql.NVarChar, phone || null)
// //       .input("cv_link", sql.NVarChar, cv_link || null)
// //       .input("cv_image_path", sql.NVarChar, cvImagePath)
// //       .query(`
// //         INSERT INTO job_applications (full_name, email, phone, cv_link, cv_image_path, status, created_at)
// //         VALUES (@full_name, @email, @phone, @cv_link, @cv_image_path, 'Pending', GETDATE())
// //       `);

// //     res.json({ ok: true, message: "Application submitted" });
// //   } catch (err) {
// //     console.error("POST /jobs/apply error:", err);
// //     res.status(500).json({ error: "Failed to submit application" });
// //   }
// // });

// // /**
// //  * DELETE /api/jobs/applications/:id
// //  * Deletes the application row AND removes uploaded cv image file if exists.
// //  */
// // router.delete("/applications/:id", async (req, res) => {
// //   try {
// //     const id = Number(req.params.id);
// //     if (!id) return res.status(400).json({ error: "Bad id" });

// //     const pool = await getDatabase();

// //     // 1) Get cv_image_path first (so we can delete file)
// //     const r = await pool
// //       .request()
// //       .input("id", sql.Int, id)
// //       .query(`
// //         SELECT cv_image_path
// //         FROM job_applications
// //         WHERE id = @id
// //       `);

// //     const row = r.recordset?.[0];
// //     if (!row) return res.status(404).json({ error: "Application not found" });

// //     const cv_image_path = row.cv_image_path;

// //     // 2) Delete DB row
// //     await pool
// //       .request()
// //       .input("id", sql.Int, id)
// //       .query(`
// //         DELETE FROM job_applications
// //         WHERE id = @id
// //       `);

// //     // 3) Delete file from disk if it exists
// //     if (cv_image_path && typeof cv_image_path === "string") {
// //       // cv_image_path looks like: "/uploads/cv_123.png"
// //       const filename = cv_image_path.replace("/uploads/", "");
// //       const fullPath = path.join(UPLOAD_DIR, filename);

// //       fs.unlink(fullPath, (err) => {
// //         // Don't fail request if file missing
// //         if (err && err.code !== "ENOENT") {
// //           console.error("Failed to delete CV image file:", err);
// //         }
// //       });
// //     }

// //     res.json({ ok: true });
// //   } catch (err) {
// //     console.error("Delete application error:", err);
// //     res.status(500).json({ error: "Failed to delete application" });
// //   }
// // });

// // // GET all applications
// // router.get("/applications", async (_req, res) => {
// //   try {
// //     const pool = await getDatabase();
// //     const result = await pool.request().query(`
// //       SELECT id, full_name, email, phone, cv_link, cv_image_path, status, created_at
// //       FROM job_applications
// //       ORDER BY created_at DESC
// //     `);
// //     res.json({ applications: result.recordset || [] });
// //   } catch (err) {
// //     console.error("GET /jobs/applications error:", err);
// //     res.status(500).json({ error: "Failed to load applications" });
// //   }
// // });

// // // GET single application
// // router.get("/applications/:id", async (req, res) => {
// //   try {
// //     const pool = await getDatabase();
// //     const r = await pool
// //       .request()
// //       .input("id", sql.Int, Number(req.params.id))
// //       .query(`
// //         SELECT id, full_name, email, phone, cv_link, cv_image_path, status, created_at
// //         FROM job_applications WHERE id=@id
// //       `);

// //     const row = r.recordset?.[0];
// //     if (!row) return res.status(404).json({ error: "Not found" });
// //     res.json(row);
// //   } catch (err) {
// //     console.error("GET /jobs/applications/:id error:", err);
// //     res.status(500).json({ error: "Failed to load application" });
// //   }
// // });

// // // PATCH status
// // router.patch("/applications/:id", async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { status } = req.body || {};
// //     const allowed = ["Pending", "Accepted", "Rejected", "Registered"];
// //     if (!allowed.includes(status)) {
// //       return res.status(400).json({ error: "Invalid status" });
// //     }

// //     const pool = await getDatabase();
// //     const result = await pool
// //       .request()
// //       .input("id", sql.Int, Number(id))
// //       .input("status", sql.NVarChar, status)
// //       .query(`
// //         UPDATE job_applications SET status=@status WHERE id=@id;
// //         SELECT id, status FROM job_applications WHERE id=@id;
// //       `);

// //     const row = result.recordset && result.recordset[0];
// //     if (!row) return res.status(404).json({ error: "Application not found" });
// //     res.json({ ok: true, id: row.id, status: row.status });
// //   } catch (err) {
// //     console.error("PATCH /jobs/applications/:id error:", err);
// //     res.status(500).json({ error: "Failed to update status" });
// //   }
// // });

// // /**
// //  * POST /api/jobs/applications/:id/register
// //  * Creates an employee (row in users) from an Accepted application,
// //  * then marks the application as Registered.
// //  */
// // router.post("/applications/:id/register", async (req, res) => {
// //   const appId = Number(req.params.id);
// //   if (!appId) return res.status(400).json({ error: "Bad id" });

// //   const pool = await getDatabase();
// //   const tx = new sql.Transaction(await pool);

// //   try {
// //     await tx.begin();

// //     const r1 = await new sql.Request(tx)
// //       .input("id", sql.Int, appId)
// //       .query(`SELECT * FROM job_applications WHERE id=@id`);

// //     const app = r1.recordset?.[0];
// //     if (!app) throw new Error("Application not found");
// //     if (app.status !== "Accepted") throw new Error("Application is not Accepted");

// //     // Insert to users (adjust columns if needed)
// //     await new sql.Request(tx)
// //       .input("name", sql.NVarChar, app.full_name)
// //       .input("email", sql.NVarChar, app.email)
// //       .input("role", sql.NVarChar, "Employee")
// //       .input("phone", sql.NVarChar, app.phone || null)
// //       .query(`
// //         INSERT INTO users (name, email, role, phone)
// //         VALUES (@name, @email, @role, @phone)
// //       `);

// //     // Mark as Registered
// //     await new sql.Request(tx)
// //       .input("id2", sql.Int, appId)
// //       .query(`UPDATE job_applications SET status='Registered' WHERE id=@id2`);

// //     await tx.commit();
// //     res.json({ ok: true });
// //   } catch (err) {
// //     try {
// //       await tx.rollback();
// //     } catch {}
// //     console.error("POST /jobs/applications/:id/register error:", err);
// //     res.status(500).json({ error: err.message || "Register failed" });
// //   }
// // });

// // module.exports = router;
// // Back_end/routes/jobs.js
// const express = require("express");
// const router = express.Router();
// const path = require("path");
// const fs = require("fs");
// const multer = require("multer");
// const { sql, getDatabase } = require("../config/database");

// // Ensure uploads dir
// const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
// if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// // Multer storage for CV files (images + PDF)
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
//   filename: (_req, file, cb) => {
//     const ext = path.extname(file.originalname || ".png");
//     cb(null, `cv_${Date.now()}${ext}`);
//   }
// });

// // File filter to accept images and PDFs
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|pdf/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);
  
//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Error: Only images (jpeg, jpg, png) and PDF files are allowed'));
//   }
// };

// const upload = multer({ 
//   storage, 
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });

// /**
//  * POST /api/jobs/apply
//  * Accepts multipart form:
//  *  - full_name (required)
//  *  - email (required)
//  *  - phone (optional)
//  *  - cv_link (optional)
//  *  - cv_image (optional file - can be image or PDF)
//  */
// router.post("/apply", upload.single("cv_image"), async (req, res) => {
//   try {
//     const { full_name, email, phone, cv_link } = req.body || {};
//     if (!full_name || !email) {
//       return res.status(400).json({ error: "full_name and email are required" });
//     }

//     const cvFilePath = req.file ? `/uploads/${req.file.filename}` : null;

//     const pool = await getDatabase();
    
//     // Insert and get the inserted ID
//     const result = await pool
//       .request()
//       .input("full_name", sql.NVarChar, full_name)
//       .input("email", sql.NVarChar, email)
//       .input("phone", sql.NVarChar, phone || null)
//       .input("cv_link", sql.NVarChar, cv_link || null)
//       .input("cv_image_path", sql.NVarChar, cvFilePath)
//       .query(`
//         INSERT INTO job_applications (full_name, email, phone, cv_link, cv_image_path, status, created_at)
//         OUTPUT INSERTED.id
//         VALUES (@full_name, @email, @phone, @cv_link, @cv_image_path, 'Pending', GETDATE())
//       `);

//     const newAppId = result.recordset[0].id;

//     // ✅ NEW: Send socket notification to admins
//     const io = req.app.get('socketio');
//     if (io) {
//       io.emit('new-job-application', {
//         id: newAppId,
//         name: full_name,
//         email: email,
//         phone: phone || 'Not provided',
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         date: new Date().toLocaleDateString()
//       });
//       console.log(`📢 Notification sent for job application #${newAppId} from ${full_name}`);
//     }

//     res.json({ ok: true, message: "Application submitted", id: newAppId });
//   } catch (err) {
//     console.error("POST /jobs/apply error:", err);
    
//     // Handle multer file filter errors
//     if (err instanceof multer.MulterError) {
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         return res.status(400).json({ error: "File too large. Maximum size is 5MB" });
//       }
//       return res.status(400).json({ error: err.message });
//     } else if (err.message && err.message.includes('Only images')) {
//       return res.status(400).json({ error: "Only JPG, PNG, and PDF files are allowed" });
//     }
    
//     res.status(500).json({ error: "Failed to submit application" });
//   }
// });
// /**
//  * DELETE /api/jobs/applications/:id
//  * Deletes the application row AND removes uploaded cv file if exists.
//  */
// router.delete("/applications/:id", async (req, res) => {
//   try {
//     const id = Number(req.params.id);
//     if (!id) return res.status(400).json({ error: "Bad id" });

//     const pool = await getDatabase();

//     // 1) Get cv_image_path first (so we can delete file)
//     const r = await pool
//       .request()
//       .input("id", sql.Int, id)
//       .query(`
//         SELECT cv_image_path
//         FROM job_applications
//         WHERE id = @id
//       `);

//     const row = r.recordset?.[0];
//     if (!row) return res.status(404).json({ error: "Application not found" });

//     const cv_image_path = row.cv_image_path;

//     // 2) Delete DB row
//     await pool
//       .request()
//       .input("id", sql.Int, id)
//       .query(`
//         DELETE FROM job_applications
//         WHERE id = @id
//       `);

//     // 3) Delete file from disk if it exists
//     if (cv_image_path && typeof cv_image_path === "string") {
//       // cv_image_path looks like: "/uploads/cv_123.png"
//       const filename = cv_image_path.replace("/uploads/", "");
//       const fullPath = path.join(UPLOAD_DIR, filename);

//       fs.unlink(fullPath, (err) => {
//         // Don't fail request if file missing
//         if (err && err.code !== "ENOENT") {
//           console.error("Failed to delete CV file:", err);
//         }
//       });
//     }

//     res.json({ ok: true });
//   } catch (err) {
//     console.error("Delete application error:", err);
//     res.status(500).json({ error: "Failed to delete application" });
//   }
// });

// // GET all applications
// router.get("/applications", async (_req, res) => {
//   try {
//     const pool = await getDatabase();
//     const result = await pool.request().query(`
//       SELECT id, full_name, email, phone, cv_link, cv_image_path, status, created_at
//       FROM job_applications
//       ORDER BY created_at DESC
//     `);
//     res.json({ applications: result.recordset || [] });
//   } catch (err) {
//     console.error("GET /jobs/applications error:", err);
//     res.status(500).json({ error: "Failed to load applications" });
//   }
// });

// // GET single application
// router.get("/applications/:id", async (req, res) => {
//   try {
//     const pool = await getDatabase();
//     const r = await pool
//       .request()
//       .input("id", sql.Int, Number(req.params.id))
//       .query(`
//         SELECT id, full_name, email, phone, cv_link, cv_image_path, status, created_at
//         FROM job_applications WHERE id=@id
//       `);

//     const row = r.recordset?.[0];
//     if (!row) return res.status(404).json({ error: "Not found" });
//     res.json(row);
//   } catch (err) {
//     console.error("GET /jobs/applications/:id error:", err);
//     res.status(500).json({ error: "Failed to load application" });
//   }
// });

// // PATCH status
// router.patch("/applications/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body || {};
//     const allowed = ["Pending", "Accepted", "Rejected", "Registered"];
//     if (!allowed.includes(status)) {
//       return res.status(400).json({ error: "Invalid status" });
//     }

//     const pool = await getDatabase();
//     const result = await pool
//       .request()
//       .input("id", sql.Int, Number(id))
//       .input("status", sql.NVarChar, status)
//       .query(`
//         UPDATE job_applications SET status=@status WHERE id=@id;
//         SELECT id, status FROM job_applications WHERE id=@id;
//       `);

//     const row = result.recordset && result.recordset[0];
//     if (!row) return res.status(404).json({ error: "Application not found" });
//     res.json({ ok: true, id: row.id, status: row.status });
//   } catch (err) {
//     console.error("PATCH /jobs/applications/:id error:", err);
//     res.status(500).json({ error: "Failed to update status" });
//   }
// });

// /**
//  * POST /api/jobs/applications/:id/register
//  * Creates an employee (row in users) from an Accepted application,
//  * then marks the application as Registered.
//  */
// router.post("/applications/:id/register", async (req, res) => {
//   const appId = Number(req.params.id);
//   if (!appId) return res.status(400).json({ error: "Bad id" });

//   const pool = await getDatabase();
//   const tx = new sql.Transaction(await pool);

//   try {
//     await tx.begin();

//     const r1 = await new sql.Request(tx)
//       .input("id", sql.Int, appId)
//       .query(`SELECT * FROM job_applications WHERE id=@id`);

//     const app = r1.recordset?.[0];
//     if (!app) throw new Error("Application not found");
//     if (app.status !== "Accepted") throw new Error("Application is not Accepted");

//     // Insert to users (adjust columns if needed)
//     await new sql.Request(tx)
//       .input("name", sql.NVarChar, app.full_name)
//       .input("email", sql.NVarChar, app.email)
//       .input("role", sql.NVarChar, "Employee")
//       .input("phone", sql.NVarChar, app.phone || null)
//       .query(`
//         INSERT INTO users (name, email, role, phone)
//         VALUES (@name, @email, @role, @phone)
//       `);

//     // Mark as Registered
//     await new sql.Request(tx)
//       .input("id2", sql.Int, appId)
//       .query(`UPDATE job_applications SET status='Registered' WHERE id=@id2`);

//     await tx.commit();
//     res.json({ ok: true });
//   } catch (err) {
//     try {
//       await tx.rollback();
//     } catch {}
//     console.error("POST /jobs/applications/:id/register error:", err);
//     res.status(500).json({ error: err.message || "Register failed" });
//   }
// });

// module.exports = router;
// Back_end/routes/jobs.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { sql, getDatabase } = require("../config/database");

// Ensure uploads dir
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer storage for CV files (images + PDF)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".png");
    cb(null, `cv_${Date.now()}${ext}`);
  }
});

// File filter to accept images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images (jpeg, jpg, png) and PDF files are allowed'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * POST /api/jobs/apply
 * Accepts multipart form:
 *  - full_name (required)
 *  - email (required)
 *  - phone (optional)
 *  - cv_link (optional)
 *  - cv_image (optional file - can be image or PDF)
 */
router.post("/apply", upload.single("cv_image"), async (req, res) => {
  try {
    const { full_name, email, phone, cv_link } = req.body || {};
    if (!full_name || !email) {
      return res.status(400).json({ error: "full_name and email are required" });
    }

    const cvFilePath = req.file ? `/uploads/${req.file.filename}` : null;

    const pool = await getDatabase();
    
    // Insert and get the inserted ID
    const result = await pool
      .request()
      .input("full_name", sql.NVarChar, full_name)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone || null)
      .input("cv_link", sql.NVarChar, cv_link || null)
      .input("cv_image_path", sql.NVarChar, cvFilePath)
      .query(`
        INSERT INTO job_applications (full_name, email, phone, cv_link, cv_image_path, status, created_at)
        OUTPUT INSERTED.id
        VALUES (@full_name, @email, @phone, @cv_link, @cv_image_path, 'Pending', GETDATE())
      `);

    const newAppId = result.recordset[0].id;

    // ✅ NEW: Send socket notification to admins
    const io = req.app.get('io'); // Changed from 'socketio' to 'io'
    if (io) {
      // Emit to all connected clients (broadcast)
      io.emit('new-job-application', {
        id: newAppId,
        name: full_name,
        email: email,
        phone: phone || 'Not provided',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString()
      });
      
      // Also emit specifically to admin room
      io.to('admins').emit('admin-notification', {
        type: 'job_application',
        id: newAppId,
        name: full_name,
        email: email,
        message: `New job application from ${full_name}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      });
      
      console.log(`📢 Notification sent for job application #${newAppId} from ${full_name}`);
    }

    res.json({ ok: true, message: "Application submitted", id: newAppId });
  } catch (err) {
    console.error("POST /jobs/apply error:", err);
    
    // Handle multer file filter errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File too large. Maximum size is 5MB" });
      }
      return res.status(400).json({ error: err.message });
    } else if (err.message && err.message.includes('Only images')) {
      return res.status(400).json({ error: "Only JPG, PNG, and PDF files are allowed" });
    }
    
    res.status(500).json({ error: "Failed to submit application" });
  }
});

/**
 * DELETE /api/jobs/applications/:id
 * Deletes the application row AND removes uploaded cv file if exists.
 */
router.delete("/applications/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });

    const pool = await getDatabase();

    // 1) Get cv_image_path first (so we can delete file)
    const r = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT cv_image_path
        FROM job_applications
        WHERE id = @id
      `);

    const row = r.recordset?.[0];
    if (!row) return res.status(404).json({ error: "Application not found" });

    const cv_image_path = row.cv_image_path;

    // 2) Delete DB row
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM job_applications
        WHERE id = @id
      `);

    // 3) Delete file from disk if it exists
    if (cv_image_path && typeof cv_image_path === "string") {
      // cv_image_path looks like: "/uploads/cv_123.png"
      const filename = cv_image_path.replace("/uploads/", "");
      const fullPath = path.join(UPLOAD_DIR, filename);

      fs.unlink(fullPath, (err) => {
        // Don't fail request if file missing
        if (err && err.code !== "ENOENT") {
          console.error("Failed to delete CV file:", err);
        }
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Delete application error:", err);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

// GET all applications
router.get("/applications", async (_req, res) => {
  try {
    const pool = await getDatabase();
    const result = await pool.request().query(`
      SELECT id, full_name, email, phone, cv_link, cv_image_path, status, created_at
      FROM job_applications
      ORDER BY created_at DESC
    `);
    res.json({ applications: result.recordset || [] });
  } catch (err) {
    console.error("GET /jobs/applications error:", err);
    res.status(500).json({ error: "Failed to load applications" });
  }
});

// GET single application
router.get("/applications/:id", async (req, res) => {
  try {
    const pool = await getDatabase();
    const r = await pool
      .request()
      .input("id", sql.Int, Number(req.params.id))
      .query(`
        SELECT id, full_name, email, phone, cv_link, cv_image_path, status, created_at
        FROM job_applications WHERE id=@id
      `);

    const row = r.recordset?.[0];
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("GET /jobs/applications/:id error:", err);
    res.status(500).json({ error: "Failed to load application" });
  }
});

// PATCH status
router.patch("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ["Pending", "Accepted", "Rejected", "Registered"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const pool = await getDatabase();
    const result = await pool
      .request()
      .input("id", sql.Int, Number(id))
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE job_applications SET status=@status WHERE id=@id;
        SELECT id, status FROM job_applications WHERE id=@id;
      `);

    const row = result.recordset && result.recordset[0];
    if (!row) return res.status(404).json({ error: "Application not found" });
    res.json({ ok: true, id: row.id, status: row.status });
  } catch (err) {
    console.error("PATCH /jobs/applications/:id error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/**
 * POST /api/jobs/applications/:id/register
 * Creates an employee (row in users) from an Accepted application,
 * then marks the application as Registered.
 */
router.post("/applications/:id/register", async (req, res) => {
  const appId = Number(req.params.id);
  if (!appId) return res.status(400).json({ error: "Bad id" });

  const pool = await getDatabase();
  const tx = new sql.Transaction(await pool);

  try {
    await tx.begin();

    const r1 = await new sql.Request(tx)
      .input("id", sql.Int, appId)
      .query(`SELECT * FROM job_applications WHERE id=@id`);

    const app = r1.recordset?.[0];
    if (!app) throw new Error("Application not found");
    if (app.status !== "Accepted") throw new Error("Application is not Accepted");

    // Insert to users (adjust columns if needed)
    await new sql.Request(tx)
      .input("name", sql.NVarChar, app.full_name)
      .input("email", sql.NVarChar, app.email)
      .input("role", sql.NVarChar, "Employee")
      .input("phone", sql.NVarChar, app.phone || null)
      .query(`
        INSERT INTO users (name, email, role, phone)
        VALUES (@name, @email, @role, @phone)
      `);

    // Mark as Registered
    await new sql.Request(tx)
      .input("id2", sql.Int, appId)
      .query(`UPDATE job_applications SET status='Registered' WHERE id=@id2`);

    await tx.commit();
    res.json({ ok: true });
  } catch (err) {
    try {
      await tx.rollback();
    } catch {}
    console.error("POST /jobs/applications/:id/register error:", err);
    res.status(500).json({ error: err.message || "Register failed" });
  }
});

module.exports = router;