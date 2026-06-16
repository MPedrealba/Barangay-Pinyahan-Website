// ============================================
// routes/services.js — Services CRUD (Admin) + Public
// ============================================
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------

// GET /api/admin/services/public — List active services (public)
router.get('/public', async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT * FROM services WHERE status = ? ORDER BY id ASC', ['Active']
        );
        res.json({ services: rows });
    } catch (error) {
        console.error('List services error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ------------------------------------------
// ADMIN ROUTES (protected)
// ------------------------------------------

// GET /api/admin/services — List all services
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM services ORDER BY id ASC');
        res.json({ services: rows });
    } catch (error) {
        console.error('List services error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/services/:id — Get single service
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Service not found.' });
        }
        res.json({ service: rows[0] });
    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/services — Create service
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description, icon_class, icon_color, requirements, procedures, status } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Service name is required.' });
        }

        const reqJson = requirements ? JSON.stringify(requirements) : '[]';
        const procJson = procedures ? JSON.stringify(procedures) : '[]';

        const [result] = await req.db.query(
            `INSERT INTO services (name, description, icon_class, icon_color, requirements, procedures, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description || null, icon_class || 'fas fa-file-alt', icon_color || 'blue', reqJson, procJson, status || 'Active']
        );

        res.status(201).json({ message: 'Service created successfully.', id: result.insertId });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/services/:id — Update service
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { name, description, icon_class, icon_color, requirements, procedures, status } = req.body;

        const fields = [];
        const values = [];

        if (name) { fields.push('name = ?'); values.push(name); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (icon_class) { fields.push('icon_class = ?'); values.push(icon_class); }
        if (icon_color) { fields.push('icon_color = ?'); values.push(icon_color); }
        if (requirements) { fields.push('requirements = ?'); values.push(JSON.stringify(requirements)); }
        if (procedures) { fields.push('procedures = ?'); values.push(JSON.stringify(procedures)); }
        if (status) { fields.push('status = ?'); values.push(status); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(req.params.id);
        await req.db.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);

        // Audit Trail
        await req.db.query(
            `INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)`,
            [req.admin.id, 'Service', `Updated requirements/procedures for Service #${req.params.id}`]
        );

        res.json({ message: 'Service updated successfully.' });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/services/:id — Delete service
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await req.db.query('DELETE FROM services WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service not found.' });
        }
        res.json({ message: 'Service deleted successfully.' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
