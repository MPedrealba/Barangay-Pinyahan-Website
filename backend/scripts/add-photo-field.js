// ============================================
// scripts/add-photo-field.js
// Adds photo column (LONGTEXT) to service_requests table.
// Run once: node scripts/add-photo-field.js
// ============================================
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT) || 4000,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:      { rejectUnauthorized: true },
    });

    console.log('✅ Connected to database.');

    async function columnExists(col) {
        const [rows] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_NAME = 'service_requests' AND COLUMN_NAME = ?`,
            [col]
        );
        return rows.length > 0;
    }

    if (await columnExists('photo')) {
        console.log('⚠️  Column "photo" already exists. Ensuring type is LONGTEXT...');
        await db.query(`ALTER TABLE service_requests MODIFY COLUMN photo LONGTEXT DEFAULT NULL`);
        console.log('✅ Column "photo" modified to LONGTEXT.');
    } else {
        await db.query(`ALTER TABLE service_requests ADD COLUMN photo LONGTEXT DEFAULT NULL`);
        console.log('✅ Added column "photo" (LONGTEXT).');
    }

    await db.end();
    console.log('🎉 Migration complete.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
