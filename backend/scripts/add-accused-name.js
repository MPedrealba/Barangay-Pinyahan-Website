// ============================================
// scripts/add-accused-name.js — Add accused_name column
// Run once: node scripts/add-accused-name.js
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

    const [cols] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'complaints' AND COLUMN_NAME = 'accused_name'`
    );

    if (cols.length > 0) {
        console.log('⚠️  Column "accused_name" already exists. Nothing to do.');
    } else {
        await db.query(
            `ALTER TABLE complaints ADD COLUMN accused_name VARCHAR(255) DEFAULT NULL AFTER full_name`
        );
        console.log('✅ Added "accused_name" column to complaints table.');
    }

    await db.end();
    console.log('🎉 Migration complete.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
