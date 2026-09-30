// ============================================
// routes/events.js — Events CRUD (Admin) + Public
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
            console.warn(`[events] Retrying query after socket reset: ${err.message}`);
            return await db.query(sql, params);
        }
        throw err;
    }
}

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------

// GET /api/admin/events/public OR /api/events/public — List events (public)
router.get('/public', async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 8));
        const [rows] = await safeQuery(
            req.db,
            "SELECT * FROM events WHERE LOWER(TRIM(status)) = 'published' ORDER BY date DESC LIMIT ?", [limit]
        );
        res.status(200).json({ events: rows });
    } catch (error) {
        console.error('List events error:', error);
        res.status(500).json({ error: 'Server error.', details: error.message });
    }
});

// GET /api/admin/events/public/:id OR /api/events/public/:id — Get single event (public)
router.get('/public/:id', async (req, res) => {
    try {
        const [rows] = await safeQuery(
            req.db,
            "SELECT * FROM events WHERE id = ? AND LOWER(TRIM(status)) = 'published'",
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }
        res.status(200).json({ event: rows[0] });
    } catch (error) {
        console.error('Get public event error:', error);
        res.status(500).json({ error: 'Server error.', details: error.message });
    }
});


// ------------------------------------------
// ADMIN ROUTES (protected)
// ------------------------------------------

// GET /api/admin/events — List all events
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await safeQuery(req.db, 'SELECT * FROM events ORDER BY date DESC');
        res.status(200).json({ events: rows });
    } catch (error) {
        console.error('List events error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/events/:id — Get single event
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await safeQuery(req.db, 'SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }
        res.status(200).json({ event: rows[0] });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/events — Create event
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { name, date, time, location, description, status } = req.body;

        if (!name || !date || !time || !location || !description) {
            return res.status(400).json({ error: 'Name, date, time, location, and description are required.' });
        }

        const validStatus = (status || '').trim().toLowerCase() === 'draft' ? 'Draft' : 'Published';

        // Upload directly to MySQL media_files (returns /api/media/:id or null)
        const photo_url = await uploadToDatabase(req.file, req.db);

        const [result] = await safeQuery(
            req.db,
            'INSERT INTO events (name, date, time, location, description, photo_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, date, time, location, description, photo_url, validStatus]
        );

        res.status(201).json({ message: 'Event created successfully.', id: result.insertId, status: validStatus });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PATCH & PUT /api/admin/events/:id/status — Quick toggle status (admin)
const handleEventStatusUpdate = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatus = (status || '').trim().toLowerCase() === 'draft' ? 'Draft' : 'Published';

        const [result] = await safeQuery(req.db, 'UPDATE events SET status = ? WHERE id = ?', [validStatus, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        res.json({ message: `Event status updated to "${validStatus}" successfully.`, status: validStatus });
    } catch (error) {
        console.error('Update event status error:', error);
        res.status(500).json({ error: 'Server error updating event status.' });
    }
};

router.patch('/:id/status', verifyToken, handleEventStatusUpdate);
router.put('/:id/status', verifyToken, handleEventStatusUpdate);

// PUT /api/admin/events/:id — Update event
router.put('/:id', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { name, date, time, location, description, status } = req.body;

        const fields = [];
        const values = [];

        if (name) { fields.push('name = ?'); values.push(name); }
        if (date) { fields.push('date = ?'); values.push(date); }
        if (time) { fields.push('time = ?'); values.push(time); }
        if (location) { fields.push('location = ?'); values.push(location); }
        if (description) { fields.push('description = ?'); values.push(description); }
        if (status !== undefined) {
            const validStatus = (status || '').trim().toLowerCase() === 'draft' ? 'Draft' : 'Published';
            fields.push('status = ?');
            values.push(validStatus);
        }
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
        await safeQuery(req.db, `UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Event updated successfully.' });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/events/:id — Delete event
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await safeQuery(req.db, 'DELETE FROM events WHERE id = ?', [req.params.id]);
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
