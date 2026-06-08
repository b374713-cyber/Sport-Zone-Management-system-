// // Back_end/routes/assignments.js
// const express = require('express');
// const sql = require('mssql');
// const router = express.Router();
// require('dotenv').config();

// const dbConfig = {
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   server: process.env.DB_SERVER,
//   database: process.env.DB_DATABASE,
//   options: { encrypt: true, trustServerCertificate: true },
//   port: Number(process.env.DB_PORT || 14330)
// };

// // Small helper: open pool once per request
// async function getPool() {
//   return sql.connect(dbConfig);
// }

// /* POST /api/gym/assignments
//    body: { coach_id, member_id, notes? }
//    Ends any active assignment (end_date IS NULL) then creates a new row.
// */
// router.post('/', async (req, res) => {
//   const { coach_id, member_id, notes } = req.body || {};
//   if (!coach_id || !member_id) {
//     return res.status(400).json({ error: 'coach_id and member_id are required' });
//   }

//   const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
//   let pool, tx;

//   try {
//     pool = await getPool();
//     tx = new sql.Transaction(pool);
//     await tx.begin();

//     // 1) End current active (if any)
//     await new sql.Request(tx)
//       .input('member_id', sql.Int, Number(member_id))
//       .query(`
//         UPDATE dbo.CoachMemberAssignments
//            SET end_date = CAST(GETDATE() AS DATE),
//                status   = N'Ended'
//          WHERE member_id = @member_id
//            AND end_date IS NULL;
//       `);

//     // 2) Insert new active
//     const r = await new sql.Request(tx)
//       .input('coach_id',  sql.Int, Number(coach_id))
//       .input('member_id', sql.Int, Number(member_id))
//       .input('start_date', sql.Date, today)
//       .input('status', sql.NVarChar(50), 'Active')
//       .input('notes', sql.NVarChar(sql.MAX), notes || null)
//       .query(`
//         INSERT INTO dbo.CoachMemberAssignments
//           (coach_id, member_id, start_date, end_date, status, notes, created_at)
//         OUTPUT inserted.assignment_id, inserted.coach_id, inserted.member_id,
//                inserted.start_date, inserted.end_date, inserted.status, inserted.notes, inserted.created_at
//         VALUES (@coach_id, @member_id, @start_date, NULL, @status, @notes, SYSDATETIME());
//       `);

//     await tx.commit();
//     return res.json({ assignment: r.recordset?.[0] ?? null });
//   } catch (err) {
//     if (tx) try { await tx.rollback(); } catch {}
//     console.error('POST /api/gym/assignments error ->', err); // 👈 will show exact SQL error
//     return res.status(500).json({ error: 'Failed to assign coach' });
//   } finally {
//     try { if (pool) await pool.close(); } catch {}
//   }
// });
// /////////////////////////////

// /* POST /api/gym/assignments/end
//    body: { assignment_id }   OR   { member_id } (optional)
//    Ends an active assignment by id (recommended) or ends the current active for member.
// */
// router.post("/end", async (req, res) => {
//   const { assignment_id, member_id } = req.body || {};

//   if (!assignment_id && !member_id) {
//     return res.status(400).json({ error: "assignment_id or member_id is required" });
//   }

//   let pool;
//   try {
//     pool = await getPool();

//     let q = "";
//     const r = await pool.request();

//     if (assignment_id) {
//       r.input("assignment_id", sql.Int, Number(assignment_id));
//       q = `
//         UPDATE dbo.CoachMemberAssignments
//            SET end_date = CAST(GETDATE() AS DATE),
//                status   = N'Ended'
//          OUTPUT INSERTED.*
//          WHERE assignment_id = @assignment_id
//            AND end_date IS NULL;
//       `;
//     } else {
//       r.input("member_id", sql.Int, Number(member_id));
//       q = `
//         UPDATE dbo.CoachMemberAssignments
//            SET end_date = CAST(GETDATE() AS DATE),
//                status   = N'Ended'
//          OUTPUT INSERTED.*
//          WHERE member_id = @member_id
//            AND end_date IS NULL;
//       `;
//     }

//     const result = await r.query(q);

//     if (!result.recordset || result.recordset.length === 0) {
//       return res.status(404).json({ error: "No active assignment found to end" });
//     }

