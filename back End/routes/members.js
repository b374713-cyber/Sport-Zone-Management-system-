// Back_end/routes/members.js
const express = require('express');
const router = express.Router();
const { sql, getDatabase } = require('../config/database');

/** GET /api/gym/members */
router.get('/', async (_req, res) => {
  try {
    const pool = await getDatabase();
    const rs = await pool.request().query(`
      SELECT member_id, full_name, phone, email, gender, birth_date, height_cm, weight_kg,
             photo_url, notes, status, created_at
      FROM dbo.GymMembers
      ORDER BY member_id DESC;
    `);
    res.json({ members: rs.recordset });
  } catch (err) {
    console.error('Members list error:', err);
    res.status(500).json({ error: 'Failed to load members' });
  }
});

/** GET /api/gym/members/:id (with current coach if any) */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = await getDatabase();

    const member = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 1 *
        FROM dbo.GymMembers
        WHERE member_id = @id;
      `);

    const coach = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 1 c.coach_id, c.full_name, c.photo_url, a.start_date, a.status
        FROM dbo.CoachMemberAssignments a
        JOIN dbo.Coaches c ON c.coach_id = a.coach_id
        WHERE a.member_id = @id AND a.status = N'Active'
        ORDER BY a.assignment_id DESC;
      `);

    res.json({ member: member.recordset[0] || null, currentCoach: coach.recordset[0] || null });
  } catch (err) {
    console.error('Member profile error:', err);
    res.status(500).json({ error: 'Failed to load member' });
  }
});

/** POST /api/gym/members */
router.post('/', async (req, res) => {
  try {
    const {
      full_name, phone, email, gender, birth_date, height_cm, weight_kg, photo_url, notes, status = 'Active'
    } = req.body;

    if (!full_name) return res.status(400).json({ error: 'full_name is required' });

    const pool = await getDatabase();
    const rs = await pool.request()
      .input('full_name', sql.NVarChar(150), String(full_name))
      .input('phone',     phone == null ? null : sql.NVarChar(20), phone)
      .input('email',     email == null ? null : sql.NVarChar(120), email)
      .input('gender',    gender == null ? null : sql.NVarChar(20), gender)
      .input('birth_date',birth_date == null ? null : sql.Date, birth_date)
      .input('height_cm', height_cm == null ? null : sql.Int, height_cm)
      .input('weight_kg', weight_kg == null ? null : sql.Decimal(5,2), weight_kg)
      .input('photo_url', photo_url == null ? null : sql.NVarChar(400), photo_url)
      .input('notes',     notes == null ? null : sql.NVarChar(sql.MAX), notes)
      .input('status',    sql.NVarChar(50), String(status))
      .query(`
        INSERT INTO dbo.GymMembers
          (full_name, phone, email, gender, birth_date, height_cm, weight_kg, photo_url, notes, status)
        OUTPUT INSERTED.*
        VALUES (@full_name, @phone, @email, @gender, @birth_date, @height_cm, @weight_kg, @photo_url, @notes, @status);
      `);

    res.status(201).json({ member: rs.recordset[0] });
  } catch (err) {
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

/** PUT /api/gym/members/:id */
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      full_name, phone, email, gender, birth_date, height_cm, weight_kg, photo_url, notes, status = 'Active'
    } = req.body;

    const pool = await getDatabase();
    const rs = await pool.request()
      .input('id',        sql.Int, id)
      .input('full_name', sql.NVarChar(150), String(full_name))
      .input('phone',     phone == null ? null : sql.NVarChar(20), phone)
      .input('email',     email == null ? null : sql.NVarChar(120), email)
      .input('gender',    gender == null ? null : sql.NVarChar(20), gender)
      .input('birth_date',birth_date == null ? null : sql.Date, birth_date)
      .input('height_cm', sql.Int, height_cm == null ? null : Number(height_cm))
      .input('weight_kg', weight_kg == null ? null : sql.Decimal(5,2), weight_kg)
      .input('photo_url', photo_url == null ? null : sql.NVarChar(400), photo_url)
      .input('notes',     notes == null ? null : sql.NVarChar(sql.MAX), notes)
      .input('status',    sql.NVarChar(50), String(status))
      .query(`
        UPDATE dbo.GymMembers
           SET full_name=@full_name, phone=@phone, email=@email, gender=@gender, birth_date=@birth_date,
               height_cm=@height_cm, weight_kg=@weight_kg, photo_url=@photo_url, notes=@notes, status=@status
        OUTPUT INSERTED.*
         WHERE member_id=@id;
      `);

    res.json({ member: rs.recordset[0] });
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

/** DELETE /api/gym/members/:id */
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = await getDatabase();
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM dbo.GymMembers WHERE member_id=@id;');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

module.exports = router;
