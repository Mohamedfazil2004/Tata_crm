const db = require('./src/config/database');
(async () => {
    try {
        const [rows] = await db.query('DESCRIBE leads;');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
