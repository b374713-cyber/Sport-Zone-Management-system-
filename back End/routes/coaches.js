// Back_end/routes/coaches.js
const express = require('express');
const sql = require('mssql');
const { getDatabase } = require('../config/database');

const router = express.Router();

/* GET /api/gym/coaches */
router.get('/', async (_req, res) => {
  try {
    const pool = await getDatabase();
    const rs = await pool.request().query(`
      SELECT coach_id,
             full_name,
             phone,
             email,
             specialties,
             experience_years,
             certifications,
             hourly_rate,
             bio,
             status,
             photo_url,      -- ✅ include photo
             created_at
      FROM dbo.Coaches
      ORDER BY coach_id DESC;
    `);
    res.json({ coaches: rs.recordset });
  } catch (err) {
    console.error('Coaches list error:', err);
    res.status(500).json({ error: 'Failed to load coaches' });
  }
});

/* POST /api/gym/coaches */
router.post('/', async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      specialties,
      experience_years = 0,
      certifications,
      hourly_rate = null,
      bio,
      status = 'Active',
      photo_url = null
    } = req.body;

    if (!full_name || !specialties) {
      return res.status(400).json({ error: 'full_name and specialties are required' });
    }

    const pool = await getDatabase();
    const rs = await pool.request()
      .input('full_name',        sql.NVarChar(150), String(full_name))
      .input('phone',            phone == null ? null : sql.NVarChar(20), phone)
      .input('email',            email == null ? null : sql.NVarChar(120), email)
      .input('specialties',      sql.NVarChar(200), String(specialties))
      .input('experience_years', sql.Int, Number(experience_years) || 0)
      .input('certifications',   certifications == null ? null : sql.NVarChar(200), certifications)
      .input('hourly_rate',      hourly_rate == null ? null : sql.Decimal(10,2), hourly_rate)
      .input('bio',              bio == null ? null : sql.NVarChar(sql.MAX), bio)
      .input('status',           sql.NVarChar(50), String(status))
      .input('photo_url',        photo_url == null ? null : sql.NVarChar(500), photo_url)
      .query(`
        INSERT INTO dbo.Coaches
          (full_name, phone, email, specialties, experience_years,
           certifications, hourly_rate, bio, status, photo_url)
        OUTPUT INSERTED.*
        VALUES
          (@full_name, @phone, @email, @specialties, @experience_years,
           @certifications, @hourly_rate, @bio, @status, @photo_url);
      `);

    res.status(201).json({ coach: rs.recordset[0] });
  } catch (err) {
    console.error('Coach create error:', err);
    res.status(500).json({ error: 'Failed to add coach' });
  }
});

/* PUT /api/gym/coaches/:id */
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      full_name,
      phone,
      email,
      specialties,
      experience_years = 0,
      certifications,
      hourly_rate = null,
      bio,
      status = 'Active',
      photo_url = null
    } = req.body;

    const pool = await getDatabase();
    const rs = await pool.request()
      .input('id',               sql.Int, id)
      .input('full_name',        sql.NVarChar(150), String(full_name))
      .input('phone',            phone == null ? null : sql.NVarChar(20), phone)
      .input('email',            email == null ? null : sql.NVarChar(120), email)
      .input('specialties',      sql.NVarChar(200), String(specialties))
      .input('experience_years', sql.Int, Number(experience_years) || 0)
      .input('certifications',   certifications == null ? null : sql.NVarChar(200), certifications)
      .input('hourly_rate',      hourly_rate == null ? null : sql.Decimal(10,2), hourly_rate)
      .input('bio',              bio == null ? null : sql.NVarChar(sql.MAX), bio)
      .input('status',           sql.NVarChar(50), String(status))
      .input('photo_url',        photo_url == null ? null : sql.NVarChar(500), photo_url)
      .query(`
        UPDATE dbo.Coaches
        SET full_name        = @full_name,
            phone            = @phone,
            email            = @email,
            specialties      = @specialties,
            experience_years = @experience_years,
            certifications   = @certifications,
            hourly_rate      = @hourly_rate,
            bio              = @bio,
            status           = @status,
            photo_url        = @photo_url
        OUTPUT INSERTED.*
        WHERE coach_id = @id;
      `);

    res.json({ coach: rs.recordset[0] });
  } catch (err) {
    console.error('Coach update error:', err);
    res.status(500).json({ error: 'Failed to update coach' });
  }
});

/* DELETE /api/gym/coaches/:id */
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = await getDatabase();
    await pool.request().input('id', sql.Int, id)
      .query(`DELETE FROM dbo.Coaches WHERE coach_id=@id;`);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Coach delete error:', err);
    res.status(500).json({ error: 'Failed to delete coach' });
  }
});

module.exports = router;
