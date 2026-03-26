// ============================================
// routes/auth.js — Login & Logout
// ============================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Find admin by username
        const [rows] = await req.db.query('SELECT * FROM admins WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const admin = rows[0];

        // Compare password with stored hash
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Update admin status to online
        await req.db.query('UPDATE admins SET status = ? WHERE id = ?', ['online', admin.id]);

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await req.db.query('UPDATE admins SET status = ? WHERE id = ?', ['offline', decoded.id]);
        }

        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.json({ message: 'Logged out successfully.' });
    }
});

module.exports = router;
