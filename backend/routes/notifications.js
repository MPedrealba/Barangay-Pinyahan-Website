// ============================================
// routes/notifications.js — Admin Notifications
// ============================================
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// GET /api/admin/notifications — List all notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
            `SELECT * FROM notifications
             WHERE admin_id IS NULL OR admin_id = ?
             ORDER BY created_at DESC`,
            [req.admin.id]
        );
        res.json({ notifications: rows });
    } catch (error) {
        console.error('List notifications error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/notifications/unread-count — Get unread count
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
            `SELECT COUNT(*) as count FROM notifications
             WHERE is_read = FALSE AND (admin_id IS NULL OR admin_id = ?)`,
            [req.admin.id]
        );
        res.json({ unread_count: rows[0].count });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/notifications/read-all — Mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        await req.db.query(
            `UPDATE notifications SET is_read = TRUE
             WHERE (admin_id IS NULL OR admin_id = ?) AND is_read = FALSE`,
            [req.admin.id]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/notifications/:id/read — Mark single as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        await req.db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
