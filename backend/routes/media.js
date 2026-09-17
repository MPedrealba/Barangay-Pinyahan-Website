// ============================================
// routes/media.js — Binary Media Streaming & Management
// ============================================
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

/**
 * GET /api/media/:id
 * Streams the binary image stored in MySQL `media_files`.
 * Includes HTTP caching headers (Cache-Control & ETag) for instant browser caching.
 */
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid media ID' });
        }

        const etag = `"media-${id}"`;
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }

        const [rows] = await req.db.query(
            'SELECT mimetype, size, data FROM media_files WHERE id = ?',
            [id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const { mimetype, size, data } = rows[0];

        res.setHeader('Content-Type', mimetype || 'image/jpeg');
        if (size) {
            res.setHeader('Content-Length', size);
        }
        res.setHeader('ETag', etag);
        // Browser caches image permanently since each uploaded image gets a unique immutable ID
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        return res.send(data);
    } catch (error) {
        console.error('Error streaming media file:', error);
        return res.status(500).json({ error: 'Failed to retrieve media file' });
    }
});

/**
 * DELETE /api/media/:id
 * Admin endpoint to clean up orphaned media files.
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid media ID' });
        }

        const [result] = await req.db.query('DELETE FROM media_files WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Media not found' });
        }

        return res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Error deleting media file:', error);
        return res.status(500).json({ error: 'Failed to delete media file' });
    }
});

module.exports = router;
