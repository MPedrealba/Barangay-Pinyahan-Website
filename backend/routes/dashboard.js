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
        const [byCategory] = await req.db.query(
            'SELECT category, COUNT(*) as count FROM complaints GROUP BY category'
        );
        const [byHour] = await req.db.query(
            'SELECT HOUR(submitted_at) as hour, COUNT(*) as count FROM complaints GROUP BY HOUR(submitted_at) ORDER BY hour'
        );
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

// ------------------------------------------
// GET /api/dashboard/analytics — Full analytics with time range filter
// Query: ?range=3_days|7_days|1_month|3_months|6_months|1_year
// ------------------------------------------
router.get('/analytics', verifyToken, async (req, res) => {
    try {
        // Map range param to MySQL INTERVAL
        const rangeMap = {
            '3_days':   'INTERVAL 3 DAY',
            '7_days':   'INTERVAL 7 DAY',
            '1_month':  'INTERVAL 1 MONTH',
            '3_months': 'INTERVAL 3 MONTH',
            '6_months': 'INTERVAL 6 MONTH',
            '1_year':   'INTERVAL 1 YEAR',
        };

        const range = req.query.range || '1_year';
        const interval = rangeMap[range] || rangeMap['1_year'];
        const dateFilter = `submitted_at >= DATE_SUB(NOW(), ${interval})`;

        // 1. Total complaints in range
        const [totalRows] = await req.db.query(
            `SELECT COUNT(*) as count FROM complaints WHERE ${dateFilter}`
        );
        const totalComplaints = totalRows[0].count;

        // 2. Resolved in range
        const [resolvedRows] = await req.db.query(
            `SELECT COUNT(*) as count FROM complaints WHERE status = 'Resolved' AND ${dateFilter}`
        );
        const resolvedCount = resolvedRows[0].count;

        // 3. Urgency breakdown
        const [urgencyRows] = await req.db.query(
            `SELECT urgency_level, COUNT(*) as count FROM complaints WHERE ${dateFilter} GROUP BY urgency_level`
        );

        // 4. Category breakdown
        const [categoryRows] = await req.db.query(
            `SELECT category, COUNT(*) as count FROM complaints WHERE ${dateFilter} GROUP BY category ORDER BY count DESC`
        );

        // 5. Status breakdown
        const [statusRows] = await req.db.query(
            `SELECT status, COUNT(*) as count FROM complaints WHERE ${dateFilter} GROUP BY status`
        );

        // 6. Recent top 5 complaints in range
        const [recentRows] = await req.db.query(
            `SELECT id, ref_no, full_name, category, complaint_type, status, urgency_level, submitted_at 
             FROM complaints WHERE ${dateFilter} ORDER BY submitted_at DESC LIMIT 5`
        );

        // 7. Complaints by hour of day
        const [hourRows] = await req.db.query(
            `SELECT HOUR(submitted_at) as hour, COUNT(*) as count FROM complaints WHERE ${dateFilter} GROUP BY HOUR(submitted_at) ORDER BY hour`
        );

        // 8. News & events counts (global, not time-filtered)
        const [newsCount] = await req.db.query('SELECT COUNT(*) as count FROM news');
        const [eventsCount] = await req.db.query('SELECT COUNT(*) as count FROM events');

        res.json({
            range,
            total_complaints: totalComplaints,
            resolved_complaints: resolvedCount,
            resolution_rate: totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0,
            urgency: urgencyRows,
            categories: categoryRows,
            statuses: statusRows,
            recent: recentRows,
            by_hour: hourRows,
            total_news: newsCount[0].count,
            total_events: eventsCount[0].count,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
