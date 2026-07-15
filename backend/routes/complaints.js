// ============================================
// routes/complaints.js — Public + Admin Complaints
// ============================================
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const verifyToken = require('../middleware/auth');
const uploadToSupabase = require('../config/uploadToSupabase');
const { ipFilterMiddleware } = require('../middleware/security');

// ------------------------------------------
// Helper: Verify reCAPTCHA v3 token
// ------------------------------------------
async function verifyCaptcha(token) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || 'YOUR_RECAPTCHA_SECRET_KEY';

    // Skip real verification if still using placeholder key (dev mode)
    if (secretKey === 'YOUR_RECAPTCHA_SECRET_KEY') {
        console.warn('[CAPTCHA] Using placeholder secret key — verification skipped (dev mode).');
        return { success: true, score: 1.0, skipped: true };
    }

    try {
        const params = new URLSearchParams({
            secret:   secretKey,
            response: token,
        });
        const res  = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body:   params.toString(),
        });
        const data = await res.json();
        return data; // { success, score, action, challenge_ts, hostname, ... }
    } catch (err) {
        console.error('[CAPTCHA] Verification request failed:', err.message);
        // Non-blocking on network errors — do not deny legitimate users
        return { success: true, score: 1.0, networkError: true };
    }
}

// ------------------------------------------
// Helper: Generate random reference number
// ------------------------------------------
function generateRefNo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `BRGY-${code}`;
}

// ------------------------------------------
// Helper: AI Classification using OpenRouter
// ------------------------------------------
async function classifyComplaint(message) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('No OPENROUTER_API_KEY set, skipping AI classification');
        return { category: 'Others', urgency_level: 'Medium' };
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Barangay Pinyahan Complaint System'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a complaint classifier for a Philippine barangay (village). 
Classify the complaint into EXACTLY one category and one urgency level.

Categories: Peace & Order, Sanitation, Infrastructure, Health, Environmental, Others
Urgency Levels: Low, Medium, High, Critical

