// ============================================
// routes/serviceRequests.js — Online Service Requests
// ============================================
const express = require('express');
const router  = express.Router();
const publicRouter = express.Router();
const verifyToken = require('../middleware/auth');

// ── Allowed service types ────────────────────────────────────────────────────
const VALID_SERVICE_TYPES = [
    'Barangay Clearance',
    'Barangay Clearance - No Derogatory',
    'Certificate of Indigency',
    'Certificate of Residency',
];

// ── Tracking number generator ────────────────────────────────────────────────
function generateTrackingNo() {
    const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SRV-${random}`;
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ────────────────────────────────────────────────────────────────────────────

// Handler for submitting a new service request
const handleServiceRequest = async (req, res) => {
    try {
        const {
            resident_name, service_type, purpose, address,
            age, civil_status, birthdate, years_of_residency, requestor,
        } = req.body;

        if (!resident_name?.trim() || !service_type?.trim() || !purpose?.trim()) {
            return res.status(400).json({ error: 'resident_name, service_type, and purpose are required.' });
        }

        if (age !== undefined && age !== '' && (isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120)) {
            return res.status(400).json({ error: 'age must be a valid number between 1 and 120.' });
        }

        if (!VALID_SERVICE_TYPES.includes(service_type)) {
            return res.status(400).json({ error: 'Invalid service type.', valid_types: VALID_SERVICE_TYPES });
        }

        // Generate unique tracking number
        let tracking_no;
        let isUnique = false;
        while (!isUnique) {
            tracking_no = generateTrackingNo();
            const [existing] = await req.db.query(
                'SELECT id FROM service_requests WHERE tracking_no = ?', [tracking_no]
            );
            if (existing.length === 0) isUnique = true;
        }

        await req.db.query(
            `INSERT INTO service_requests
             (tracking_no, resident_name, service_type, purpose, address, age, civil_status, birthdate, years_of_residency, requestor, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [
                tracking_no,
                resident_name.trim(),
                service_type.trim(),
                purpose.trim(),
                address?.trim()    || null,
                age ? parseInt(age) : null,
                civil_status?.trim() || null,
                birthdate            || null,
                years_of_residency ? parseInt(years_of_residency) : null,
                requestor?.trim()    || null,
            ]
        );

        await req.db.query(
            `INSERT INTO notifications (admin_id, title, message, icon_class, link) VALUES (NULL, ?, ?, ?, ?)`,
            [
                'New Service Request',
                `New ${service_type} request (${tracking_no}) from ${resident_name.trim()}.`,
                'fas fa-file-alt',
                `/admin/service-requests?search=${encodeURIComponent(tracking_no)}`
            ]
        ).catch(() => {});

        res.status(201).json({
            message: 'Service request submitted successfully!',
            tracking_no,
            service_type,
            status: 'Pending',
        });
    } catch (error) {
        console.error('Service request submission error:', error);
        res.status(500).json({ error: 'Server error while submitting service request.' });
    }
};

router.post('/request', handleServiceRequest);
publicRouter.post('/request', handleServiceRequest);

// Handler for tracking a service request by tracking_no
const handleTrackRequest = async (req, res) => {
    try {
        const tracking_no = (req.body.tracking_no || req.query.tracking_no || '').trim();
        const resident_name = (req.body.resident_name || req.body.full_name || req.query.resident_name || req.query.full_name || '').trim();

        if (!tracking_no) {
            return res.status(400).json({ error: 'Tracking number is required.' });
        }

        let query = `
            SELECT id, tracking_no, resident_name, service_type, purpose, status, 
                   address, age, civil_status, birthdate, years_of_residency, requestor, 
                   processed_by, created_at, updated_at
            FROM service_requests 
            WHERE UPPER(TRIM(tracking_no)) = ?
        `;
        const params = [tracking_no.toUpperCase()];

        if (resident_name) {
            query += ' AND LOWER(resident_name) LIKE ?';
            params.push(`%${resident_name.toLowerCase()}%`);
        }

        const [rows] = await req.db.query(query, params);

        if (rows.length === 0) {
            return res.status(404).json({ 
                error: resident_name 
                    ? 'Service request not found. Please verify your tracking number and resident name.' 
                    : 'Service request not found. Please check your tracking number.' 
            });
        }

        res.json({ request: rows[0] });
    } catch (error) {
        console.error('Service request track error:', error);
        res.status(500).json({ error: 'Server error while tracking service request.' });
    }
};

