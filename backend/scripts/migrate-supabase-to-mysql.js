// ============================================
// scripts/migrate-supabase-to-mysql.js
// ============================================
// One-time migration script that downloads images stored in Supabase
// (from news, events, and complaints tables) and stores them directly
// into MySQL `media_files` table as LONGBLOBs.
//
// Usage: node backend/scripts/migrate-supabase-to-mysql.js
// ============================================

const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uploadToDatabase = require('../config/uploadToDatabase');

const DB_NAME = process.env.DB_NAME || 'test';

async function runMigration() {
    console.log('🚀 Starting Supabase to MySQL Image Migration...');

    const db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: DB_NAME,
        port: process.env.DB_PORT,
        waitForConnections: true,
        connectionLimit: 5,
        ssl: { rejectUnauthorized: true },
    });

    try {
        const connection = await db.getConnection();
        await connection.query('USE `' + DB_NAME + '`');

        // Ensure table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS media_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                mimetype VARCHAR(100) NOT NULL,
                size INT NOT NULL,
                data LONGBLOB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        connection.release();

        const tables = [
            { name: 'news', idCol: 'id', urlCol: 'photo_url' },
            { name: 'events', idCol: 'id', urlCol: 'photo_url' },
            { name: 'complaints', idCol: 'id', urlCol: 'photo_url' }
        ];

        let totalMigrated = 0;
        let totalFailed = 0;

        for (const table of tables) {
            console.log(`\n🔍 Checking table: ${table.name}...`);
            const [rows] = await db.query(
                `SELECT ${table.idCol}, ${table.urlCol} FROM ${table.name} WHERE ${table.urlCol} LIKE 'http%'`
            );

            console.log(`Found ${rows.length} records with external/Supabase URLs in ${table.name}.`);

            for (const row of rows) {
                const id = row[table.idCol];
                const currentUrl = row[table.urlCol];

                try {
                    console.log(`  Downloading image for ${table.name} #${id}: ${currentUrl}`);
                    const response = await fetch(currentUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status} ${response.statusText}`);
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const contentType = response.headers.get('content-type') || 'image/jpeg';
                    const filename = path.basename(new URL(currentUrl).pathname) || `migrated-${table.name}-${id}.jpg`;

                    const mockMulterFile = {
                        buffer,
                        mimetype: contentType,
                        originalname: filename
                    };

                    const newPhotoUrl = await uploadToDatabase(mockMulterFile, db);
                    await db.query(
                        `UPDATE ${table.name} SET ${table.urlCol} = ? WHERE ${table.idCol} = ?`,
                        [newPhotoUrl, id]
                    );

                    console.log(`  ✅ Successfully migrated #${id} → ${newPhotoUrl}`);
                    totalMigrated++;
                } catch (err) {
                    console.error(`  ❌ Failed migrating #${id} (${currentUrl}):`, err.message);
                    totalFailed++;
                }
            }
        }

        console.log(`\n🎉 Migration Complete!`);
        console.log(`   Migrated: ${totalMigrated}`);
        console.log(`   Failed:   ${totalFailed}`);
    } catch (err) {
        console.error('Fatal migration error:', err);
    } finally {
        await db.end();
        process.exit(0);
    }
}

runMigration();