Respond in this EXACT JSON format only, no other text:
{"category": "...", "urgency_level": "..."}`
                    },
                    {
                        role: 'user',
                        content: `Classify this complaint:\n\n"${message}"`
                    }
                ],
                max_tokens: 60,
                temperature: 0
            })
        });

        if (!response.ok) {
            console.error('OpenRouter API error:', response.status);
            return { category: 'Others', urgency_level: 'Medium' };
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        
        if (text) {
            // Remove markdown code blocks and backticks (e.g., ```json ... ```)
            const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            const validCategories = ['Peace & Order', 'Sanitation', 'Infrastructure', 'Health', 'Environmental', 'Others'];
            const validUrgency = ['Low', 'Medium', 'High', 'Critical'];
            
            return {
                category: validCategories.includes(parsed.category) ? parsed.category : 'Others',
                urgency_level: validUrgency.includes(parsed.urgency_level) ? parsed.urgency_level : 'Medium'
            };
        }
    } catch (error) {
        console.error('AI classification error:', error.message);
    }

    return { category: 'Others', urgency_level: 'Medium' };
}

// ------------------------------------------
// PUBLIC ROUTES
// ------------------------------------------

// POST /api/complaints — Submit a new complaint (public)
router.post('/', ipFilterMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const {
            full_name, accused_name, address, contact_number, complaint_type, message,
            captchaToken, latitude, longitude,
        } = req.body;

        if (!full_name || !address || !contact_number || !complaint_type || !message) {
            return res.status(400).json({ error: 'All required fields must be filled.' });
        }

        // ── Validate accused_name based on category's accused_rule ──────
        let accusedRule = 'OPTIONAL'; // default fallback
        const [catRows] = await req.db.query(
            'SELECT accused_rule FROM complaint_categories WHERE name = ?',
            [complaint_type]
        );
        if (catRows.length > 0) {
            accusedRule = catRows[0].accused_rule;
        }

        if (accusedRule === 'MANDATORY' && !accused_name?.trim()) {
            return res.status(400).json({ error: 'Name of accused is required for this complaint type.' });
        }

        const finalAccusedName = accusedRule === 'HIDDEN' ? null : (accused_name?.trim() || null);

        // ── reCAPTCHA v3 server-side verification ─────────────────
        if (captchaToken) {
            const captchaResult = await verifyCaptcha(captchaToken);
            if (!captchaResult.skipped && !captchaResult.networkError) {
                if (!captchaResult.success || captchaResult.score < 0.5) {
                    console.warn(
                        `[CAPTCHA] Blocked submission — success: ${captchaResult.success}, score: ${captchaResult.score}, IP: ${req.clientIP}`
                    );
                    return res.status(400).json({
                        error: 'Automated submission detected.',
                        code:  'CAPTCHA_FAILED',
                    });
                }
                console.info(`[CAPTCHA] Passed — score: ${captchaResult.score}, IP: ${req.clientIP}`);
            }
        } else {
            // In production with real keys, require the token.
            // In dev (placeholder key), allow submission without it.
            const isProd = process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'YOUR_RECAPTCHA_SECRET_KEY';
            if (isProd) {
                return res.status(400).json({ error: 'CAPTCHA token is required.', code: 'CAPTCHA_MISSING' });
            }
        }

        // Log geolocation coordinates for audit trail (not stored in DB unless column added)
        if (latitude && longitude) {
            console.info(`[Geofence] Complaint from lat=${latitude}, lng=${longitude}, IP=${req.clientIP}`);
        }

        // Generate randomized reference number
        let ref_no = generateRefNo();
        // Ensure uniqueness
        let exists = true;
        while (exists) {
            const [check] = await req.db.query('SELECT id FROM complaints WHERE ref_no = ?', [ref_no]);
            if (check.length === 0) exists = false;
            else ref_no = generateRefNo();
        }

        // Upload complaint photo to Supabase Storage (returns full public URL or null)
        const photo_url = await uploadToSupabase(req.file);

        // ── Category: look up broad_category from complaint_categories first ──
        // This is authoritative — matches what admins defined, no AI guesswork.
        let assignedCategory = 'Others';
        const [catBroad] = await req.db.query(
            'SELECT broad_category FROM complaint_categories WHERE LOWER(name) = LOWER(?)',
            [complaint_type]
        );
        if (catBroad.length > 0 && catBroad[0].broad_category) {
            assignedCategory = catBroad[0].broad_category;
        }

        // ── Urgency: AI classification (best effort, fallback to Medium) ──────
        const classification = await classifyComplaint(message);
        const assignedUrgency = classification.urgency_level || 'Medium';

        console.info(`[Complaint] type="${complaint_type}" → category="${assignedCategory}" urgency="${assignedUrgency}"`);

        // Force alter the column to accept longer strings and bypass ENUM restrictions
        try {
            await req.db.query("ALTER TABLE complaints MODIFY COLUMN complaint_type VARCHAR(100);");
            console.log("Database schema successfully altered for complaint_type.");
        } catch (alterError) {
            console.log("Alter table skipped or failed (might already be altered):", alterError.message);
        }

        await req.db.query(
            `INSERT INTO complaints (ref_no, full_name, accused_name, address, contact_number, complaint_type, category, urgency_level, message, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ref_no, full_name, finalAccusedName, address, contact_number, complaint_type, assignedCategory, assignedUrgency, message, photo_url]
        );

        // Create notification for admins
        await req.db.query(
            `INSERT INTO notifications (admin_id, title, message, icon_class) VALUES (NULL, ?, ?, ?)`,
            ['New Complaint', `New complaint (${ref_no}) from ${full_name}. Category: ${classification.category} | Urgency: ${classification.urgency_level}`, 'fas fa-bell']
        );

        res.status(201).json({
            message: 'Complaint submitted successfully!',
            ref_no: ref_no,
            category: assignedCategory,
            urgency_level: assignedUrgency
        });
    } catch (error) {
        console.error('Submit complaint error:', error);
        res.status(500).json({ error: 'Server error while submitting complaint.' });
    }
});

// POST /api/complaints/track — Track a complaint by ref number (public)
router.post('/track', async (req, res) => {
    try {
        const { ref_no, full_name } = req.body;

        if (!ref_no || !full_name) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const cleanRef = ref_no.trim().toLowerCase();
        const cleanName = full_name.trim().toLowerCase();

        const [rows] = await req.db.query(
            'SELECT ref_no, full_name, complaint_type, category, status, urgency_level, message, admin_notes, photo_url, submitted_at FROM complaints WHERE LOWER(TRIM(ref_no)) = ? AND LOWER(full_name) LIKE ?',
            [cleanRef, `%${cleanName}%`]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Complaint not found. Please check your details.' });
        }

        res.json({ complaint: rows[0] });
    } catch (error) {
        console.error('Track complaint error:', error);
        res.status(500).json({ error: 'Server error while tracking complaint.' });
    }
});

