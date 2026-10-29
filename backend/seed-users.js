require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

async function seed() {
  console.log('🌱 Menyiapkan akun default admin & kasir...');

  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const cashierPassword = await bcrypt.hash('kasir123', 10);

    // Insert or update Admin
    await pool.query(`
      INSERT INTO users (name, email, password, role, is_active)
      VALUES (?, ?, ?, 'manager', 1)
      ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'manager', is_active = 1
    `, ['Manager Warkop', 'manager@warkop.com', adminPassword]);

    // Insert or update Cashier
    await pool.query(`
      INSERT INTO users (name, email, password, role, is_active)
      VALUES (?, ?, ?, 'cashier', 1)
      ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'cashier', is_active = 1
    `, ['Kasir Warkop', 'kasir@warkop.com', cashierPassword]);

    console.log('✅ Akun default berhasil dibuat!');
    console.log('----------------------------------------------------');
    console.log('1. Manager : manager@warkop.com | Password: admin123');
    console.log('2. Kasir   : kasir@warkop.com   | Password: kasir123');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal membuat akun default:', err);
    process.exit(1);
  }
}

seed();

