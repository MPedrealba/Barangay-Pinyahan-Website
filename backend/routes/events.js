// ============================================
// routes/events.js — Events CRUD (Admin) + Public
// ============================================
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const verifyToken = require('../middleware/auth');

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------

// GET /api/admin/events/public — List events (public)
router.get('/public', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const [rows] = await req.db.query(
            'SELECT * FROM events ORDER BY date DESC LIMIT ?', [limit]
        );
        res.json({ events: rows });
    } catch (error) {
        console.error('List events error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ------------------------------------------
// ADMIN ROUTES (protected)
// ------------------------------------------

// GET /api/admin/events — List all events
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM events ORDER BY date DESC');
        res.json({ events: rows });
    } catch (error) {
        console.error('List events error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/events/:id — Get single event
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }
        res.json({ event: rows[0] });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/events — Create event
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { name, date, time, location, description } = req.body;

        if (!name || !date || !time || !location) {
            return res.status(400).json({ error: 'Name, date, time, and location are required.' });
        }

        const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await req.db.query(
            'INSERT INTO events (name, date, time, location, description, photo_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, date, time, location, description || null, photo_url]
        );

        res.status(201).json({ message: 'Event created successfully.', id: result.insertId });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/events/:id — Update event
router.put('/:id', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { name, date, time, location, description } = req.body;

        const fields = [];
        const values = [];

        if (name) { fields.push('name = ?'); values.push(name); }
        if (date) { fields.push('date = ?'); values.push(date); }
        if (time) { fields.push('time = ?'); values.push(time); }
        if (location) { fields.push('location = ?'); values.push(location); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (req.file) { fields.push('photo_url = ?'); values.push(`/uploads/${req.file.filename}`); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(req.params.id);
        await req.db.query(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Event updated successfully.' });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/events/:id — Delete event
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await req.db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }
        res.json({ message: 'Event deleted successfully.' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
