// ============================================
// routes/complaints.js — Public + Admin Complaints
// ============================================
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const verifyToken = require('../middleware/auth');

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
router.post('/', upload.single('photo'), async (req, res) => {
    try {
        const { full_name, address, contact_number, complaint_type, message } = req.body;

        if (!full_name || !address || !contact_number || !complaint_type || !message) {
            return res.status(400).json({ error: 'All required fields must be filled.' });
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

        const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

        // AI Classification
        const classification = await classifyComplaint(message);

        await req.db.query(
            `INSERT INTO complaints (ref_no, full_name, address, contact_number, complaint_type, category, urgency_level, message, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ref_no, full_name, address, contact_number, complaint_type, classification.category, classification.urgency_level, message, photo_url]
        );

        // Create notification for admins
        await req.db.query(
            `INSERT INTO notifications (admin_id, title, message, icon_class) VALUES (NULL, ?, ?, ?)`,
            ['New Complaint', `New complaint (${ref_no}) from ${full_name}. Category: ${classification.category} | Urgency: ${classification.urgency_level}`, 'fas fa-bell']
        );

        res.status(201).json({
            message: 'Complaint submitted successfully!',
            ref_no: ref_no,
            category: classification.category,
            urgency_level: classification.urgency_level
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
            'SELECT ref_no, full_name, complaint_type, category, status, urgency_level, submitted_at FROM complaints WHERE LOWER(TRIM(ref_no)) = ? AND LOWER(full_name) LIKE ?',
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

        res.json({ message: 'Complaint updated successfully.' });
    } catch (error) {
        console.error('Update complaint error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
