require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await db.query('ALTER TABLE dealers ADD COLUMN location VARCHAR(255) AFTER dealer_name');
    console.log('✅ Added location column to dealers table.');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('ℹ️ Location column already exists.');
    } else {
      console.error('❌ Error adding column:', err.message);
    }
  }

  await db.end();
}

migrate();
