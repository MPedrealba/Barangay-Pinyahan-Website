// ============================================
// scripts/create-service-requests.js
// Run once: node scripts/create-service-requests.js
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

    await db.query(`
        CREATE TABLE IF NOT EXISTS service_requests (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            tracking_no  VARCHAR(30)  NOT NULL UNIQUE,
            resident_name VARCHAR(255) NOT NULL,
            service_type  VARCHAR(100) NOT NULL,
            purpose       TEXT         NOT NULL,
            status        VARCHAR(50)  NOT NULL DEFAULT 'Pending',
            created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tracking (tracking_no),
            INDEX idx_status   (status),
            INDEX idx_created  (created_at)
        )
    `);

    console.log('✅ service_requests table created (or already exists).');
    await db.end();
    console.log('🎉 Migration complete.');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
