// ============================================
// routes/news.js — News CRUD (Admin) + Public
// ============================================
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const verifyToken = require('../middleware/auth');
const uploadToDatabase = require('../config/uploadToDatabase');

// Helper to query with automatic retry on idle socket drop (TiDB Cloud Serverless)
async function safeQuery(db, sql, params = []) {
    try {
        return await db.query(sql, params);
    } catch (err) {
        if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
            console.warn(`[news] Retrying query after socket reset: ${err.message}`);
            return await db.query(sql, params);
        }
        throw err;
    }
}

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------

// GET /api/admin/news/featured OR /api/news/featured — Get featured news (public)
router.get(['/featured', '/public/featured'], async (req, res) => {
    try {
        let [rows] = await safeQuery(
            req.db,
            "SELECT * FROM news WHERE is_featured = 1 AND LOWER(TRIM(status)) = 'published' ORDER BY date_published DESC LIMIT 1"
        );
        if (rows.length === 0) {
            [rows] = await safeQuery(
                req.db,
                "SELECT * FROM news WHERE LOWER(TRIM(status)) = 'published' ORDER BY date_published DESC LIMIT 1"
            );
        }
        res.status(200).json({ news: rows[0] || null });
    } catch (error) {
        console.error('Get featured news error:', error);
        res.status(500).json({ error: 'Server error fetching featured news.', details: error.message });
    }
});

// GET /api/admin/news/public OR /api/news/public — List published news (public)
router.get('/public', async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
        const [rows] = await safeQuery(
            req.db,
            "SELECT * FROM news WHERE LOWER(TRIM(status)) = 'published' ORDER BY date_published DESC LIMIT ?", [limit]
        );
        res.status(200).json({ news: rows });
    } catch (error) {
        console.error('List news error:', error);
        res.status(500).json({ error: 'Server error fetching news list.', details: error.message });
    }
});

// GET /api/admin/news/public/:id OR /api/news/public/:id — Get single news (public)
router.get('/public/:id', async (req, res) => {
    try {
        const [rows] = await safeQuery(req.db, "SELECT * FROM news WHERE id = ? AND LOWER(TRIM(status)) = 'published'", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'News not found.' });
        }
        res.status(200).json({ news: rows[0] });
    } catch (error) {
        console.error('Get public news error:', error);
        res.status(500).json({ error: 'Server error fetching news article.', details: error.message });
    }
});


// ------------------------------------------
// ADMIN ROUTES (protected)
// ------------------------------------------

// GET /api/admin/news — List all news
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await safeQuery(req.db, 'SELECT * FROM news ORDER BY date_published DESC');
        res.status(200).json({ news: rows });
    } catch (error) {
        console.error('List admin news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/news/:id — Get single news
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await safeQuery(req.db, 'SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'News not found.' });
        }
        res.status(200).json({ news: rows[0] });
    } catch (error) {
        console.error('Get admin news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/news — Create news
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { title, date_published, description, is_featured, status } = req.body;

        if (!title || !date_published || !description) {
            return res.status(400).json({ error: 'Title, date, and description are required.' });
        }

        const validStatus = status && ['Published', 'Draft'].includes(status) ? status : 'Published';

        // Upload directly to MySQL media_files (returns /api/media/:id or null)
        const photo_url = await uploadToDatabase(req.file, req.db);

        const [result] = await safeQuery(
            req.db,
            'INSERT INTO news (title, date_published, description, photo_url, is_featured, status) VALUES (?, ?, ?, ?, ?, ?)',
            [title, date_published, description, photo_url, is_featured === 'true' || is_featured === true ? 1 : 0, validStatus]
        );

        res.status(201).json({ message: 'News created successfully.', id: result.insertId, status: validStatus });
    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PATCH & PUT /api/admin/news/:id/status — Quick toggle status (admin)
const handleNewsStatusUpdate = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['Published', 'Draft'].includes(status)) {
            return res.status(400).json({ error: 'Status must be either "Published" or "Draft".' });
        }

        const [result] = await safeQuery(req.db, 'UPDATE news SET status = ? WHERE id = ?', [status, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'News article not found.' });
        }

        res.json({ message: `Article status updated to "${status}" successfully.`, status });
    } catch (error) {
        console.error('Update news status error:', error);
        res.status(500).json({ error: 'Server error updating status.' });
    }
};

router.patch('/:id/status', verifyToken, handleNewsStatusUpdate);
router.put('/:id/status', verifyToken, handleNewsStatusUpdate);

// PUT /api/admin/news/:id — Update news
router.put('/:id', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { title, date_published, description, is_featured, status } = req.body;

        const fields = [];
        const values = [];

        if (title) { fields.push('title = ?'); values.push(title); }
        if (date_published) { fields.push('date_published = ?'); values.push(date_published); }
        if (description) { fields.push('description = ?'); values.push(description); }
        if (status && ['Published', 'Draft'].includes(status)) { fields.push('status = ?'); values.push(status); }
        if (is_featured !== undefined) { fields.push('is_featured = ?'); values.push(is_featured === 'true' || is_featured === true ? 1 : 0); }
        if (req.file) {
            // Upload new photo directly to MySQL media_files
            const newPhotoUrl = await uploadToDatabase(req.file, req.db);
            fields.push('photo_url = ?');
            values.push(newPhotoUrl);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(req.params.id);
        await safeQuery(req.db, `UPDATE news SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'News updated successfully.' });
    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/news/:id — Delete news
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await safeQuery(req.db, 'DELETE FROM news WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'News not found.' });
        }
        res.json({ message: 'News deleted successfully.' });
    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
