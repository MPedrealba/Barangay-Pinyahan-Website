// ============================================
// routes/dashboard.js — Dashboard Statistics
// ============================================
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// GET /api/dashboard/stats — Dashboard stat cards
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [total] = await req.db.query('SELECT COUNT(*) as count FROM complaints');
        const [pending] = await req.db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'Pending'");
        const [urgent] = await req.db.query("SELECT COUNT(*) as count FROM complaints WHERE urgency_level = 'High'");
        const [resolved] = await req.db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'Resolved'");
        const [newsCount] = await req.db.query('SELECT COUNT(*) as count FROM news');
        const [eventsCount] = await req.db.query('SELECT COUNT(*) as count FROM events');

        res.json({
            total_complaints: total[0].count,
            pending_complaints: pending[0].count,
            urgent_complaints: urgent[0].count,
            resolved_complaints: resolved[0].count,
            total_news: newsCount[0].count,
            total_events: eventsCount[0].count
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/dashboard/charts — Dashboard chart data
router.get('/charts', verifyToken, async (req, res) => {
    try {
        // Complaints by category
        const [byCategory] = await req.db.query(
            'SELECT category, COUNT(*) as count FROM complaints GROUP BY category'
        );

        // Complaints by hour of day
        const [byHour] = await req.db.query(
            'SELECT HOUR(submitted_at) as hour, COUNT(*) as count FROM complaints GROUP BY HOUR(submitted_at) ORDER BY hour'
        );

        // Complaints by status
        const [byStatus] = await req.db.query(
            'SELECT status, COUNT(*) as count FROM complaints GROUP BY status'
        );

        res.json({
            by_category: byCategory,
            by_hour: byHour,
            by_status: byStatus
        });
    } catch (error) {
        console.error('Dashboard charts error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
