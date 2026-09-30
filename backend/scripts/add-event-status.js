// ============================================
// scripts/add-event-status.js
// Migration: Adds status column to events table
// ============================================
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

async function migrate() {
    const dbName = process.env.DB_NAME || 'barangay_pinyahan';
    console.log(`Connecting to database ${dbName} on ${process.env.DB_HOST}...`);

    const db = await mysql.createConnection({
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT || '4000', 10),
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: dbName,
        ssl:      { rejectUnauthorized: true },
    });

    await db.query(`USE \`${dbName}\``);
    console.log('✅ Connected to database.');

    // Check if column already exists
    const [cols] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'events' AND COLUMN_NAME = 'status'`,
        [dbName]
    );

    if (cols.length > 0) {
        console.log('⚠️ Column "status" already exists on table "events".');
    } else {
        await db.query(`ALTER TABLE events ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Published'`);
        console.log('✅ Added column "status" to table "events".');
    }

    // Ensure all existing events default to Published
    const [updateResult] = await db.query(`
        UPDATE events 
        SET status = 'Published' 
        WHERE status IS NULL OR TRIM(status) = ''
    `);
    console.log(`✅ Verified/updated existing events to 'Published'. Affected rows: ${updateResult.affectedRows}`);

    // Verify current events
    const [events] = await db.query('SELECT id, name, date, status FROM events LIMIT 10');
    console.log('Sample events in DB:');
    console.table(events);

    await db.end();
    console.log('🎉 Migration completed successfully.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