// ------------------------------------------
// ADMIN ROUTES (protected)
// ------------------------------------------

// GET /api/complaints/admin — List all active complaints (admin)
router.get('/admin', verifyToken, async (req, res) => {
    try {
        // Auto-escalation sweep: bump urgency to 'High' for unresolved complaints older than 7 days
        await req.db.query(
            `UPDATE complaints 
             SET urgency_level = 'High' 
             WHERE status != 'Resolved' 
               AND urgency_level != 'High'
               AND DATEDIFF(NOW(), submitted_at) >= 7`
        );

        const [rows] = await req.db.query(
            'SELECT * FROM complaints WHERE status != "Resolved" ORDER BY submitted_at DESC'
        );
        res.json({ complaints: rows });
    } catch (error) {
        console.error('List complaints error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/complaints/admin/history — List only resolved complaints
router.get('/admin/history', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT * FROM complaints WHERE status = "Resolved" ORDER BY resolved_at DESC, submitted_at DESC'
        );
        res.json({ complaints: rows });
    } catch (error) {
        console.error('List complaints error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/complaints/admin/:id — Get single complaint (admin)
router.get('/admin/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT * FROM complaints WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        res.json({ complaint: rows[0] });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/complaints/admin/:id — Update complaint status & notes (admin)
router.put('/admin/:id', verifyToken, async (req, res) => {
    try {
        const { status, urgency_level, admin_notes, category } = req.body;

        const fields = [];
        const values = [];

        if (status) { 
            fields.push('status = ?'); 
            values.push(status); 
            if (status === 'Resolved') {
                fields.push('resolved_at = CURRENT_TIMESTAMP');
                fields.push('resolved_by = ?');
                values.push(req.admin.full_name || req.admin.username);
            } else {
                // If status is changed back from Resolved, clear the audit fields
                fields.push('resolved_at = NULL');
                fields.push('resolved_by = NULL');
            }
        }
        if (urgency_level) { fields.push('urgency_level = ?'); values.push(urgency_level); }
        if (admin_notes !== undefined) { fields.push('admin_notes = ?'); values.push(admin_notes); }
        if (category) { fields.push('category = ?'); values.push(category); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(req.params.id);
        await req.db.query(`UPDATE complaints SET ${fields.join(', ')} WHERE id = ?`, values);

        // Audit Trail
        await req.db.query(
            `INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)`,
            [req.admin.id, 'Complaint', `Updated details/status for Complaint #${req.params.id}`]
        );

        res.json({ message: 'Complaint updated successfully.' });
    } catch (error) {
        console.error('Update complaint error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PATCH /api/complaints/admin/:id/accused — Update accused_name (admin)
router.patch('/admin/:id/accused', verifyToken, async (req, res) => {
    try {
        const { accused_name } = req.body;

        await req.db.query(
            'UPDATE complaints SET accused_name = ? WHERE id = ?',
            [accused_name?.trim() || null, req.params.id]
        );

        // Audit Trail
        await req.db.query(
            'INSERT INTO audit_logs (admin_id, action_type, action_details) VALUES (?, ?, ?)',
            [req.admin.id, 'Complaint', `Updated accused name for Complaint #${req.params.id} to "${accused_name || 'N/A'}"`]
        );

        res.json({ message: 'Accused name updated successfully.' });
    } catch (error) {
        console.error('Update accused name error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/complaints/admin/offense-history/:name — Offense history for accused
router.get('/admin/offense-history/:name', verifyToken, async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name).trim();
        if (!name) return res.status(400).json({ error: 'Name is required.' });

        const [rows] = await req.db.query(
            `SELECT id, ref_no, category, complaint_type, urgency_level, status, submitted_at 
             FROM complaints 
             WHERE LOWER(TRIM(accused_name)) = LOWER(?) 
             ORDER BY submitted_at DESC`,
            [name]
        );

        const categories = rows.map(r => r.category || r.complaint_type).filter(Boolean);

        res.json({
            accused_name: name,
            total_offenses: rows.length,
            categories: [...new Set(categories)],
            history: rows,
        });
    } catch (error) {
        console.error('Offense history error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
