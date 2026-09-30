// ============================================
// scripts/add-service-pricing-and-claims.js
// Migration: Adds pricing and first-time free columns to services table
// ============================================
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Support loading from backend/.env or root/.env
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

    async function columnExists(col) {
        const [rows] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'services' AND COLUMN_NAME = ?`,
            [dbName, col]
        );
        return rows.length > 0;
    }

    const columnsToAdd = [
        { name: 'is_first_time_free', def: 'TINYINT(1) DEFAULT 0' },
        { name: 'fee',                def: 'DECIMAL(10,2) DEFAULT 0.00' }
    ];

    for (const col of columnsToAdd) {
        if (await columnExists(col.name)) {
            console.log(`⚠️ Column "${col.name}" already exists on table "services".`);
        } else {
            await db.query(`ALTER TABLE services ADD COLUMN ${col.name} ${col.def}`);
            console.log(`✅ Added column "${col.name}" to table "services".`);
        }
    }

    // Set default first-time free for standard clearance and indigency under RA 11261
    const [updateResult] = await db.query(`
        UPDATE services 
        SET is_first_time_free = 1, fee = 50.00 
        WHERE LOWER(name) LIKE '%clearance%' OR LOWER(name) LIKE '%indigency%'
    `);
    console.log(`✅ Updated default pricing for clearance/indigency services. Rows affected: ${updateResult.affectedRows}`);

    // Print current services for verification
    const [services] = await db.query('SELECT id, name, fee, is_first_time_free FROM services');
    console.log('Current services pricing status:');
    console.table(services);

    await db.end();
    console.log('🎉 Migration completed successfully.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
