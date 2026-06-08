// Back_end/routes/settings.js
const express = require('express');
const router = express.Router();
const { sql, getDatabase } = require('../config/database');

// GET current flag
router.get('/hiring', async (_req, res) => {
  try {
    const pool = await getDatabase();
    const r = await pool.request().query(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'hiring_open'
    `);
    const raw = (r.recordset[0]?.setting_value || 'false').toString().toLowerCase();
    const val = raw === 'true' || raw === '1';
    res.json({ hiring_open: val });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read hiring flag' });
  }
});

// PUT toggle flag  { open: true|false }
router.put('/hiring', async (req, res) => {
  try {
    const open = Boolean(req.body?.open);
    const pool = await getDatabase();
    await pool.request()
      .input('val', sql.NVarChar, open ? 'true' : 'false')
      .query(`
        MERGE system_settings AS t
        USING (SELECT 'hiring_open' AS setting_key) AS s
        ON (t.setting_key = s.setting_key)
        WHEN MATCHED THEN UPDATE SET setting_value = @val, updated_at = SYSDATETIME()
        WHEN NOT MATCHED THEN INSERT (setting_key, setting_value) VALUES ('hiring_open', @val);
      `);
    res.json({ hiring_open: open });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update hiring flag' });
  }
});

module.exports = router;
