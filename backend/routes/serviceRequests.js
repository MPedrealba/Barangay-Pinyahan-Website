// ============================================
// routes/serviceRequests.js — Online Service Requests
// ============================================
const express = require('express');
const router  = express.Router();
const verifyToken = require('../middleware/auth');

// ── Allowed service types ────────────────────────────────────────────────────
const VALID_SERVICE_TYPES = [
    'Barangay Clearance',
    'Business Permit Application',
    'Certificate of Indigency',
    'Certificate of Residency',
    'Health Services',
    'Disaster Response',
];

// ── Tracking number generator ────────────────────────────────────────────────
function generateTrackingNo() {
    const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
    const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SRV-${random}`;
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ────────────────────────────────────────────────────────────────────────────

// POST /api/services/request — Submit a new service request (public)
router.post('/request', async (req, res) => {
    try {
        const { resident_name, service_type, purpose, address, age, civil_status } = req.body;

        // Validation
        if (!resident_name?.trim() || !service_type?.trim() || !purpose?.trim()) {
            return res.status(400).json({ error: 'resident_name, service_type, and purpose are required.' });
        }

        if (age !== undefined && age !== '' && (isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120)) {
            return res.status(400).json({ error: 'age must be a valid number between 1 and 120.' });
        }

        if (!VALID_SERVICE_TYPES.includes(service_type)) {
            return res.status(400).json({
                error: 'Invalid service type.',
                valid_types: VALID_SERVICE_TYPES,
            });
        }

        // Generate unique tracking number
        let tracking_no;
        let isUnique = false;
        while (!isUnique) {
            tracking_no = generateTrackingNo();
            const [existing] = await req.db.query(
                'SELECT id FROM service_requests WHERE tracking_no = ?',
                [tracking_no]
            );
            if (existing.length === 0) isUnique = true;
        }

        // Insert record
        await req.db.query(
            `INSERT INTO service_requests (tracking_no, resident_name, service_type, purpose, address, age, civil_status, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [
                tracking_no,
                resident_name.trim(),
                service_type.trim(),
                purpose.trim(),
                address?.trim() || null,
                age ? parseInt(age) : null,
                civil_status?.trim() || null,
            ]
        );

        // Notify admins
        await req.db.query(
            `INSERT INTO notifications (admin_id, title, message, icon_class)
             VALUES (NULL, ?, ?, ?)`,
            [
                'New Service Request',
                `New ${service_type} request (${tracking_no}) from ${resident_name.trim()}.`,
                'fas fa-file-alt',
            ]
        ).catch(() => {}); // non-blocking — ignore if notifications table issues

        res.status(201).json({
            message:     'Service request submitted successfully!',
            tracking_no: tracking_no,
            service_type: service_type,
            status:      'Pending',
        });
    } catch (error) {
        console.error('Service request submission error:', error);
        res.status(500).json({ error: 'Server error while submitting service request.' });
    }
});

// POST /api/services/track — Track a service request by tracking_no (public)
router.post('/track', async (req, res) => {
    try {
        const { tracking_no } = req.body;

        if (!tracking_no?.trim()) {
            return res.status(400).json({ error: 'tracking_no is required.' });
        }

        const [rows] = await req.db.query(
            `SELECT tracking_no, resident_name, service_type, purpose, status, created_at, updated_at
             FROM service_requests WHERE tracking_no = ?`,
            [tracking_no.trim().toUpperCase()]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Service request not found.' });
        }

        res.json({ request: rows[0] });
    } catch (error) {
        console.error('Service request track error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES (JWT protected)
// ────────────────────────────────────────────────────────────────────────────

// GET /api/admin/service-requests — Fetch all service requests
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status, service_type } = req.query;

        let sql    = 'SELECT * FROM service_requests';
        const conditions = [];
        const values     = [];

        if (status)       { conditions.push('status = ?');       values.push(status); }
        if (service_type) { conditions.push('service_type = ?'); values.push(service_type); }

        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' ORDER BY created_at DESC';

        const [rows] = await req.db.query(sql, values);
        res.json({ requests: rows, total: rows.length });
    } catch (error) {
        console.error('Fetch service requests error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/service-requests/:id — Fetch a single service request
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT * FROM service_requests WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Service request not found.' });
        }

        res.json({ request: rows[0] });
    } catch (error) {
        console.error('Fetch single service request error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PATCH /api/admin/service-requests/:id/status — Update status (admin)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;

        const VALID_STATUSES = ['Pending', 'Processing', 'Ready for Pick-up', 'Completed/Claimed'];
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status value.',
                valid_statuses: VALID_STATUSES,
            });
        }

        // Build the admin display name for the audit trail
        const adminLabel = req.admin.full_name
            ? `${req.admin.full_name} (Admin)`
            : `${req.admin.username} (Admin)`;

        const [result] = await req.db.query(
            'UPDATE service_requests SET status = ?, processed_by = ? WHERE id = ?',
            [status, adminLabel, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service request not found.' });
        }

        // Audit log
        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [
                req.admin.id,
                'Service Request',
                `Updated service request #${req.params.id} status to "${status}" by ${adminLabel}`,
            ]
        ).catch(() => {}); // non-blocking

        res.json({ message: `Status updated to "${status}" successfully.`, status, processed_by: adminLabel });
    } catch (error) {
        console.error('Update service request status error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/service-requests/:id — Delete a service request (admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await req.db.query(
            'DELETE FROM service_requests WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service request not found.' });
        }

        res.json({ message: 'Service request deleted successfully.' });
    } catch (error) {
        console.error('Delete service request error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
