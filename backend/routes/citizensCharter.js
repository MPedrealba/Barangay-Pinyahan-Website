// ============================================
// routes/citizensCharter.js — Citizen's Charter
// Full CRUD with Transactions for:
//   barangay_services, service_requirements, service_steps
// ============================================
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// ── Helper: fetch a charter with its requirements & steps ─────
async function fetchCharterById(db, id) {
    const [rows] = await db.query(
        'SELECT * FROM barangay_services WHERE id = ?', [id]
    );
    if (rows.length === 0) return null;

    const charter = rows[0];

    const [requirements] = await db.query(
        'SELECT * FROM service_requirements WHERE service_id = ? ORDER BY id ASC', [id]
    );
    const [steps] = await db.query(
        'SELECT * FROM service_steps WHERE service_id = ? ORDER BY step_number ASC', [id]
    );

    charter.requirements = requirements;
    charter.steps = steps;
    return charter;
}

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------

// GET /api/citizens-charter/public — List all charter services with details
router.get('/public', async (req, res) => {
    try {
        const [services] = await req.db.query(
            'SELECT * FROM barangay_services ORDER BY id ASC'
        );

        // Fetch requirements & steps for each service
        for (const svc of services) {
            const [requirements] = await req.db.query(
                'SELECT * FROM service_requirements WHERE service_id = ? ORDER BY id ASC',
                [svc.id]
            );
            const [steps] = await req.db.query(
                'SELECT * FROM service_steps WHERE service_id = ? ORDER BY step_number ASC',
                [svc.id]
            );
            svc.requirements = requirements;
            svc.steps = steps;
        }

        res.json({ services });
    } catch (error) {
        console.error('Public charter list error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ------------------------------------------
// ADMIN ROUTES (protected)
// ------------------------------------------

// GET / — List all charter services (admin)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [services] = await req.db.query(
            'SELECT * FROM barangay_services ORDER BY id ASC'
        );

        // Attach counts for the list view
        for (const svc of services) {
            const [reqCount] = await req.db.query(
                'SELECT COUNT(*) as count FROM service_requirements WHERE service_id = ?',
                [svc.id]
            );
            const [stepCount] = await req.db.query(
                'SELECT COUNT(*) as count FROM service_steps WHERE service_id = ?',
                [svc.id]
            );
            svc.requirements_count = reqCount[0].count;
            svc.steps_count = stepCount[0].count;
        }

        res.json({ services });
    } catch (error) {
        console.error('Admin charter list error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /:id — Get a single charter service with full details
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const charter = await fetchCharterById(req.db, req.params.id);
        if (!charter) {
            return res.status(404).json({ error: 'Charter service not found.' });
        }
        res.json({ charter });
    } catch (error) {
        console.error('Get charter error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST / — Create a new charter service (transactional)
router.post('/', verifyToken, async (req, res) => {
    let connection;

    try {
        const {
            service_name,
            office_division,
            classification,
            transaction_type,
            who_may_avail,
            requirements,
            steps,
        } = req.body;

        // Validation
        if (!service_name || !service_name.trim()) {
            return res.status(400).json({ error: 'Service name is required.' });
        }

        // 1. Acquire dedicated connection from the pool & begin transaction
        connection = await req.db.getConnection();
        await connection.beginTransaction();

        // 2. Insert core details into barangay_services
        const [serviceResult] = await connection.query(
            `INSERT INTO barangay_services 
                (service_name, office_division, classification, transaction_type, who_may_avail)
             VALUES (?, ?, ?, ?, ?)`,
            [
                service_name.trim(),
                office_division ? office_division.trim() : null,
                classification || null,
                transaction_type || null,
                who_may_avail ? who_may_avail.trim() : null,
            ]
        );

        // 3. Retrieve the generated service ID
        const serviceId = serviceResult.insertId;

        // 4. Bulk insert requirements if present
        if (Array.isArray(requirements) && requirements.length > 0) {
            const reqValues = requirements
                .filter((r) => r && (r.name || r.requirement_name))
                .map((r) => [
                    serviceId,
                    (r.name || r.requirement_name).trim(),
                    r.where_to_secure ? r.where_to_secure.trim() : null,
                ]);

            if (reqValues.length > 0) {
                await connection.query(
                    `INSERT INTO service_requirements (service_id, name, where_to_secure) VALUES ?`,
                    [reqValues]
                );
            }
        }

        // 5. Bulk insert processing steps with 1-based index numbering
        if (Array.isArray(steps) && steps.length > 0) {
            const stepValues = steps
                .filter((s) => s && (s.client_step || s.agency_action || s.action_taken))
                .map((s, index) => [
                    serviceId,
                    s.step_number || index + 1,
                    s.client_step ? s.client_step.trim() : null,
                    (s.agency_action || s.action_taken) ? (s.agency_action || s.action_taken).trim() : null,
                    s.fees ? s.fees.trim() : 'None',
                    s.processing_time ? s.processing_time.trim() : null,
                    s.person_responsible ? s.person_responsible.trim() : null,
                ]);

            if (stepValues.length > 0) {
                await connection.query(
                    `INSERT INTO service_steps 
                        (service_id, step_number, client_step, agency_action, fees, processing_time, person_responsible)
                     VALUES ?`,
                    [stepValues]
                );
            }
        }

        // 6. Commit transaction
        await connection.commit();

        return res.status(201).json({
            message: "Citizen's Charter created successfully.",
            service_id: serviceId,
        });
    } catch (error) {
        // 7. Rollback on any failure
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error('Rollback error:', rollbackErr);
            }
        }
        console.error("Create Citizen's Charter error:", error);
        return res.status(500).json({
            error: "Failed to create Citizen's Charter. Transaction rolled back.",
            details: error.message,
        });
    } finally {
        // Always release connection back to pool
        if (connection) {
            connection.release();
        }
    }
});

// PUT /:id — Update a charter service (transactional)
router.put('/:id', verifyToken, async (req, res) => {
    const connection = await req.db.getConnection();

    try {
        const {
            service_name,
            office_division,
            classification,
            transaction_type,
            who_may_avail,
            requirements,
            steps,
        } = req.body;

        const id = req.params.id;

        // Check existence
        const [existing] = await connection.query(
            'SELECT id FROM barangay_services WHERE id = ?', [id]
        );
        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Charter service not found.' });
        }

        await connection.beginTransaction();

        // 1. Update core fields
        await connection.query(
            `UPDATE barangay_services SET
                service_name = ?, office_division = ?, classification = ?,
                transaction_type = ?, who_may_avail = ?
             WHERE id = ?`,
            [
                service_name,
                office_division || null,
                classification || null,
                transaction_type || null,
                who_may_avail || null,
                id,
            ]
        );

        // 2. Replace requirements: delete old, insert new
        await connection.query(
            'DELETE FROM service_requirements WHERE service_id = ?', [id]
        );
        if (Array.isArray(requirements) && requirements.length > 0) {
            const reqValues = requirements
                .filter((r) => r && (r.name || r.requirement_name))
                .map((r) => [
                    id,
                    (r.name || r.requirement_name).trim(),
                    r.where_to_secure ? r.where_to_secure.trim() : null,
                ]);

            if (reqValues.length > 0) {
                await connection.query(
                    `INSERT INTO service_requirements (service_id, name, where_to_secure) VALUES ?`,
                    [reqValues]
                );
            }
        }

        // 3. Replace steps: delete old, insert new
        await connection.query(
            'DELETE FROM service_steps WHERE service_id = ?', [id]
        );
        if (Array.isArray(steps) && steps.length > 0) {
            const stepValues = steps
                .filter((s) => s && (s.client_step || s.agency_action || s.action_taken))
                .map((s, index) => [
                    id,
                    s.step_number || index + 1,
                    s.client_step ? s.client_step.trim() : null,
                    (s.agency_action || s.action_taken) ? (s.agency_action || s.action_taken).trim() : null,
                    s.fees ? s.fees.trim() : 'None',
                    s.processing_time ? s.processing_time.trim() : null,
                    s.person_responsible ? s.person_responsible.trim() : null,
                ]);

            if (stepValues.length > 0) {
                await connection.query(
                    `INSERT INTO service_steps 
                        (service_id, step_number, client_step, agency_action, fees, processing_time, person_responsible)
                     VALUES ?`,
                    [stepValues]
                );
            }
        }

        await connection.commit();
        connection.release();

        res.json({ message: "Citizen's Charter service updated successfully." });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("Update charter error:", error);
        return res.status(500).json({ error: 'Server error. Transaction rolled back.' });
    }
});

// DELETE /:id — Delete a charter service (CASCADE handles children)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await req.db.query(
            'DELETE FROM barangay_services WHERE id = ?', [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Charter service not found.' });
        }
        res.json({ message: "Citizen's Charter service deleted successfully." });
    } catch (error) {
        console.error('Delete charter error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
