const db = require('./src/config/database');
(async () => {
    try {
        console.log('Adding dse_follow_up_date to leads table...');
        await db.query('ALTER TABLE leads ADD COLUMN dse_follow_up_date DATE AFTER follow_up_date;');
        console.log('✅ Column added successfully');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ Column dse_follow_up_date already exists');
        } else {
            console.error('❌ Error:', e.message);
        }
    } finally {
        process.exit();
    }
})();
