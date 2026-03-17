const db = require('./src/config/database');

async function run() {
  try {
    console.log('Connecting to database...');
    
    // Rename Swetha users to Campaign Manager
    const [renameResult] = await db.query("UPDATE users SET full_name = 'Campaign Manager' WHERE full_name LIKE '%Swetha%'");
    console.log(`✅ Renamed ${renameResult.affectedRows} user(s) to 'Campaign Manager'`);
    
    // Fetch all dealer usernames
    const [users] = await db.query(`
      SELECT u.username, u.full_name, d.dealer_name 
      FROM users u 
      JOIN dealers d ON u.dealer_id = d.id 
      WHERE u.role = 'dealer'
    `);
    
    console.log('\n=== MOTORS USERNAMES ===');
    if (users.length === 0) {
      console.log('No dealer users found.');
    } else {
      users.forEach(u => {
        console.log(`Username: ${u.username.padEnd(15)} | Dealer: ${u.dealer_name}`);
      });
    }
    console.log('========================\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