//     return res.json({ ok: true, ended: result.recordset[0] });
//   } catch (err) {
//     console.error("POST /api/gym/assignments/end error ->", err);
//     return res.status(500).json({ error: "Failed to unassign" });
//   } finally {
//     try { if (pool) await pool.close(); } catch {}
//   }
// });

// /* GET: quick debug helpers */
// router.get('/by-coach/:coach_id', async (req, res) => {
//   const id = Number(req.params.coach_id);
//   try {
//     const pool = await getPool();
//     const r = await pool.request()
//       .input('coach_id', sql.Int, id)
//       .query(`
//         SELECT a.*, m.full_name AS member_name, m.phone AS member_phone
//         FROM dbo.CoachMemberAssignments a
//         JOIN dbo.GymMembers m ON m.member_id = a.member_id
//         WHERE a.coach_id = @coach_id
//           AND a.end_date IS NULL
//           AND a.status = N'Active'
//         ORDER BY a.start_date DESC;
//       `);

//     res.json({ assignments: r.recordset ?? [] });
//     await pool.close();
//   } catch (err) {
//     console.error('GET /assignments/by-coach error ->', err);
//     res.status(500).json({ error: 'Failed to load assignments' });
//   }
// });

// /* PATCH /api/gym/assignments/:id/end
//    Ends ONE active assignment row by assignment_id
// */
// router.patch("/:id/end", async (req, res) => {
//   const id = Number(req.params.id);
//   if (!id) return res.status(400).json({ error: "Invalid assignment id" });

//   let pool;
//   try {
//     pool = await getPool();

//     const r = await pool.request()
//       .input("id", sql.Int, id)
//       .query(`
//         UPDATE dbo.CoachMemberAssignments
//            SET end_date = CAST(GETDATE() AS DATE),
//                status   = N'Ended'
//          OUTPUT inserted.assignment_id, inserted.coach_id, inserted.member_id,
//                 inserted.start_date, inserted.end_date, inserted.status, inserted.notes, inserted.created_at
//          WHERE assignment_id = @id
//            AND end_date IS NULL;
//       `);

//     if (!r.recordset || r.recordset.length === 0) {
//       return res.status(404).json({ error: "No active assignment found to end" });
//     }

//     return res.json({ assignment: r.recordset[0] });
//   } catch (err) {
//     console.error("PATCH /api/gym/assignments/:id/end error ->", err);
//     return res.status(500).json({ error: "Failed to unassign" });
//   } finally {
//     try { if (pool) await pool.close(); } catch {}
//   }
// });

// router.get('/by-member/:member_id', async (req, res) => {
//   const id = Number(req.params.member_id);
//   try {
//     const pool = await getPool();
//     const r = await pool.request()
//       .input('member_id', sql.Int, id)
//       .query(`
//         SELECT a.*, c.full_name AS coach_name, c.specialties
//         FROM dbo.CoachMemberAssignments a
//         JOIN dbo.Coaches c ON c.coach_id = a.coach_id
//         WHERE a.member_id = @member_id
//         ORDER BY a.end_date ASC, a.start_date DESC;
//       `);
//     res.json({ assignments: r.recordset ?? [] });
//     await pool.close();
//   } catch (err) {
//     console.error('GET /assignments/by-member error ->', err);
//     res.status(500).json({ error: 'Failed to load assignments' });
//   }
// });

// module.exports = router;
// Back_end/routes/assignments.js
const express = require('express');
const sql = require('mssql');
const router = express.Router();
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true },
  port: Number(process.env.DB_PORT || 14330)
};

// Small helper: open pool once per request
async function getPool() {
  return sql.connect(dbConfig);
}

