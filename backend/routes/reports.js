const express = require('express');
const router = express.Router();

// GET /api/admin/reports/metrics
// Returns high-level metrics (Total Complaints, Resolved, Services Offered)
router.get('/metrics', async (req, res) => {
    try {
        const db = req.db;
        
        // 1. Total Complaints
        const [totalComp] = await db.query('SELECT COUNT(*) as count FROM complaints');
        const countComplaints = totalComp[0].count;

        // 2. Resolved Complaints
        const [resolvedComp] = await db.query('SELECT COUNT(*) as count FROM complaints WHERE status = "Resolved"');
        const countResolved = resolvedComp[0].count;

        // 3. Total Services Offered
        const [servicesOffered] = await db.query('SELECT COUNT(*) as count FROM services');
        const countServices = servicesOffered[0].count;

        res.json({
            success: true,
            data: {
                total_complaints: countComplaints,
                resolved_complaints: countResolved,
                total_services: countServices
            }
        });
    } catch (err) {
        console.error("Error fetching report metrics:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET /api/admin/reports/charts
// Returns aggregated data for the charts (e.g. complaints by type)
router.get('/charts', async (req, res) => {
    try {
        const db = req.db;
        
        // Complaints by Category
        const [complaintsByCategory] = await db.query('SELECT category, COUNT(*) as count FROM complaints WHERE category IS NOT NULL GROUP BY category');
        
        res.json({
            success: true,
            data: {
                complaints_by_category: complaintsByCategory
            }
        });
    } catch (err) {
        console.error("Error fetching report charts:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET /api/admin/reports/logs
// Returns the newest entries from the audit_logs table
router.get('/logs', async (req, res) => {
    try {
        const db = req.db;
        
        const [logs] = await db.query(`
            SELECT a.action_type, a.action_details, a.created_at, ad.full_name as admin_name 
            FROM audit_logs a
            LEFT JOIN admins ad ON a.admin_id = ad.id
            ORDER BY a.created_at DESC
            LIMIT 20
        `);
        
        res.json({
            success: true,
            data: logs
        });
    } catch (err) {
        console.error("Error fetching report logs:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
