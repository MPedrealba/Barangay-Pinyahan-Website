// ============================================
// config/uploadToDatabase.js — Database Image Upload Helper
// ============================================
// Takes a multer file object (from memoryStorage), optimizes and
// compresses it using sharp (max 1600px, WebP quality 80), and saves
// the binary buffer into the `media_files` table in MySQL as a LONGBLOB.
// Returns a relative URL path: /api/media/:id
// ============================================

let sharp = null;
try {
    sharp = require('sharp');
} catch (err) {
    console.warn('⚠️  Sharp not available. Uploads will be stored without compression.');
}

/**
 * Upload a file buffer directly to MySQL `media_files` table.
 * @param {object} file - multer file object (req.file)
 * @param {object} db - MySQL database pool or connection (req.db)
 * @returns {Promise<string|null>} - Relative URL (/api/media/:id), or null if no file
 */
async function uploadToDatabase(file, db) {
    if (!file || !file.buffer) return null;
    if (!db) throw new Error('Database connection is required for file upload.');

    let processedBuffer = file.buffer;
    let mimetype = file.mimetype;
    const originalName = file.originalname || 'upload';

    // Compress & optimize image if sharp is available and file is an image
    if (sharp && mimetype && mimetype.startsWith('image/')) {
        try {
            // Resize to max 1600x1600 maintaining aspect ratio, convert to WebP (quality 80)
            processedBuffer = await sharp(file.buffer)
                .rotate() // auto-orient based on EXIF
                .resize({
                    width: 1600,
                    height: 1600,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .webp({ quality: 80 })
                .toBuffer();

            mimetype = 'image/webp';
        } catch (optimizeErr) {
            console.warn('⚠️  Image optimization failed, falling back to original buffer:', optimizeErr.message);
            processedBuffer = file.buffer;
            mimetype = file.mimetype;
        }
    }

    const filename = `${Date.now()}-${originalName.replace(/\s+/g, '_')}`;
    const size = processedBuffer.length;

    const [result] = await db.query(
        'INSERT INTO media_files (filename, mimetype, size, data) VALUES (?, ?, ?, ?)',
        [filename, mimetype, size, processedBuffer]
    );

    return `/api/media/${result.insertId}`;
}

module.exports = uploadToDatabase;
