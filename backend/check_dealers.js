require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [cols] = await db.query('DESCRIBE dealers');
  console.log(JSON.stringify(cols, null, 2));
  await db.end();
}
check();
