const db = require('../config/database');

async function clearTransactionalData() {
  console.log('🧹 Clearing all added leads and activity data...');
  
  try {
    // Disable foreign key checks to allow truncation if needed, 
    // though deleting in order is safer
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('🗑️  Deleting all leads...');
    await db.query('TRUNCATE TABLE leads');

    console.log('🗑️  Deleting upload history...');
    await db.query('TRUNCATE TABLE upload_batches');

    console.log('🗑️  Deleting campaign metrics...');
    await db.query('TRUNCATE TABLE campaign_metrics');

    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ All transactional data cleared. The CRM is now fresh!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to clear data:', err);
    process.exit(1);
  }
}

clearTransactionalData();
