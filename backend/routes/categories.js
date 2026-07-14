// ============================================
// routes/categories.js — Complaint Categories CRUD
// ============================================
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// GET /api/admin/categories/public — List all categories (public, no auth)
router.get('/public', async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT id, name, accused_rule FROM complaint_categories ORDER BY name ASC'
        );
        res.json({ categories: rows });
    } catch (error) {
        console.error('List categories error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/admin/categories — List all categories (admin)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await req.db.query(
            'SELECT * FROM complaint_categories ORDER BY name ASC'
        );
        res.json({ categories: rows });
    } catch (error) {
        console.error('List categories error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/admin/categories — Create a new category (admin)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, accused_rule } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Category name is required.' });
        }

        const validRules = ['MANDATORY', 'OPTIONAL', 'HIDDEN'];
        const rule = validRules.includes(accused_rule) ? accused_rule : 'OPTIONAL';

        // Check for duplicate
        const [existing] = await req.db.query(
            'SELECT id FROM complaint_categories WHERE LOWER(name) = LOWER(?)',
            [name.trim()]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'A category with this name already exists.' });
        }

        const [result] = await req.db.query(
            'INSERT INTO complaint_categories (name, accused_rule) VALUES (?, ?)',
            [name.trim(), rule]
        );

        res.status(201).json({
            message: 'Category created successfully.',
            category: { id: result.insertId, name: name.trim(), accused_rule: rule }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PUT /api/admin/categories/:id — Update a category (admin)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { name, accused_rule } = req.body;
        const fields = [];
        const values = [];

        if (name && name.trim()) { fields.push('name = ?'); values.push(name.trim()); }
        
        const validRules = ['MANDATORY', 'OPTIONAL', 'HIDDEN'];
        if (accused_rule && validRules.includes(accused_rule)) {
            fields.push('accused_rule = ?');
            values.push(accused_rule);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(req.params.id);
        await req.db.query(
            `UPDATE complaint_categories SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Category updated successfully.' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/admin/categories/:id — Delete a category (admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await req.db.query(
            'DELETE FROM complaint_categories WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
