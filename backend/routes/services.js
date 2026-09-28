// ============================================
// routes/services.js — Services CRUD (Admin + Public)
// ============================================
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// ------------------------------------------
// PUBLIC / READ ROUTES
// ------------------------------------------

// GET /api/services/public (or /api/admin/services/public) — List active services
router.get('/public', async (req, res) => {
    try {
        const [rows] = await req.db.query(
            "SELECT * FROM services WHERE LOWER(TRIM(status)) = 'active' ORDER BY id ASC"
        );
        res.status(200).json({ services: rows });
    } catch (error) {
        console.error('List public services error:', error);
        res.status(500).json({ error: 'Database error while fetching services.' });
    }
});

// GET /api/services (or /api/admin/services) — List all services
router.get('/', async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM services ORDER BY id ASC');
        res.status(200).json({ services: rows });
    } catch (error) {
        console.error('List services error:', error);
        res.status(500).json({ error: 'Database error while fetching services.' });
    }
});

// GET /api/services/:id (or /api/admin/services/:id) — Get a single service by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Hitting GET /api/services/:id with ID:', id);

    try {
        const [rows] = await req.db.query('SELECT * FROM services WHERE id = ?', [id]);
        if (rows.length === 0) {
            console.log(`Service ID ${id} not found in database.`);
            return res.status(404).json({ message: 'Service not found' });
        }
        console.log(`Found service #${id}:`, rows[0].name || rows[0].title);
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Server error', details: error.message });
    }
});

// Helper to validate and normalize array fields (requirements, procedures)
function validateArrayField(value, fieldLabel) {
    let items = value;
    if (typeof items === 'string') {
        try {
            items = JSON.parse(items);
        } catch {
            if (items.trim()) {
                items = [items.trim()];
            } else {
                items = [];
            }
        }
    }

    if (!Array.isArray(items) || items.length === 0) {
        return { valid: false, error: `At least one ${fieldLabel} is required and cannot be blank.` };
    }

    const trimmedItems = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof item !== 'string' || !item.trim()) {
            return { valid: false, error: `${fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)} entries cannot be blank.` };
        }
        trimmedItems.push(item.trim());
    }

    return { valid: true, data: trimmedItems };
}

// ------------------------------------------
// PROTECTED / WRITE ROUTES (Admin)
// ------------------------------------------

// POST /api/admin/services (or /api/services) — Create new service
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description, icon_class, icon_color, requirements, procedures, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Service name is required.' });
        }

        const reqValidation = validateArrayField(requirements, 'requirement');
        if (!reqValidation.valid) {
            return res.status(400).json({ error: reqValidation.error });
        }

        const procValidation = validateArrayField(procedures, 'procedure step');
        if (!procValidation.valid) {
            return res.status(400).json({ error: procValidation.error });
        }

        const reqJson = JSON.stringify(reqValidation.data);
        const procJson = JSON.stringify(procValidation.data);

        const [result] = await req.db.query(
            `INSERT INTO services (name, description, icon_class, icon_color, requirements, procedures, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                description ? description.trim() : null,
                icon_class || 'fas fa-file-alt',
                icon_color || 'blue',
                reqJson,
                procJson,
                status || 'Active'
            ]
        );

        return res.status(201).json({
            message: 'Service created successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Create service error:', error);
        return res.status(500).json({ error: 'Server error while creating service.' });
    }
});

// PUT /api/admin/services/:id (or /api/services/:id) — Update service
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon_class, icon_color, requirements, procedures, status } = req.body;

        // Check existence
        const [existing] = await req.db.query('SELECT id FROM services WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: `Service with ID ${id} not found.` });
        }

        const fields = [];
        const values = [];

        if (name !== undefined) {
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Service name cannot be blank.' });
            }
            fields.push('name = ?');
            values.push(name.trim());
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description ? description.trim() : null);
        }
        if (icon_class !== undefined) {
            fields.push('icon_class = ?');
            values.push(icon_class);
        }
        if (icon_color !== undefined) {
            fields.push('icon_color = ?');
            values.push(icon_color);
        }
        if (requirements !== undefined) {
            const reqValidation = validateArrayField(requirements, 'requirement');
            if (!reqValidation.valid) {
                return res.status(400).json({ error: reqValidation.error });
            }
            fields.push('requirements = ?');
            values.push(JSON.stringify(reqValidation.data));
        }
        if (procedures !== undefined) {
            const procValidation = validateArrayField(procedures, 'procedure step');
            if (!procValidation.valid) {
                return res.status(400).json({ error: procValidation.error });
            }
            fields.push('procedures = ?');
            values.push(JSON.stringify(procValidation.data));
        }
        if (status !== undefined) {
            fields.push('status = ?');
            values.push(status);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided to update.' });
        }

        values.push(id);
        await req.db.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);

        // Optional audit trail
        if (req.admin && req.admin.id) {
            try {
                await req.db.query(
                    `INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)`,
                    [req.admin.id, 'Service', `Updated Service #${id}`]
                );
            } catch (auditErr) {
                console.error('Audit log error (ignored):', auditErr);
            }
        }

        return res.status(200).json({ message: 'Service updated successfully.' });
    } catch (error) {
        console.error('Update service error:', error);
        return res.status(500).json({ error: 'Server error while updating service.' });
    }
});

// DELETE /api/admin/services/:id (or /api/services/:id) — Delete service
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await req.db.query('DELETE FROM services WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Service with ID ${id} not found.` });
        }

        return res.status(200).json({ message: 'Service deleted successfully.' });
    } catch (error) {
        console.error('Delete service error:', error);
        return res.status(500).json({ error: 'Server error while deleting service.' });
    }
});

module.exports = router;
