// ============================================
// scripts/add-resolved-by.js — Add resolved_by column
// Run once: node scripts/add-resolved-by.js
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

    // Check if column already exists
    const [cols] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'complaints' AND COLUMN_NAME = 'resolved_by'`
    );

    if (cols.length > 0) {
        console.log('⚠️  Column "resolved_by" already exists. Nothing to do.');
    } else {
        await db.query(
            `ALTER TABLE complaints ADD COLUMN resolved_by VARCHAR(255) DEFAULT NULL AFTER resolved_at`
        );
        console.log('✅ Added "resolved_by" column to complaints table.');
    }

    await db.end();
    console.log('🎉 Migration complete.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