/* POST /api/gym/assignments
   body: { coach_id, member_id, notes? }
   Ends any active assignment (end_date IS NULL) then creates a new row.
*/
router.post('/', async (req, res) => {
  const { coach_id, member_id, notes } = req.body || {};
  if (!coach_id || !member_id) {
    return res.status(400).json({ error: 'coach_id and member_id are required' });
  }

  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  let pool, tx;

  try {
    pool = await getPool();
    tx = new sql.Transaction(pool);
    await tx.begin();

    // 1) End current active (if any)
    await new sql.Request(tx)
      .input('member_id', sql.Int, Number(member_id))
      .query(`
        UPDATE dbo.CoachMemberAssignments
           SET end_date = CAST(GETDATE() AS DATE),
               status   = N'Ended'
         WHERE member_id = @member_id
           AND end_date IS NULL;
      `);

    // 2) Insert new active
    const r = await new sql.Request(tx)
      .input('coach_id',  sql.Int, Number(coach_id))
      .input('member_id', sql.Int, Number(member_id))
      .input('start_date', sql.Date, today)
      .input('status', sql.NVarChar(50), 'Active')
      .input('notes', sql.NVarChar(sql.MAX), notes || null)
      .query(`
        INSERT INTO dbo.CoachMemberAssignments
          (coach_id, member_id, start_date, end_date, status, notes, created_at)
        OUTPUT inserted.assignment_id, inserted.coach_id, inserted.member_id,
               inserted.start_date, inserted.end_date, inserted.status, inserted.notes, inserted.created_at
        VALUES (@coach_id, @member_id, @start_date, NULL, @status, @notes, SYSDATETIME());
      `);

    await tx.commit();
    return res.json({ assignment: r.recordset?.[0] ?? null });
  } catch (err) {
    if (tx) try { await tx.rollback(); } catch {}
    console.error('POST /api/gym/assignments error ->', err); // 👈 will show exact SQL error
    return res.status(500).json({ error: 'Failed to assign coach' });
  } finally {
    try { if (pool) await pool.close(); } catch {}
  }
});
/////////////////////////////

/* POST /api/gym/assignments/end
   body: { assignment_id }   OR   { member_id } (optional)
   Ends an active assignment by id (recommended) or ends the current active for member.
*/
router.post("/end", async (req, res) => {
  const { assignment_id, member_id } = req.body || {};

  if (!assignment_id && !member_id) {
    return res.status(400).json({ error: "assignment_id or member_id is required" });
  }

  let pool;
  try {
    pool = await getPool();

    let q = "";
    const r = await pool.request();

    if (assignment_id) {
      r.input("assignment_id", sql.Int, Number(assignment_id));
      q = `
        UPDATE dbo.CoachMemberAssignments
           SET end_date = CAST(GETDATE() AS DATE),
               status   = N'Ended'
         OUTPUT INSERTED.*
         WHERE assignment_id = @assignment_id
           AND end_date IS NULL;
      `;
    } else {
      r.input("member_id", sql.Int, Number(member_id));
      q = `
        UPDATE dbo.CoachMemberAssignments
           SET end_date = CAST(GETDATE() AS DATE),
               status   = N'Ended'
         OUTPUT INSERTED.*
         WHERE member_id = @member_id
           AND end_date IS NULL;
      `;
    }

    const result = await r.query(q);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: "No active assignment found to end" });
    }

    return res.json({ ok: true, ended: result.recordset[0] });
  } catch (err) {
    console.error("POST /api/gym/assignments/end error ->", err);
    return res.status(500).json({ error: "Failed to unassign" });
  } finally {
    try { if (pool) await pool.close(); } catch {}
  }
});

