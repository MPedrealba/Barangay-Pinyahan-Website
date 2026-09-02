// ============================================
// scripts/add-service-request-fields-v2.js
// Adds birthdate, years_of_residency, requestor columns.
// Run once: node scripts/add-service-request-fields-v2.js
// ============================================
require('dotenv').config();
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

    const adds = [
        { name: 'birthdate',          def: 'DATE DEFAULT NULL' },
        { name: 'years_of_residency', def: 'INT DEFAULT NULL' },
        { name: 'requestor',          def: 'VARCHAR(255) DEFAULT NULL' },
    ];

    for (const { name, def } of adds) {
        if (await columnExists(name)) {
            console.log(`⚠️  Column "${name}" already exists. Skipping.`);
        } else {
            await db.query(`ALTER TABLE service_requests ADD COLUMN ${name} ${def}`);
            console.log(`✅ Added column "${name}".`);
        }
    }

    await db.end();
    console.log('🎉 Migration complete.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
