// ============================================
// seed.js — Seed the database with hashed passwords
// Run: node backend/seed.js
// ============================================
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306,
        ssl: {
            rejectUnauthorized: true
        }
    });

    // Manually select the database after connecting (bypasses TiDB handshake issue)
    await db.query('USE ' + (process.env.DB_NAME || 'barangay_pinyahan'));

    console.log('Connected to database.');

    // Default password for all seed admins
    const defaultPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(defaultPassword, salt);

    console.log(`Generated hash for "${defaultPassword}": ${hash}`);

    // Update all placeholder hashes
    await db.query('UPDATE admins SET password_hash = ?', [hash]);
    console.log('✅ All admin passwords updated to "admin123"');

    const [admins] = await db.query('SELECT id, username, full_name, email FROM admins');
    console.log('\nAdmin accounts:');
    admins.forEach(a => {
        console.log(`  ID: ${a.id} | Username: ${a.username} | Name: ${a.full_name} | Email: ${a.email}`);
    });
    console.log(`\nAll accounts use password: "${defaultPassword}"`);

    await db.end();
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
