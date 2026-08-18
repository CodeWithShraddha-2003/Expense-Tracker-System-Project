const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');

// Get categories by type
router.get('/type/:type', protect, async (req, res) => {
    const { type } = req.params;

    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid category type. Use income or expense.'
        });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM categories WHERE type = ? ORDER BY name',
            [type]
        );
        res.json({ success: true, categories: rows });
    } catch (error) {
        console.error('Error fetching categories by type:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all categories
router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM categories ORDER BY type, name'
        );
        res.json({ success: true, categories: rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create a global/admin category.
// The previous version inserted icon, color and user_id columns even though
// the project only requires name and type for the admin category screen.
// That caused "Unknown column" / SQL errors when those columns are absent.
router.post('/', protect, async (req, res) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const type = typeof req.body.type === 'string' ? req.body.type.trim().toLowerCase() : '';

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Category name is required'
        });
    }

    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Category type must be income or expense'
        });
    }

    try {
        // Prevent duplicate category names for the same type.
        const [existing] = await pool.query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? LIMIT 1',
            [name, type]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A category with this name already exists for this type'
            });
        }

        // Use only columns required by AdminCategories.jsx.
        const [result] = await pool.query(
            'INSERT INTO categories (name, type) VALUES (?, ?)',
            [name, type]
        );

        const [rows] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Category added successfully',
            category: rows[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: error.code === 'ER_NO_SUCH_TABLE'
                ? 'Categories table was not found in the database'
                : 'Unable to add category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update category
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const type = typeof req.body.type === 'string' ? req.body.type.trim().toLowerCase() : '';

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Category name is required'
        });
    }

    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Category type must be income or expense'
        });
    }

    try {
        const [existing] = await pool.query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? AND id <> ? LIMIT 1',
            [name, type, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A category with this name already exists for this type'
            });
        }

        const [result] = await pool.query(
            'UPDATE categories SET name = ?, type = ? WHERE id = ?',
            [name, type, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to update category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete category
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            'DELETE FROM categories WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting category:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({
                success: false,
                message: 'This category is already used by transactions or budgets and cannot be deleted.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Unable to delete category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
