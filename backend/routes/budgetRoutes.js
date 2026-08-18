const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Budget = require('../models/Budget');

// Get all budgets
router.get('/', protect, async (req, res) => {
    try {
        const budgets = await Budget.getAll(req.user.id);
        res.json({ success: true, budgets });
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create budget
router.post('/', protect, async (req, res) => {
    try {
        const { category_id, monthly_limit, month_year } = req.body;
        
        if (!category_id || !monthly_limit || !month_year) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category, limit, and month'
            });
        }

        const budgetId = await Budget.create({
            user_id: req.user.id,
            category_id,
            monthly_limit,
            month_year
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Budget created successfully',
            budgetId 
        });
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update budget
router.put('/:id', protect, async (req, res) => {
    try {
        const { monthly_limit } = req.body;
        const updated = await Budget.update(req.params.id, req.user.id, monthly_limit);
        
        if (updated) {
            res.json({ success: true, message: 'Budget updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Budget not found' });
        }
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete budget
router.delete('/:id', protect, async (req, res) => {
    try {
        const deleted = await Budget.delete(req.params.id, req.user.id);
        
        if (deleted) {
            res.json({ success: true, message: 'Budget deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Budget not found' });
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;