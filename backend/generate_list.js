const db = require('./src/config/database');
const fs = require('fs');

async function run() {
  try {
    const [users] = await db.query(`
      SELECT u.username, u.full_name, d.dealer_name, u.role 
      FROM users u 
      LEFT JOIN dealers d ON u.dealer_id = d.id 
      ORDER BY u.role, u.username
    `);
    
    let output = "=== TATA MOTORS CRM USER ACCOUNT LIST ===\n\n";
    
    output += "CAMPAIGN MANAGERS:\n";
    const managers = users.filter(u => u.role === 'campaign_team' || u.role === 'admin');
    managers.forEach(u => {
      output += `- [${u.role.toUpperCase()}] Username: ${u.username.padEnd(15)} | Full Name: ${u.full_name}\n`;
    });
    
    output += "\nDEALER PARTNERS (MOTORS):\n";
    const dealers = users.filter(u => u.role === 'dealer');
    dealers.forEach(u => {
      output += `- Username: ${u.username.padEnd(15)} | Full Name: ${u.full_name.padEnd(20)} | Dealer: ${u.dealer_name}\n`;
    });
    
    fs.writeFileSync('user_list.txt', output);
    console.log('✅ User list generated in user_list.txt');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
