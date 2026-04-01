require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM leads');
  console.log(`\n📊 Current leads in database: ${total}`);

  if (total === 0) {
    const [[{ batches }]] = await db.query('SELECT COUNT(*) as batches FROM upload_batches');
    if (batches === 0) {
      console.log('✅ No leads or upload batches to delete.\n');
      await db.end();
      return;
    }
  }

  // 1. Clear Leads
  await db.query('DELETE FROM leads');
  await db.query('ALTER TABLE leads AUTO_INCREMENT = 1');
  console.log('✅ Leads table cleared and AUTO_INCREMENT reset.');

  // 2. Clear Upload Batches
  await db.query('DELETE FROM upload_batches');
  await db.query('ALTER TABLE upload_batches AUTO_INCREMENT = 1');
  console.log('✅ Upload batches history cleared.');

  // 2.5 Clear Campaign Metrics
  await db.query('DELETE FROM campaign_metrics');
  await db.query('ALTER TABLE campaign_metrics AUTO_INCREMENT = 1');
  console.log('✅ Campaign metrics cleared.');

  // 3. Clear Upload Files
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let fileCount = 0;
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        fileCount++;
      }
    }
    console.log(`✅ Cleared ${fileCount} uploaded excel files.`);
  }

  // 4. Clear Jio Tags
  const jioTagsDir = path.join(uploadsDir, 'jio-tags');
  if (fs.existsSync(jioTagsDir)) {
    const files = fs.readdirSync(jioTagsDir);
    let photoCount = 0;
    for (const file of files) {
      const filePath = path.join(jioTagsDir, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        photoCount++;
      }
    }
    console.log(`✅ Cleared ${photoCount} Jio Tag photos.`);
  }

  console.log('\n✨ All leads data cleared from scratch successfully!\n');

  await db.end();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

