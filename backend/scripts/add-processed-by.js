// ============================================
// scripts/add-processed-by.js
// Run once: node scripts/add-processed-by.js
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

    // Add processed_by column if it doesn't exist
    const [cols] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'processed_by'`
    );

    if (cols.length > 0) {
        console.log('⚠️  Column "processed_by" already exists. Skipping ALTER.');
    } else {
        await db.query(`ALTER TABLE service_requests ADD COLUMN processed_by VARCHAR(100) DEFAULT NULL`);
        console.log('✅ Added column "processed_by".');
    }

    // Seed 3 dummy service requests
    await db.query(`
        INSERT IGNORE INTO service_requests
            (tracking_no, resident_name, service_type, purpose, status, address, age, civil_status, processed_by)
        VALUES
            ('SRV-XYZ123', 'Juan Dela Cruz',    'Barangay Clearance',       'For Employment Requirements', 'Completed/Claimed', '123 Malakas St. Brgy Pinyahan', 25, 'Single',  'John Doe (Admin)'),
            ('SRV-ABC987', 'Maria Clara',        'Certificate of Indigency', 'Financial Assistance',        'Ready for Pick-up', '456 Matatag St. Brgy Pinyahan', 32, 'Married', 'Jane Smith (Staff)'),
            ('SRV-QWE456', 'Andres Bonifacio',   'Certificate of Residency', 'Bank Account Opening',        'Pending',           '789 Masikap St. Brgy Pinyahan', 45, 'Widowed', NULL)
    `);
    console.log('✅ Seeded 3 dummy service requests (INSERT IGNORE — safe to re-run).');

    await db.end();
    console.log('🎉 Migration + seed complete.');
}

migrate().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
