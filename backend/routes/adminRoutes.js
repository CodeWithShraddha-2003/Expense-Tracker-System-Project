const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Simple admin check (temporarily simplified)
const isAdmin = async (req, res, next) => {
    try {
        // For testing, allow all requests
        // In production, verify JWT token here
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(403).json({ success: false, message: 'Access denied' });
    }
};

// GET dashboard stats
router.get('/dashboard-stats', isAdmin, async (req, res) => {
    try {
        console.log('📊 /dashboard-stats endpoint called!');
        
        const [
            [usersResult],
            [incomeResult],
            [expenseResult],
            [categoryResult]
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) as total FROM users WHERE role != 'admin'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'"),
            pool.query("SELECT COUNT(*) as total FROM categories")
        ]);

        const stats = {
            totalUsers: usersResult[0]?.total || 0,
            totalIncome: parseFloat(incomeResult[0]?.total || 0),
            totalExpenses: parseFloat(expenseResult[0]?.total || 0),
            totalCategories: categoryResult[0]?.total || 0
        };

        console.log('📊 Dashboard Stats from database:', stats);

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
    }
});

// GET all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC'
        );
        res.json({ success: true, users: rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET all transactions
router.get('/all-transactions', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT t.*, u.full_name as user_name, c.name as category_name
             FROM transactions t
             LEFT JOIN users u ON t.user_id = u.id
             LEFT JOIN categories c ON t.category_id = c.id
             ORDER BY t.transaction_date DESC
             LIMIT 100`
        );
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Error fetching all transactions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// 8. GET dashboard stats for Admin Dashboard
router.get('/dashboard-stats', isAdmin, async (req, res) => {
    try {
        console.log('📊 Dashboard stats endpoint called');
        
        // Get all stats in parallel
        const [
            [usersResult],
            [incomeResult],
            [expenseResult],
            [categoryResult]
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) as total FROM users WHERE role != 'admin'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'"),
            pool.query("SELECT COUNT(*) as total FROM categories")
        ]);

        const stats = {
            totalUsers: usersResult[0]?.total || 0,
            totalIncome: parseFloat(incomeResult[0]?.total || 0),
            totalExpenses: parseFloat(expenseResult[0]?.total || 0),
            totalCategories: categoryResult[0]?.total || 0
        };

        console.log('📊 Stats from database:', stats);

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching dashboard stats',
            error: error.message 
        });
    }
});

// ==================== ADMIN ROUTES ====================

// 1. GET all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        console.log('📊 Fetching all users...');
        const [rows] = await pool.query(
            'SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC'
        );
        console.log('✅ Users fetched:', rows.length);
        res.json({ success: true, users: rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2. GET user by ID
router.get('/users/:userId', isAdmin, async (req, res) => {
    const { userId } = req.params;
    try {
        console.log(`📊 Fetching user ID: ${userId}`);
        const [rows] = await pool.query(
            'SELECT id, full_name, email, role, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log('✅ User found:', rows[0].full_name);
        res.json({ success: true, user: rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. GET user transactions
router.get('/users/:userId/transactions', isAdmin, async (req, res) => {
    const { userId } = req.params;
    try {
        console.log(`📊 Fetching transactions for user ID: ${userId}`);
        const [rows] = await pool.query(
            `SELECT t.*, c.name as category_name 
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ?
             ORDER BY t.transaction_date DESC`,
            [userId]
        );
        console.log(`✅ Transactions found: ${rows.length}`);
        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Error fetching user transactions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4. GET user budgets
// 4. GET user budgets (FIXED)
router.get('/users/:userId/budgets', isAdmin, async (req, res) => {
    const { userId } = req.params;
    try {
        console.log(`📊 Fetching budgets for user ID: ${userId}`);
        
        // First get all budgets for the user
        const [budgets] = await pool.query(
            `SELECT b.*, c.name as category_name
             FROM budgets b
             LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = ?`,
            [userId]
        );
        
        // For each budget, calculate spent amount from transactions
        for (let budget of budgets) {
            const [spentResult] = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) as total_spent 
                 FROM transactions 
                 WHERE user_id = ? 
                 AND category_id = ? 
                 AND type = 'expense'`,
                [userId, budget.category_id]
            );
            budget.spent = parseFloat(spentResult[0]?.total_spent || 0);
        }
        
        console.log(`✅ Budgets found: ${budgets.length}`);
        console.log('📋 Budgets with spent:', budgets);
        
        res.json({ success: true, budgets: budgets });
    } catch (error) {
        console.error('Error fetching user budgets:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 5. GET dashboard stats
router.get('/dashboard-stats', isAdmin, async (req, res) => {
    try {
        console.log('📊 Fetching dashboard stats...');
        
        const [
            [usersResult],
            [incomeResult],
            [expenseResult],
            [categoryResult]
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) as total FROM users WHERE role != 'admin'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'"),
            pool.query("SELECT COUNT(*) as total FROM categories")
        ]);

        const stats = {
            totalUsers: usersResult[0]?.total || 0,
            totalIncome: parseFloat(incomeResult[0]?.total || 0),
            totalExpenses: parseFloat(expenseResult[0]?.total || 0),
            totalCategories: categoryResult[0]?.total || 0
        };

        console.log('📊 Dashboard Stats:', stats);
        res.json({ success: true, stats: stats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
    }
});
// GET all budgets (with spent calculation)
router.get('/all-budgets', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                b.*, 
                c.name as category_name,
                u.full_name as user_name,
                b.amount as amount,  -- or b.monthly_limit if that's the column name
                COALESCE((
                    SELECT SUM(amount) 
                    FROM transactions 
                    WHERE user_id = b.user_id 
                    AND category_id = b.category_id 
                    AND type = 'expense'
                    AND MONTH(transaction_date) = MONTH(b.month_year)
                    AND YEAR(transaction_date) = YEAR(b.month_year)
                ), 0) as spent
             FROM budgets b
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN users u ON b.user_id = u.id
             ORDER BY b.id DESC`
        );
        res.json({ success: true, budgets: rows });
    } catch (error) {
        console.error('Error fetching all budgets:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== GET STATS ====================
router.get('/stats', isAdmin, async (req, res) => {
    try {
        console.log('📊 Stats endpoint called');
        
        const [usersResult] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [transactionsResult] = await pool.query('SELECT COUNT(*) as total FROM transactions');
        const [incomeResult] = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'");
        const [expenseResult] = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'");
        const [budgetResult] = await pool.query("SELECT COALESCE(SUM(monthly_limit), 0) as total FROM budgets");

        const stats = {
            totalUsers: usersResult[0]?.total || 0,
            totalTransactions: transactionsResult[0]?.total || 0,
            totalIncome: parseFloat(incomeResult[0]?.total || 0),
            totalExpenses: parseFloat(expenseResult[0]?.total || 0),
            totalBudget: parseFloat(budgetResult[0]?.total || 0)
        };

        console.log('📊 Stats from database:', stats);
        res.json({ success: true, stats: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error fetching stats'
        });
    }
});

module.exports = router;