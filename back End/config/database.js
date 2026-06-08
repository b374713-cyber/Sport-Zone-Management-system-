// Back_end/config/database.js
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true },
  port: Number(process.env.DB_PORT || 14330),
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let poolPromise;

/** Reuse a single pool across the whole app */
async function getDatabase() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then(pool => {
        console.log('✅ SQL pool connected');
        return pool;
      })
      .catch(err => {
        console.error('❌ SQL pool connect error:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getDatabase };
