require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('🔧 Restructuring district_dealer_mapping table...');

  try {
    // 1. Add dealer_name column
    await db.query('ALTER TABLE district_dealer_mapping ADD COLUMN dealer_name VARCHAR(200) AFTER dealer_id');
    console.log('✅ Added dealer_name column');
  } catch (e) {
    console.log('ℹ️ dealer_name column might already exist');
  }

  try {
    // 2. Rename district to dealer_district
    await db.query('ALTER TABLE district_dealer_mapping CHANGE COLUMN district dealer_district VARCHAR(100) NOT NULL');
    console.log('✅ Renamed district to dealer_district');
  } catch (e) {
      console.log('ℹ️ Renaming district failed (might be already renamed)');
      try {
          // If renaming failed, maybe it's because it was already renamed, let's check
          const [cols] = await db.query('SHOW COLUMNS FROM district_dealer_mapping LIKE "dealer_district"');
          if (cols.length > 0) console.log('✅ Column dealer_district already exists.');
      } catch(err) {
          console.error('❌ Error checking columns:', err.message);
      }
  }

  // 3. Populate dealer_name from dealers table
  await db.query(`
    UPDATE district_dealer_mapping ddm
    JOIN dealers d ON ddm.dealer_id = d.id
    SET ddm.dealer_name = d.dealer_name
  `);
  console.log('✅ Populated dealer_name from dealers table');

  // 4. Reorder columns to: id, dealer_id, dealer_name, dealer_district, district_normalized
  // Note: district_normalized is kept for backend logic but moved to the end
  try {
    await db.query('ALTER TABLE district_dealer_mapping MODIFY COLUMN dealer_id INT NOT NULL AFTER id');
    await db.query('ALTER TABLE district_dealer_mapping MODIFY COLUMN dealer_name VARCHAR(200) AFTER dealer_id');
    await db.query('ALTER TABLE district_dealer_mapping MODIFY COLUMN dealer_district VARCHAR(100) NOT NULL AFTER dealer_name');
    await db.query('ALTER TABLE district_dealer_mapping MODIFY COLUMN district_normalized VARCHAR(100) NOT NULL AFTER dealer_district');
    console.log('✅ Reordered columns');
  } catch (e) {
    console.error('❌ Error reordering columns:', e.message);
  }

  console.log('\n✨ Table restructured successfully!');
  await db.end();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
