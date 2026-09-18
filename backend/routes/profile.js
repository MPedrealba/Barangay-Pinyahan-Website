// ============================================
// routes/profile.js — Admin Profile Dashboard API
// ============================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const verifyToken = require('../middleware/auth');
const uploadToDatabase = require('../config/uploadToDatabase');

// Multer memory storage for avatar uploads (max 5MB, images only)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPG, PNG, WebP) are allowed.'), false);
        }
    }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/admin/profile/me — Retrieve current admin profile + stats + recent activity
// ────────────────────────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
    try {
        const adminId = req.admin.id;

        // 1. Fetch admin details
        const [admins] = await req.db.query(
            'SELECT id, username, full_name, email, role, status, avatar_url, created_at, updated_at FROM admins WHERE id = ?',
            [adminId]
        );

        if (admins.length === 0) {
            return res.status(404).json({ error: 'Admin account not found.' });
        }

        const admin = admins[0];

        // 2. Fetch personal impact stats
        // Complaints resolved by this admin
        const [complaintsCount] = await req.db.query(
            'SELECT COUNT(*) as count FROM complaints WHERE resolved_by = ?',
            [admin.full_name]
        );

        // Service requests processed by this admin
        const [serviceRequestsCount] = await req.db.query(
            'SELECT COUNT(*) as count FROM service_requests WHERE processed_by = ?',
            [admin.full_name]
        );

        // Total audit actions performed by this admin
        const [auditCount] = await req.db.query(
            'SELECT COUNT(*) as count FROM audit_logs WHERE admin_id = ?',
            [adminId]
        );

        // 3. Recent activity from audit logs
        const [recentActivity] = await req.db.query(
            'SELECT id, action_type, action_details, created_at FROM audit_logs WHERE admin_id = ? ORDER BY created_at DESC LIMIT 10',
            [adminId]
        );

        res.json({
            profile: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                email: admin.email,
                role: admin.role,
                status: admin.status || 'online',
                avatar_url: admin.avatar_url || null,
                created_at: admin.created_at,
                updated_at: admin.updated_at
            },
            stats: {
                complaints_handled: complaintsCount[0]?.count || 0,
                service_requests_processed: serviceRequestsCount[0]?.count || 0,
                total_actions: auditCount[0]?.count || 0
            },
            recent_activity: recentActivity || []
        });
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ error: 'Server error while fetching profile.' });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/profile/me — Update current admin personal details
// ────────────────────────────────────────────────────────────────────────────
router.put('/me', verifyToken, async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { full_name, email } = req.body;

        if (!full_name?.trim() || !email?.trim()) {
            return res.status(400).json({ error: 'Full name and email are required.' });
        }

        const trimmedName = full_name.trim();
        const trimmedEmail = email.trim();

        // Check if email is already in use by another admin
        const [existing] = await req.db.query(
            'SELECT id FROM admins WHERE email = ? AND id != ?',
            [trimmedEmail, adminId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email address is already in use by another account.' });
        }

        // Update admin record
        await req.db.query(
            'UPDATE admins SET full_name = ?, email = ? WHERE id = ?',
            [trimmedName, trimmedEmail, adminId]
        );

        // Log action in audit_logs
        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [adminId, 'Profile Update', `Updated profile name to "${trimmedName}" and email to "${trimmedEmail}"`]
        ).catch(() => {});

        // Fetch updated record
        const [updated] = await req.db.query(
            'SELECT id, username, full_name, email, role, status, avatar_url, created_at, updated_at FROM admins WHERE id = ?',
            [adminId]
        );

        res.json({
            message: 'Profile updated successfully.',
            admin: updated[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error while updating profile.' });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/admin/profile/me/avatar — Upload and set profile avatar
// ────────────────────────────────────────────────────────────────────────────
router.post('/me/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        const adminId = req.admin.id;

        if (!req.file) {
            return res.status(400).json({ error: 'Please select an image file to upload.' });
        }

        // Compress and store image in MySQL media_files
        const avatarUrl = await uploadToDatabase(req.file, req.db);
        if (!avatarUrl) {
            return res.status(500).json({ error: 'Failed to process and store avatar image.' });
        }

        // Update avatar_url in admins table
        await req.db.query(
            'UPDATE admins SET avatar_url = ? WHERE id = ?',
            [avatarUrl, adminId]
        );

        // Log audit
        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [adminId, 'Avatar Update', 'Updated profile picture']
        ).catch(() => {});

        res.json({
            message: 'Avatar updated successfully.',
            avatar_url: avatarUrl
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: error.message || 'Server error while uploading avatar.' });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/profile/me/password — Change current admin password
// ────────────────────────────────────────────────────────────────────────────
router.put('/me/password', verifyToken, async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
        }

        // Fetch current password hash
        const [rows] = await req.db.query('SELECT password_hash FROM admins WHERE id = ?', [adminId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Admin account not found.' });
        }

        const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password does not match.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(new_password, salt);

        await req.db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, adminId]);

        // Audit log
        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [adminId, 'Password Change', 'Changed personal account password']
        ).catch(() => {});

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error while changing password.' });
    }
});

module.exports = router;
