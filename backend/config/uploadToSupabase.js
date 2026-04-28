// ============================================
// config/uploadToSupabase.js — Upload helper
// ============================================
// Takes a multer file object (from memoryStorage) and uploads it
// to the Supabase Storage bucket, returning a permanent public URL.
// ============================================

const supabase = require('./supabase');

const BUCKET = 'uploads'; // Must match the bucket name you created in Supabase Storage

/**
 * Upload a file buffer to Supabase Storage.
 * @param {object} file - multer file object (req.file)
 * @returns {Promise<string|null>} - Public URL of the uploaded file, or null on error
 */
async function uploadToSupabase(file) {
    if (!file) return null;

    // Build a unique file path: timestamp-originalname (spaces replaced)
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = filename;

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });

    if (error) {
        console.error('❌ Supabase upload error:', error.message);
        throw new Error('File upload failed: ' + error.message);
    }

    // Build and return the permanent public URL
    const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(data.path);

    return publicData.publicUrl;
}

module.exports = uploadToSupabase;
