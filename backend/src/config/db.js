const mysql = require('mysql2/promise');

// Konfigurasi koneksi MySQL
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'warkop_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+07:00',
});

// Test koneksi saat startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected — host:', process.env.DB_HOST || 'localhost');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.code || err.message || err);
    console.error(`👉 Pastikan server MySQL berjalan di ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306} dan database '${process.env.DB_NAME || 'warkop_db'}' sudah dibuat.`);
    process.exit(1); // Hentikan server jika DB tidak bisa terkoneksi
  }
}

module.exports = { pool, testConnection };

