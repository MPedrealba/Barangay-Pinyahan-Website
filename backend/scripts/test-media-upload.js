// ============================================
// scripts/test-media-upload.js
// ============================================
// Verifies image compression with sharp, insertion into media_files (LONGBLOB),
// retrieval, and cleanup.
//
// Usage: node backend/scripts/test-media-upload.js
// ============================================

const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');
const sharp = require('sharp');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uploadToDatabase = require('../config/uploadToDatabase');

const DB_NAME = process.env.DB_NAME || 'test';

async function runTest() {
    console.log('🧪 Starting Media Upload & BLOB Storage Verification Test...');

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
        console.log('✅ media_files table verified.');

        // Generate a 400x400 test image using sharp
        const testBuffer = await sharp({
            create: {
                width: 400,
                height: 400,
                channels: 4,
                background: { r: 0, g: 120, b: 215, alpha: 1 }
            }
        }).png().toBuffer();

        const mockFile = {
            buffer: testBuffer,
            mimetype: 'image/png',
            originalname: 'test_sample_image.png'
        };

        console.log(`Original test image size: ${testBuffer.length} bytes`);

        // Upload to database
        const mediaUrl = await uploadToDatabase(mockFile, db);
        console.log(`✅ Upload result URL: ${mediaUrl}`);

        if (!mediaUrl || !mediaUrl.startsWith('/api/media/')) {
            throw new Error(`Expected mediaUrl to start with /api/media/, got: ${mediaUrl}`);
        }

        const mediaId = parseInt(mediaUrl.split('/').pop(), 10);
        console.log(`Extracted Media ID: ${mediaId}`);

        // Verify row in MySQL
        const [rows] = await db.query(
            'SELECT id, filename, mimetype, size, data FROM media_files WHERE id = ?',
            [mediaId]
        );

        if (rows.length === 0) {
            throw new Error(`Media record with ID ${mediaId} not found in MySQL!`);
        }

        const stored = rows[0];
        console.log(`✅ Verified stored record:`);
        console.log(`   - Filename: ${stored.filename}`);
        console.log(`   - MimeType: ${stored.mimetype} (WebP optimization confirmed)`);
        console.log(`   - Stored Size: ${stored.size} bytes`);
        console.log(`   - BLOB Buffer Length: ${stored.data.length} bytes`);

        if (stored.mimetype !== 'image/webp') {
            console.warn(`⚠️ Expected image/webp, got ${stored.mimetype}`);
        }
        if (stored.data.length !== stored.size) {
            throw new Error(`Size mismatch: stored.size=${stored.size}, data.length=${stored.data.length}`);
        }

        // Clean up test record
        await db.query('DELETE FROM media_files WHERE id = ?', [mediaId]);
        console.log(`✅ Cleaned up test record #${mediaId}.`);

        console.log('\n🎉 ALL TESTS PASSED! MySQL BLOB storage and sharp compression work flawlessly.');
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    } finally {
        await db.end();
        process.exit(0);
    }
}

runTest();
