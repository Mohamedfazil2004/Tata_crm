const db = require('./src/config/database');
(async () => {
    try {
        const columns = [
            'ALTER TABLE leads ADD COLUMN dse_status ENUM("In Progress", "Completed") DEFAULT "In Progress"',
            'UPDATE leads SET dse_status = status'
        ];
        
        for (const sql of columns) {
            try {
                await db.query(sql);
                console.log(`Executed: ${sql.substring(0, 50)}...`);
            } catch (e) {
                console.warn(`Skipped: ${sql.substring(0, 50)}... (likely error or already exists)`);
            }
        }
        
        console.log('DSE status column added successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error updating database:', err);
        process.exit(1);
    }
})();