router.post('/track', handleTrackRequest);
router.get('/track', handleTrackRequest);
publicRouter.post('/track', handleTrackRequest);
publicRouter.get('/track', handleTrackRequest);

// ────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES (JWT protected)
// ────────────────────────────────────────────────────────────────────────────

// GET /api/admin/service-requests — Fetch all service requests
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status, service_type } = req.query;
        let sql = 'SELECT * FROM service_requests';
        const conditions = [], values = [];

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
            'SELECT * FROM service_requests WHERE id = ?', [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Service request not found.' });
        res.json({ request: rows[0] });
    } catch (error) {
        console.error('Fetch single service request error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/service-requests/:id — Update resident data fields (admin)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const {
            resident_name, address, purpose, age, civil_status,
            birthdate, years_of_residency, requestor, service_type, photo,
        } = req.body;

        if (!resident_name?.trim()) {
            return res.status(400).json({ error: 'resident_name is required.' });
        }
        if (service_type && !VALID_SERVICE_TYPES.includes(service_type)) {
            return res.status(400).json({ error: 'Invalid service type.', valid_types: VALID_SERVICE_TYPES });
        }

        const [result] = await req.db.query(
            `UPDATE service_requests SET
                resident_name      = ?,
                address            = ?,
                purpose            = ?,
                age                = ?,
                civil_status       = ?,
                birthdate          = ?,
                years_of_residency = ?,
                requestor          = ?,
                service_type       = ?,
                photo              = ?
             WHERE id = ? OR tracking_no = ?`,
            [
                resident_name.trim(),
                address?.trim()    || null,
                purpose?.trim()    || null,
                age ? parseInt(age) : null,
                civil_status?.trim() || null,
                birthdate            || null,
                years_of_residency ? parseInt(years_of_residency) : null,
                requestor?.trim()    || null,
                service_type         || null,
                photo                || null,
                req.params.id,
                req.params.id,
            ]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Service request not found.' });

        const adminLabel = req.admin?.full_name
            ? `${req.admin.full_name} (Admin)` : (req.admin?.username ? `${req.admin.username} (Admin)` : 'Admin');

        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [req.admin?.id || null, 'Service Request', `Updated service request #${req.params.id} data by ${adminLabel}`]
        ).catch(() => {});

        const [rows] = await req.db.query('SELECT * FROM service_requests WHERE id = ? OR tracking_no = ?', [req.params.id, req.params.id]);
        res.json({ message: 'Service request updated successfully.', request: rows[0] });
    } catch (error) {
        console.error('Update service request error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PATCH /api/admin/service-requests/:id/status — Update status (admin)
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const VALID_STATUSES = ['Pending', 'Processing', 'Ready for Pick-up', 'Completed/Claimed'];
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value.', valid_statuses: VALID_STATUSES });
        }

        const adminLabel = req.admin.full_name
            ? `${req.admin.full_name} (Admin)` : `${req.admin.username} (Admin)`;

        const [result] = await req.db.query(
            'UPDATE service_requests SET status = ?, processed_by = ? WHERE id = ?',
            [status, adminLabel, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Service request not found.' });

        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [req.admin.id, 'Service Request', `Updated service request #${req.params.id} status to "${status}" by ${adminLabel}`]
        ).catch(() => {});

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
            'DELETE FROM service_requests WHERE id = ?', [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Service request not found.' });
        res.json({ message: 'Service request deleted successfully.' });
    } catch (error) {
        console.error('Delete service request error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

router.publicRouter = publicRouter;
module.exports = router;
