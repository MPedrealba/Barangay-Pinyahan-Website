// ============================================
// config/multer.js — File Upload Configuration
// ============================================
// Uses memoryStorage so the file buffer is available in req.file.buffer
// for processing with sharp and storage in the MySQL media_files table.
// ============================================

const multer = require('multer');

// Memory storage — file stays in RAM as req.file.buffer
// This is required for server-side optimization and database BLOB storage
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
