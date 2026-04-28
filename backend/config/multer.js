// ============================================
// config/multer.js — File Upload Configuration
// ============================================
// Uses memoryStorage so the file buffer is available in req.file.buffer
// for direct upload to Supabase Storage (no local disk writing).
// ============================================

const multer = require('multer');

// Memory storage — file stays in RAM as req.file.buffer
// This is required for cloud uploads (Supabase, S3, etc.)
const storage = multer.memoryStorage();

// Filter to only allow image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;
