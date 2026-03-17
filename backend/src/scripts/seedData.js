const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

// Dealer data from Google Sheets
const DEALERS = [
  { id: 1, dealer_name: 'XPS Motors Dealer Partner', sheet_name: 'XPS Motors - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 2, dealer_name: 'URD Motors Dealer Partner', sheet_name: 'URD Motors - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 3, dealer_name: 'VST Trichy Dealer Partner', sheet_name: 'VST Trichy Motors  - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 4, dealer_name: 'SVCA Motors Dealer Partner', sheet_name: 'SVCA - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 5, dealer_name: 'LRN Motors Dealer Partner', sheet_name: 'LRN Motors - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 6, dealer_name: 'Sri Rayan Dealer Partner', sheet_name: 'Sri Raayan Autocare - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 7, dealer_name: 'SKMA Dealer Partner', sheet_name: 'SKMA - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 8, dealer_name: 'Vetri Motors Dealer Partner', sheet_name: 'Vetri Motors - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 9, dealer_name: 'Vee Vee Motors Dealer Partner', sheet_name: 'Vee Vee Motors - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 10, dealer_name: 'Premium Motors Dealer Partner', sheet_name: 'Premium Motors - Digital Leads', contact_person: '', phone: '', email: '' },
  { id: 11, dealer_name: 'VST Chennai Dealer Partner', sheet_name: 'VST  - Chennai', contact_person: '', phone: '', email: '' },
  { id: 12, dealer_name: 'Popular Hosur Dealer Partner', sheet_name: 'Popular - Hosur', contact_person: '', phone: '', email: '' },
  { id: 13, dealer_name: 'Others Dealer Partner', sheet_name: 'Others', contact_person: '', phone: '', email: '' },
  { id: 14, dealer_name: 'VST Salem Dealer Partner', sheet_name: 'VST Salem Motors - Digital Leads', contact_person: '', phone: '', email: '' },
];

// District to Dealer mapping
const DISTRICT_MAPPING = [
  // XPS Motors
  { district: 'thoothukudi', dealer_id: 1 },
  { district: 'kaniyakumari', dealer_id: 1 },
  { district: 'kanyakumari', dealer_id: 1 },

  // URD Motors
  { district: 'tiruppur', dealer_id: 2 },
  { district: 'coimbatore', dealer_id: 2 },
  { district: 'the_nilgiris', dealer_id: 2 },
  { district: 'erode', dealer_id: 2 },
  { district: 'nilgiris', dealer_id: 2 },

  // VST Trichy
  { district: 'ariyalur', dealer_id: 3 },
  { district: 'perambalur', dealer_id: 3 },
  { district: 'tiruchirapalli', dealer_id: 3 },
  { district: 'pudukottai', dealer_id: 3 },
  { district: 'trichy', dealer_id: 3 },

  // SVCA Digital Leads
  { district: 'nagapattinam', dealer_id: 4 },
  { district: 'mayiladuthurai', dealer_id: 4 },
  { district: 'tanjore', dealer_id: 4 },
  { district: 'thanjavur', dealer_id: 4 },

  // LRN Motors
  { district: 'salem', dealer_id: 5 },
  { district: 'namakkal', dealer_id: 5 },

  // Sri Rayan Autocare
  { district: 'karur', dealer_id: 6 },
  { district: 'vellore', dealer_id: 6 },

  // SKMA
  { district: 'sivagangai', dealer_id: 7 },
  { district: 'ramanathapuram', dealer_id: 7 },

  // Vetri Motors
  { district: 'madurai', dealer_id: 8 },
  { district: 'theni', dealer_id: 8 },
  { district: 'dindigul', dealer_id: 8 },
  { district: 'virudhunagar', dealer_id: 8 },

  // Vee Vee Motors
  { district: 'thiruvarur', dealer_id: 9 },

  // Premium Motors
  { district: 'tenkasi', dealer_id: 10 },

  // VST Chennai
  { district: 'chennai', dealer_id: 11 },

  // Popular Hosur
  { district: 'hosur', dealer_id: 12 },
  { district: 'krishnagiri', dealer_id: 12 },

  // Others
  { district: 'others', dealer_id: 13 },
];

async function seedData() {
  console.log('🌱 Seeding Tata Motors CRM database...');

  try {
    // Insert dealers
    console.log('📊 Inserting dealers...');
    for (const dealer of DEALERS) {
      await db.query(
        `INSERT INTO dealers (id, dealer_name, sheet_name, contact_person, phone, email) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE dealer_name=VALUES(dealer_name), sheet_name=VALUES(sheet_name)`,
        [dealer.id, dealer.dealer_name, dealer.sheet_name, dealer.contact_person, dealer.phone, dealer.email]
      );
    }
    console.log(`✅ ${DEALERS.length} dealers inserted`);

    // Insert district mappings
    console.log('🗺️  Inserting district mappings...');
    for (const mapping of DISTRICT_MAPPING) {
      const normalized = mapping.district.toLowerCase().trim().replace(/\s+/g, '_');
      await db.query(
        `INSERT INTO district_dealer_mapping (district, district_normalized, dealer_id) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE dealer_id=VALUES(dealer_id)`,
        [mapping.district, normalized, mapping.dealer_id]
      );
    }
    console.log(`✅ ${DISTRICT_MAPPING.length} district mappings inserted`);

    // Create admin user
    const adminHash = await bcrypt.hash('Admin@2026', 10);
    await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, dealer_id) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
      ['admin', 'admin@tatamotors.com', adminHash, 'System Administrator', 'admin', null]
    );
    console.log('✅ Admin user created (username: admin, password: Admin@2026)');

    // Create campaign team user (Swetha)
    const swethaHash = await bcrypt.hash('Swetha@2026', 10);
    await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, dealer_id) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
      ['swetha', 'swetha@tatamotors.com', swethaHash, 'Digital Campaign Manager', 'campaign_team', null]
    );
    console.log('✅ Campaign team user created (username: swetha, password: Swetha@2026)');

    // Create dealer users
    const dealerCredentials = [
      { username: 'xps_motors', name: 'XPS Motors', dealer_id: 1 },
      { username: 'urd_motors', name: 'URD Motors', dealer_id: 2 },
      { username: 'vst_trichy', name: 'VST Trichy', dealer_id: 3 },
      { username: 'svca_motors', name: 'SVCA Motors', dealer_id: 4 },
      { username: 'lrn_motors', name: 'LRN Motors', dealer_id: 5 },
      { username: 'sri_rayan', name: 'Sri Rayan Autocare', dealer_id: 6 },
      { username: 'skma', name: 'SKMA', dealer_id: 7 },
      { username: 'vetri_motors', name: 'Vetri Motors', dealer_id: 8 },
      { username: 'vee_vee_motors', name: 'Vee Vee Motors', dealer_id: 9 },
      { username: 'premium_motors', name: 'Premium Motors', dealer_id: 10 },
      { username: 'vst_chennai', name: 'VST Chennai', dealer_id: 11 },
      { username: 'popular_hosur', name: 'Popular Hosur', dealer_id: 12 },
      { username: 'others_dealer', name: 'Others Dealer', dealer_id: 13 },
      { username: 'vst_salem', name: 'VST Salem', dealer_id: 14 },
    ];

    for (const dc of dealerCredentials) {
      const hash = await bcrypt.hash('Dealer@2026', 10);
      await db.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, dealer_id) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
        [dc.username, `${dc.username}@tatamotors.com`, hash, dc.name, 'dealer', dc.dealer_id]
      );
    }
    console.log('✅ 14 dealer users created (default password: Dealer@2026)');

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('  Admin:     username=admin,     password=Admin@2026');
    console.log('  Campaign:  username=swetha,    password=Swetha@2026');
    console.log('  Dealers:   username=xps_motors (etc.), password=Dealer@2026');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
