// ============================================
// routes/news.js — News CRUD (Admin) + Public
// ============================================
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const verifyToken = require('../middleware/auth');
const uploadToSupabase = require('../config/uploadToSupabase');

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------

// GET /api/admin/news/public — List published news (public)
router.get('/public', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const [rows] = await req.db.query(
            'SELECT * FROM news ORDER BY date_published DESC LIMIT ?', [limit]
        );
        res.json({ news: rows });
    } catch (error) {
        console.error('List news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/news/featured — Get featured news (public)
router.get('/featured', async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT * FROM news WHERE is_featured = TRUE ORDER BY date_published DESC LIMIT 1'
        );
        res.json({ news: rows[0] || null });
    } catch (error) {
        console.error('Featured news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ------------------------------------------
// ADMIN ROUTES (protected)
// ------------------------------------------

// GET /api/admin/news — List all news
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM news ORDER BY date_published DESC');
        res.json({ news: rows });
    } catch (error) {
        console.error('List news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/news/:id — Get single news
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'News not found.' });
        }
        res.json({ news: rows[0] });
    } catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/news — Create news
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { title, date_published, description, is_featured } = req.body;

        if (!title || !date_published || !description) {
            return res.status(400).json({ error: 'Title, date, and description are required.' });
        }

        // Upload to Supabase Storage (returns full public URL or null)
        const photo_url = await uploadToSupabase(req.file);

        const [result] = await req.db.query(
            'INSERT INTO news (title, date_published, description, photo_url, is_featured) VALUES (?, ?, ?, ?, ?)',
            [title, date_published, description, photo_url, is_featured === 'true' || is_featured === true ? 1 : 0]
        );

        res.status(201).json({ message: 'News created successfully.', id: result.insertId });
    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/news/:id — Update news
router.put('/:id', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { title, date_published, description, is_featured } = req.body;

        const fields = [];
        const values = [];

        if (title) { fields.push('title = ?'); values.push(title); }
        if (date_published) { fields.push('date_published = ?'); values.push(date_published); }
        if (description) { fields.push('description = ?'); values.push(description); }
        if (is_featured !== undefined) { fields.push('is_featured = ?'); values.push(is_featured === 'true' || is_featured === true ? 1 : 0); }
        if (req.file) {
            // Upload new photo to Supabase, store full public URL
            const newPhotoUrl = await uploadToSupabase(req.file);
            fields.push('photo_url = ?');
            values.push(newPhotoUrl);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(req.params.id);
        await req.db.query(`UPDATE news SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'News updated successfully.' });
    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/news/:id — Delete news
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await req.db.query('DELETE FROM news WHERE id = ?', [req.params.id]);
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
