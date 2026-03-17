const db = require('../config/database');
require('dotenv').config();

async function fix() {
  console.log('🛠  Starting data correction...');
  
  try {
    // 1. Fix Vetri Motors (id 8) leads that have wrong location
    console.log('📍 Fixing Vetri Motors (Madurai) leads...');
    const [vetriUpdate] = await db.query(
      `UPDATE leads SET location = 'Madurai' WHERE dealer_id = 8`
    );
    console.log(`✅ Updated ${vetriUpdate.affectedRows} leads for Vetri Motors to Madurai`);

    // 2. Clear and re-populate district mappings to ensure no duplicates or wrong links
    // This is safer than just updating. 
    // Wait, I'll just run the seed script again after making sure it handles Vetri correctly.
    
    // Actually, I'll just check if Tiruppur is mapped to 8 by mistake
    const [check] = await db.query(
      `SELECT * FROM district_dealer_mapping WHERE district = 'tiruppur' AND dealer_id = 8`
    );
    
    if (check.length > 0) {
      console.log('⚠️  Found incorrect mapping for Tiruppur -> Vetri Motors. Removing...');
      await db.query(
        `DELETE FROM district_dealer_mapping WHERE district = 'tiruppur' AND dealer_id = 8`
      );
    }

    console.log('✨ Data fix completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Data fix failed:', err);
    process.exit(1);
  }
}

fix();
