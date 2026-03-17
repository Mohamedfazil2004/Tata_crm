const db = require('./src/config/database');

async function checkUsers() {
  try {
    const [rows] = await db.query('SELECT username, role, full_name FROM users');
    console.log('Users found:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
