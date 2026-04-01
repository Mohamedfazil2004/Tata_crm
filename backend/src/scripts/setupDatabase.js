const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'tatamotors_crm';

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true
  });

  console.log('🔧 Setting up Tata Motors CRM Database...');

  // Create database
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${DB_NAME}\``);
  console.log(`✅ Database '${DB_NAME}' created/selected`);

  // Users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(200) NOT NULL,
      role ENUM('admin', 'campaign_team', 'dealer') NOT NULL DEFAULT 'dealer',
      dealer_id INT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Users table created');

  // Dealers table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS dealers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dealer_name VARCHAR(200) NOT NULL,
      sheet_name VARCHAR(200) NOT NULL,
      contact_person VARCHAR(200),
      phone VARCHAR(20),
      email VARCHAR(150),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Dealers table created');

  // District-Dealer mapping table (Updated Formate)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS district_dealer_mapping (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dealer_id INT NOT NULL,
      dealer_name VARCHAR(200),
      dealer_district VARCHAR(100) NOT NULL,
      district_normalized VARCHAR(100) NOT NULL,
      FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_district (district_normalized)
    )
  `);

  console.log('✅ District-Dealer mapping table created');

  // Master leads table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_date DATE NOT NULL,
      full_name VARCHAR(200) NOT NULL,
      location VARCHAR(200),
      model VARCHAR(200),
      phone_number VARCHAR(30),
      dealer_id INT,
      dealer_name VARCHAR(200),
      follow_up_date DATE,
      telecaller_remark TEXT,
      dse_follow_up_date DATE,
      customer_response TEXT,
      status ENUM('In Progress','On Call','Completed') DEFAULT 'In Progress',
      customer_appointment_date DATE,
      customer_location VARCHAR(255),
      upload_batch_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Leads table created');

  // Upload batches table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS upload_batches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      upload_date DATE NOT NULL,
      file_name VARCHAR(300) NOT NULL,
      total_records INT DEFAULT 0,
      processed_records INT DEFAULT 0,
      uploaded_by INT,
      status ENUM('processing','completed','failed') DEFAULT 'processing',
      error_log TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Upload batches table created');

  // Campaign metrics table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS campaign_metrics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      metric_date DATE NOT NULL UNIQUE,
      total_leads INT DEFAULT 0,
      ad_spend DECIMAL(12,2) DEFAULT 0.00,
      entered_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Campaign metrics table created');

  await connection.end();
  console.log('\n🎉 Database setup completed successfully!');
}

setupDatabase().catch(err => {
  console.error('❌ Database setup failed:', err);
  process.exit(1);
});