/* GET: quick debug helpers */
router.get('/by-coach/:coach_id', async (req, res) => {
  const id = Number(req.params.coach_id);
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('coach_id', sql.Int, id)
      .query(`
        SELECT a.*, m.full_name AS member_name, m.phone AS member_phone
        FROM dbo.CoachMemberAssignments a
        JOIN dbo.GymMembers m ON m.member_id = a.member_id
        WHERE a.coach_id = @coach_id
          AND a.end_date IS NULL
          AND a.status = N'Active'
        ORDER BY a.start_date DESC;
      `);

    res.json({ assignments: r.recordset ?? [] });
    await pool.close();
  } catch (err) {
    console.error('GET /assignments/by-coach error ->', err);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

/* PATCH /api/gym/assignments/:id/end
   Ends ONE active assignment row by assignment_id
*/
router.patch("/:id/end", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid assignment id" });

  let pool;
  try {
    pool = await getPool();

    const r = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE dbo.CoachMemberAssignments
           SET end_date = CAST(GETDATE() AS DATE),
               status   = N'Ended'
         OUTPUT inserted.assignment_id, inserted.coach_id, inserted.member_id,
                inserted.start_date, inserted.end_date, inserted.status, inserted.notes, inserted.created_at
         WHERE assignment_id = @id
           AND end_date IS NULL;
      `);

    if (!r.recordset || r.recordset.length === 0) {
      return res.status(404).json({ error: "No active assignment found to end" });
    }

    return res.json({ assignment: r.recordset[0] });
  } catch (err) {
    console.error("PATCH /api/gym/assignments/:id/end error ->", err);
    return res.status(500).json({ error: "Failed to unassign" });
  } finally {
    try { if (pool) await pool.close(); } catch {}
  }
});

/* GET /api/gym/assignments/by-member/:member_id
   Get ALL assignments for a member (both active and ended)
*/
router.get('/by-member/:member_id', async (req, res) => {
  const id = Number(req.params.member_id);
  const { status } = req.query; // Optional filter: ?status=Active
  
  try {
    const pool = await getPool();
    let query = `
      SELECT a.*, c.full_name AS coach_name, c.specialties
      FROM dbo.CoachMemberAssignments a
      JOIN dbo.Coaches c ON c.coach_id = a.coach_id
      WHERE a.member_id = @member_id
    `;
    
    const request = pool.request().input('member_id', sql.Int, id);
    
    // Add status filter if provided
    if (status === 'Active') {
      query += ` AND a.end_date IS NULL AND a.status = N'Active'`;
    } else if (status === 'Ended') {
      query += ` AND a.end_date IS NOT NULL AND a.status = N'Ended'`;
    }
    
    query += ` ORDER BY a.end_date ASC, a.start_date DESC;`;
    
    const r = await request.query(query);
    res.json({ assignments: r.recordset ?? [] });
    await pool.close();
  } catch (err) {
    console.error('GET /assignments/by-member error ->', err);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});
/* GET /api/gym/assignments/for-customer/:customer_id
   Get assignments for a customer (via their GymMember record)
*/
router.get('/for-customer/:customer_id', async (req, res) => {
  const customerId = Number(req.params.customer_id);
  
  try {
    const pool = await getPool();
    
    // First, find the GymMember associated with this customer
    const memberQuery = await pool.request()
      .input('customer_id', sql.Int, customerId)
      .query(`
        SELECT gm.member_id, gm.full_name, gm.email
        FROM dbo.Customers c
        LEFT JOIN dbo.GymMembers gm ON gm.email = c.email
        WHERE c.customer_id = @customer_id
        ORDER BY gm.created_at DESC
      `);
    
    const member = memberQuery.recordset?.[0];
    
    if (!member || !member.member_id) {
      return res.json({ 
        assignments: [], 
        member: null, 
        message: 'No gym member record found for this customer' 
      });
    }
    
    // Get assignments for this member
    const assignmentsQuery = await pool.request()
      .input('member_id', sql.Int, member.member_id)
      .query(`
        SELECT 
          a.*, 
          c.full_name AS coach_name,
          c.photo_url AS coach_photo,
          c.specialties,
          c.experience_years,
          c.hourly_rate
        FROM dbo.CoachMemberAssignments a
        JOIN dbo.Coaches c ON c.coach_id = a.coach_id
        WHERE a.member_id = @member_id
        ORDER BY a.start_date DESC
      `);
    
    res.json({ 
      assignments: assignmentsQuery.recordset || [], 
      member: member 
    });
    
    await pool.close();
  } catch (err) {
    console.error('GET /assignments/for-customer error ->', err);
    res.status(500).json({ error: 'Failed to load customer assignments' });
  }
});

/* GET /api/gym/coaches/available
   Get all active coaches (for customer to choose from)
*/
router.get('/coaches/available', async (req, res) => {
  const { member_id } = req.query;
  
  try {
    const pool = await getPool();
    const request = pool.request();
    
    let query = `
      SELECT 
        c.*,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM dbo.CoachMemberAssignments a 
            WHERE a.coach_id = c.coach_id 
              AND a.member_id = @member_id 
              AND a.end_date IS NULL
          ) THEN 1 
          ELSE 0 
        END AS is_assigned_to_me
      FROM dbo.Coaches c
      WHERE c.status = 'Active'
    `;
    
    if (member_id) {
      request.input('member_id', sql.Int, Number(member_id));
    } else {
      request.input('member_id', sql.Int, null);
    }
    
    const result = await request.query(query);
    res.json({ coaches: result.recordset || [] });
    await pool.close();
  } catch (err) {
    console.error('GET /coaches/available error ->', err);
    res.status(500).json({ error: 'Failed to load coaches' });
  }
});
module.exports = router;