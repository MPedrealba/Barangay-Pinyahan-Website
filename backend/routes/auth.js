// ============================================
// routes/auth.js — Login & Logout
// ============================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Find admin by username
        const [rows] = await req.db.query('SELECT id, username, full_name, role, email, password_hash, requires_password_change FROM admins WHERE username = ?', [username]);

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

        // Generate JWT token (default 24h)
        const token = jwt.sign(
            { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                email: admin.email,
                role: admin.role,
                requires_password_change: Boolean(admin.requires_password_change)
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

// PUT /api/auth/force-change-password
router.put('/force-change-password', async (req, res) => {
    const { username, new_password } = req.body;

    if (!username || !new_password) {
        return res.status(400).json({ error: 'Username and new password are required.' });
    }

    try {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(new_password, saltRounds);

        const [result] = await req.db.query(
            'UPDATE admins SET password_hash = ?, requires_password_change = FALSE WHERE username = ?',
            [password_hash, username]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Admin not found.' });
        }

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password — Request password reset (OTP + Link)
// ────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({ error: 'Email address is required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Look up admin by email
        const [rows] = await req.db.query(
            'SELECT id, username, full_name, email FROM admins WHERE LOWER(email) = ?',
            [normalizedEmail]
        );

        // Security best practice: Always return generic success message to prevent user enumeration
        const genericMessage = 'If an account exists with that email, a verification code and reset link have been sent.';

        if (rows.length === 0) {
            return res.json({ message: genericMessage });
        }

        const admin = rows[0];

        // 2. Invalidate any previous unused tokens for this admin
        await req.db.query(
            'UPDATE password_resets SET used = 1 WHERE admin_id = ? AND used = 0',
            [admin.id]
        );

        // 3. Generate 6-digit OTP and secure 32-byte crypto token
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const rawToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // 4. Save to password_resets table
        await req.db.query(
            `INSERT INTO password_resets (admin_id, email, token_hash, otp_code, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
            [admin.id, admin.email, rawToken, otpCode, expiresAt]
        );

        // 5. Build reset URL and dispatch email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

        await sendPasswordResetEmail({
            toEmail: admin.email,
            recipientName: admin.full_name,
            otpCode,
            resetUrl
        });

        res.json({
            message: genericMessage
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error while processing forgot password request.' });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-reset-code — Verify OTP or Token before setting new password
// ────────────────────────────────────────────────────────────────────────────
router.post('/verify-reset-code', async (req, res) => {
    try {
        const { email, otp_code, token } = req.body;

        if (!token && (!email || !otp_code)) {
            return res.status(400).json({ error: 'Verification code or reset token is required.' });
        }

        let query = 'SELECT * FROM password_resets WHERE used = 0 AND expires_at > NOW()';
        const params = [];

        if (token) {
            query += ' AND token_hash = ?';
            params.push(token);
        } else {
            query += ' AND LOWER(email) = ? AND otp_code = ?';
            params.push(email.trim().toLowerCase(), otp_code.trim());
        }

        const [rows] = await req.db.query(query, params);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification code / token.' });
        }

        res.json({
            valid: true,
            email: rows[0].email
        });
    } catch (error) {
        console.error('Verify reset code error:', error);
        res.status(500).json({ error: 'Server error while verifying reset code.' });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password — Set new password with verified OTP / Token
// ────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp_code, token, new_password } = req.body;

        if (!new_password || new_password.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
        }

        if (!token && (!email || !otp_code)) {
            return res.status(400).json({ error: 'Verification credentials (token or email + code) are required.' });
        }

        // 1. Verify active reset record
        let query = 'SELECT * FROM password_resets WHERE used = 0 AND expires_at > NOW()';
        const params = [];

        if (token) {
            query += ' AND token_hash = ?';
            params.push(token);
        } else {
            query += ' AND LOWER(email) = ? AND otp_code = ?';
            params.push(email.trim().toLowerCase(), otp_code.trim());
        }

        const [rows] = await req.db.query(query, params);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Reset session expired or invalid. Please request a new code.' });
        }

        const resetRecord = rows[0];

        // 2. Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(new_password, salt);

        // 3. Update admin password
        await req.db.query(
            'UPDATE admins SET password_hash = ?, requires_password_change = FALSE WHERE id = ?',
            [passwordHash, resetRecord.admin_id]
        );

        // 4. Mark token as used
        await req.db.query(
            'UPDATE password_resets SET used = 1 WHERE id = ?',
            [resetRecord.id]
        );

        // 5. Record in audit_logs
        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [resetRecord.admin_id, 'Password Reset', 'Password successfully reset via email recovery']
        ).catch(() => {});

        res.json({ message: 'Password has been reset successfully. You may now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error while resetting password.' });
    }
});

module.exports = router;
