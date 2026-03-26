// ============================================
// routes/accounts.js — Admin Account Management
// ============================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const verifyToken = require('../middleware/auth');

// GET /api/admin/accounts — List all admin accounts
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT id, username, full_name, email, status, role, created_at FROM admins ORDER BY id ASC'
        );
        res.json({ admins: rows });
    } catch (error) {
        console.error('List accounts error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/accounts/stats — Get account stats
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [total] = await req.db.query('SELECT COUNT(*) as count FROM admins');
        const [active] = await req.db.query("SELECT COUNT(*) as count FROM admins WHERE status = 'online'");

        res.json({
            total_admins: total[0].count,
            active_admins: active[0].count
        });
    } catch (error) {
        console.error('Account stats error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/accounts/:id — Get single admin account
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT id, username, full_name, email, status, role, created_at FROM admins WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found.' });
        }
        res.json({ admin: rows[0] });
    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/accounts — Register new admin account
router.post('/', verifyToken, async (req, res) => {
    try {
        const { full_name, username, email, password } = req.body;

        if (!full_name || !username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Check if username or email already exists
        const [existing] = await req.db.query(
            'SELECT id FROM admins WHERE username = ? OR email = ?', [username, email]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await req.db.query(
            'INSERT INTO admins (username, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
            [username, full_name, email, password_hash]
        );

        res.status(201).json({ message: 'Admin account created successfully.', id: result.insertId });
    } catch (error) {
        console.error('Register account error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/accounts/:id — Update admin account
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { full_name, username, email, password } = req.body;

        const fields = [];
        const values = [];

        if (full_name) { fields.push('full_name = ?'); values.push(full_name); }
        if (username) { fields.push('username = ?'); values.push(username); }
        if (email) { fields.push('email = ?'); values.push(email); }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            fields.push('password_hash = ?');
            values.push(password_hash);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(req.params.id);
        await req.db.query(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Admin account updated successfully.' });
    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/accounts/:id — Delete admin account
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.admin.id) {
            return res.status(400).json({ error: 'You cannot delete your own account.' });
        }

        const [result] = await req.db.query('DELETE FROM admins WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Admin not found.' });
        }
        res.json({ message: 'Admin account deleted successfully.' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
