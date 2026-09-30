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

// Helper to validate service type against presets or active database services
async function isValidServiceType(db, serviceType) {
    if (!serviceType || !serviceType.trim()) return false;
    const trimmed = serviceType.trim();
    if (VALID_SERVICE_TYPES.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
        return true;
    }
    try {
        const [rows] = await db.query(
            "SELECT id FROM services WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND LOWER(TRIM(status)) = 'active'",
            [trimmed]
        );
        return rows.length > 0;
    } catch (err) {
        console.error('Error verifying service type in DB:', err);
        return false;
    }
}

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

        const isAllowedType = await isValidServiceType(req.db, service_type);
        if (!isAllowedType) {
            return res.status(400).json({ error: 'Invalid service type.' });
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

// ── Claim Sequence & First-Time Free Helpers ────────────────────────────────
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getServiceGroupKey(serviceType) {
    if (!serviceType) return 'general';
    const lower = serviceType.toLowerCase().trim();
    if (lower.includes('derogatory')) return 'clearance_no_derogatory';
    if (lower.includes('clearance')) return 'clearance';
    if (lower.includes('indigency')) return 'indigency';
    if (lower.includes('residency')) return 'residency';
    return lower;
}

function findServiceConfig(services, serviceType) {
    if (!serviceType) return { fee: 0, is_first_time_free: false, matched_name: null };
    const stLower = serviceType.toLowerCase().trim();

    // 1. Exact name match
    let match = services.find(s => s.name && s.name.toLowerCase().trim() === stLower);
    if (match) {
        return {
            fee: parseFloat(match.fee || 0),
            is_first_time_free: Boolean(match.is_first_time_free),
            matched_name: match.name,
        };
    }

    // 2. Substring match
    match = services.find(s => {
        if (!s.name) return false;
        const nLower = s.name.toLowerCase().trim();
        return nLower.includes(stLower) || stLower.includes(nLower);
    });
    if (match) {
        return {
            fee: parseFloat(match.fee || 0),
            is_first_time_free: Boolean(match.is_first_time_free),
            matched_name: match.name,
        };
    }

    // 3. Built-in standard defaults (e.g. RA 11261 First Time Free for clearance/indigency)
    if (stLower.includes('derogatory')) {
        const der = services.find(s => s.name && s.name.toLowerCase().includes('derogatory'));
        return {
            fee: der ? parseFloat(der.fee || 50) : 50.0,
            is_first_time_free: der ? Boolean(der.is_first_time_free) : true,
            matched_name: der?.name || 'Barangay Clearance - No Derogatory',
        };
    }
    if (stLower.includes('clearance')) {
        const clr = services.find(s => s.name && s.name.toLowerCase().includes('clearance') && !s.name.toLowerCase().includes('derogatory'));
        return {
            fee: clr ? parseFloat(clr.fee || 50) : 50.0,
            is_first_time_free: clr ? Boolean(clr.is_first_time_free) : true,
            matched_name: clr?.name || 'Barangay Clearance',
        };
    }
    if (stLower.includes('indigency')) {
        const ind = services.find(s => s.name && s.name.toLowerCase().includes('indigency'));
        return {
            fee: ind ? parseFloat(ind.fee || 50) : 50.0,
            is_first_time_free: ind ? Boolean(ind.is_first_time_free) : true,
            matched_name: ind?.name || 'Certificate of Indigency',
        };
    }

    return { fee: 0.0, is_first_time_free: false, matched_name: serviceType };
}

// ────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES (JWT protected)
// ────────────────────────────────────────────────────────────────────────────

// GET /api/admin/service-requests — Fetch all service requests with claim tracking
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

        // Fetch services config for pricing & first-time free determination
        const [allServices] = await req.db.query('SELECT id, name, fee, is_first_time_free FROM services');

        // Fetch completed requests to compute claim count criteria (only 'Completed/Claimed')
        const [completedRequests] = await req.db.query(
            `SELECT id, tracking_no, resident_name, service_type, created_at, status 
             FROM service_requests 
             WHERE status = 'Completed/Claimed' 
             ORDER BY created_at ASC, id ASC`
        );

        // Map total completed claims per resident and completed list per resident & service group
        const residentTotalClaims = {};
        const completedByResidentAndService = {};

        completedRequests.forEach((cr) => {
            const resKey = (cr.resident_name || '').toLowerCase().trim();
            if (!resKey) return;
            residentTotalClaims[resKey] = (residentTotalClaims[resKey] || 0) + 1;

            const groupKey = `${resKey}::${getServiceGroupKey(cr.service_type)}`;
            if (!completedByResidentAndService[groupKey]) {
                completedByResidentAndService[groupKey] = [];
            }
            completedByResidentAndService[groupKey].push(cr);
        });

        // Annotate each request with claim sequence and First-Time Free status
        const annotatedRows = rows.map((r) => {
            const resKey = (r.resident_name || '').toLowerCase().trim();
            const groupKey = `${resKey}::${getServiceGroupKey(r.service_type)}`;
            const svcConfig = findServiceConfig(allServices, r.service_type);
            const completedList = completedByResidentAndService[groupKey] || [];
            const totalResidentClaims = residentTotalClaims[resKey] || 0;

            let sequence = 1;
            const isCompleted = r.status === 'Completed/Claimed';

            if (isCompleted) {
                const idx = completedList.findIndex(c => c.id === r.id);
                sequence = idx >= 0 ? idx + 1 : (completedList.length || 1);
            } else {
                sequence = completedList.length + 1;
            }

            const feeAmount = parseFloat(svcConfig.fee || 0);
            const isFree = sequence === 1 && svcConfig.is_first_time_free;
            const ord = getOrdinal(sequence);

            const badgeText = isFree
                ? `${ord} Claim • FREE`
                : feeAmount > 0
                    ? `${ord} Claim • ₱${feeAmount.toFixed(2)}`
                    : `${ord} Claim • No Fee`;

            return {
                ...r,
                claim_info: {
                    sequence,
                    label: `${ord} Claim`,
                    is_first_time_free: svcConfig.is_first_time_free,
                    is_free: isFree,
                    fee: feeAmount,
                    badge_text: badgeText,
                    total_resident_claims: totalResidentClaims,
                    prior_completed_claims: completedList.length,
                }
            };
        });

        res.json({ requests: annotatedRows, total: annotatedRows.length });
    } catch (error) {
        console.error('Fetch service requests error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/service-requests/claim-history/:name — Full claim history for a resident
router.get('/claim-history/:name', verifyToken, async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name).trim();
        if (!name) return res.status(400).json({ error: 'Resident name is required.' });

        const [allServices] = await req.db.query('SELECT id, name, fee, is_first_time_free FROM services');

        // Completed claims (only Completed/Claimed count as claims)
        const [completedClaims] = await req.db.query(
            `SELECT id, tracking_no, resident_name, service_type, purpose, status, 
                    address, age, civil_status, birthdate, years_of_residency, requestor, 
                    processed_by, created_at, updated_at
             FROM service_requests 
             WHERE LOWER(TRIM(resident_name)) = LOWER(?) AND status = 'Completed/Claimed'
             ORDER BY created_at ASC, id ASC`,
            [name]
        );

        // Active / Pending requests
        const [activeRequests] = await req.db.query(
            `SELECT id, tracking_no, resident_name, service_type, purpose, status, 
                    address, age, civil_status, birthdate, years_of_residency, requestor, 
                    processed_by, created_at, updated_at
             FROM service_requests 
             WHERE LOWER(TRIM(resident_name)) = LOWER(?) AND status != 'Completed/Claimed'
             ORDER BY created_at DESC`,
            [name]
        );

        // Sequence per service group
        const groupCounts = {};
        const annotatedClaims = completedClaims.map((claim) => {
            const groupKey = getServiceGroupKey(claim.service_type);
            groupCounts[groupKey] = (groupCounts[groupKey] || 0) + 1;
            const seq = groupCounts[groupKey];
            const svcConfig = findServiceConfig(allServices, claim.service_type);
            const isFree = seq === 1 && svcConfig.is_first_time_free;
            const ord = getOrdinal(seq);
            const feeAmount = parseFloat(svcConfig.fee || 0);

            return {
                ...claim,
                claim_sequence: seq,
                claim_label: `${ord} Claim`,
                is_free: isFree,
                fee: feeAmount,
                pricing_label: isFree ? 'FREE (First-Time Claim)' : (feeAmount > 0 ? `₱${feeAmount.toFixed(2)}` : 'No Fee'),
            };
        });

        // Summary breakdown per service type
        const breakdown = {};
        annotatedClaims.forEach((c) => {
            const st = c.service_type || 'Unknown';
            if (!breakdown[st]) {
                const svcConfig = findServiceConfig(allServices, st);
                breakdown[st] = {
                    service_type: st,
                    count: 0,
                    fee: parseFloat(svcConfig.fee || 0),
                    is_first_time_free: svcConfig.is_first_time_free,
                };
            }
            breakdown[st].count += 1;
        });

        // Annotate active requests with next sequence number
        const annotatedActive = activeRequests.map((reqItem) => {
            const groupKey = getServiceGroupKey(reqItem.service_type);
            const completedCount = groupCounts[groupKey] || 0;
            const seq = completedCount + 1;
            const svcConfig = findServiceConfig(allServices, reqItem.service_type);
            const isFree = seq === 1 && svcConfig.is_first_time_free;
            const ord = getOrdinal(seq);
            const feeAmount = parseFloat(svcConfig.fee || 0);

            return {
                ...reqItem,
                claim_sequence: seq,
                claim_label: `${ord} Claim (Pending)`,
                is_free: isFree,
                fee: feeAmount,
                pricing_label: isFree ? 'FREE (First-Time Claim)' : (feeAmount > 0 ? `₱${feeAmount.toFixed(2)}` : 'No Fee'),
            };
        });

        res.json({
            resident_name: name,
            total_completed_claims: completedClaims.length,
            total_active_requests: activeRequests.length,
            service_breakdown: Object.values(breakdown),
            claims: annotatedClaims.reverse(), // newest first
            active_requests: annotatedActive,
        });
    } catch (error) {
        console.error('Claim history error:', error);
        res.status(500).json({ error: 'Server error while fetching claim history.' });
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
        if (service_type) {
            const isAllowedType = await isValidServiceType(req.db, service_type);
            if (!isAllowedType) {
                return res.status(400).json({ error: 'Invalid service type.' });
            }
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

// PATCH & PUT /api/admin/service-requests/:id/status — Update status (admin)
const handleStatusUpdate = async (req, res) => {
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
};

router.patch('/:id/status', verifyToken, handleStatusUpdate);
router.put('/:id/status', verifyToken, handleStatusUpdate);

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
