// ============================================
// scripts/create-categories.js — Create complaint_categories table & seed
// Run once: node scripts/create-categories.js
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

    // 1. Create complaint_categories table
    await db.query(`
        CREATE TABLE IF NOT EXISTS complaint_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            accused_rule VARCHAR(20) NOT NULL DEFAULT 'OPTIONAL',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✅ complaint_categories table created (or already exists).');

    // 2. Seed with default categories (skip if already populated)
    const [existing] = await db.query('SELECT COUNT(*) as count FROM complaint_categories');
    if (existing[0].count === 0) {
        const seeds = [
            ['Noise Complaint',       'MANDATORY'],
            ['Illegal Dumping',       'OPTIONAL'],
            ['Broken Streetlights',   'HIDDEN'],
            ['Peace & Order',         'MANDATORY'],
            ['Sanitation',            'OPTIONAL'],
            ['Infrastructure',        'HIDDEN'],
            ['Security Concern',      'MANDATORY'],
            ['Garbage/Trash Issue',   'OPTIONAL'],
            ['Environmental',         'OPTIONAL'],
            ['Others',                'OPTIONAL'],
        ];
        for (const [name, rule] of seeds) {
            await db.query(
                'INSERT INTO complaint_categories (name, accused_rule) VALUES (?, ?)',
                [name, rule]
            );
        }
        console.log(`✅ Seeded ${seeds.length} default categories.`);
    } else {
        console.log(`⚠️  Categories already populated (${existing[0].count} rows). Skipping seed.`);
    }

    await db.end();
    console.log('🎉 Migration complete.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
