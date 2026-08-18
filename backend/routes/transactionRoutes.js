const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');
// const NotificationHelper = require('../utils/notificationHelper'); // Comment this out temporarily

// All routes are protected
router.use(protect);

// ==================== SUMMARY ====================
router.get('/summary', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const userId = req.user.id;
        
        console.log('📊 Summary request for user:', userId);
        
        let dateCondition = '';
        if (period === 'daily') {
            dateCondition = 'AND transaction_date = CURDATE()';
        } else if (period === 'weekly') {
            dateCondition = 'AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        } else if (period === 'month') {
            dateCondition = 'AND MONTH(transaction_date) = MONTH(CURDATE()) AND YEAR(transaction_date) = YEAR(CURDATE())';
        } else if (period === 'year') {
            dateCondition = 'AND YEAR(transaction_date) = YEAR(CURDATE())';
        }

        // Get income
        const [incomeResult] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
             WHERE user_id = ? AND type = 'income' ${dateCondition}`,
            [userId]
        );

        // Get expenses
        const [expenseResult] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
             WHERE user_id = ? AND type = 'expense' ${dateCondition}`,
            [userId]
        );

        const totalIncome = parseFloat(incomeResult[0]?.total || 0);
        const totalExpenses = parseFloat(expenseResult[0]?.total || 0);
        const balance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM transactions WHERE user_id = ? ${dateCondition}`,
            [userId]
        );

        console.log('📊 Summary result:', { totalIncome, totalExpenses, balance, savingsRate });

        res.json({
            success: true,
            summary: {
                total_income: totalIncome,
                total_expenses: totalExpenses,
                balance: balance,
                savings_rate: savingsRate,
                total_transactions: countResult[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== CATEGORY BREAKDOWN ====================
router.get('/categories', async (req, res) => {
    try {
        const { type = 'expense', month, year } = req.query;
        const userId = req.user.id;
        
        console.log('📊 Category breakdown:', { userId, type, month, year });
        
        // Build date filter
        let dateFilter = '';
        if (month && year) {
            dateFilter = `AND MONTH(t.transaction_date) = ${parseInt(month)} AND YEAR(t.transaction_date) = ${parseInt(year)}`;
        } else {
            dateFilter = `AND MONTH(t.transaction_date) = MONTH(CURDATE()) AND YEAR(t.transaction_date) = YEAR(CURDATE())`;
        }

        const [rows] = await pool.query(`
            SELECT 
                c.id as category_id,
                c.name as category_name,
                c.icon,
                c.color,
                COALESCE(SUM(t.amount), 0) as total_amount,
                COUNT(t.id) as count
            FROM categories c
            LEFT JOIN transactions t ON t.category_id = c.id 
                AND t.user_id = ? 
                AND t.type = ?
                ${dateFilter}
            WHERE c.type = ?
            GROUP BY c.id, c.name, c.icon, c.color
            HAVING total_amount > 0
            ORDER BY total_amount DESC
        `, [userId, type, type]);

        const categories = rows.map(row => ({
            category_id: row.category_id,
            category_name: row.category_name || 'Uncategorized',
            icon: row.icon || '📌',
            color: row.color || '#667eea',
            total_amount: parseFloat(row.total_amount || 0),
            count: parseInt(row.count || 0)
        }));

        console.log('✅ Categories found:', categories.length);

        res.json({
            success: true,
            categories: categories,
            type: type,
            total: categories.reduce((sum, c) => sum + c.total_amount, 0)
        });
    } catch (error) {
        console.error('❌ Category breakdown error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error'
        });
    }
});

// ==================== GET ALL TRANSACTIONS ====================
router.get('/', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const userId = req.user.id;
        
        const [rows] = await pool.query(
            `SELECT t.*, c.name as category_name, c.icon, c.color 
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ?
             ORDER BY t.transaction_date DESC
             LIMIT ?`,
            [userId, parseInt(limit)]
        );

        res.json({ success: true, transactions: rows });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== CREATE TRANSACTION ====================
router.post('/', async (req, res) => {
    try {
        const { category_id, amount, type, description, transaction_date } = req.body;
        const userId = req.user.id;

        console.log('📝 Creating transaction:', { userId, category_id, amount, type, description });

        // Validate
        if (!category_id) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }
        if (!type) {
            return res.status(400).json({ success: false, message: 'Transaction type is required' });
        }

        // Check if category exists
        const [categoryCheck] = await pool.query(
            'SELECT id, name FROM categories WHERE id = ?',
            [category_id]
        );
        
        if (categoryCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Insert transaction
        const [result] = await pool.query(
            `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, category_id, amount, type, description || '', transaction_date || new Date()]
        );

        console.log('✅ Transaction created with ID:', result.insertId);

        // Get the created transaction
        const [transactionRows] = await pool.query(
            `SELECT t.*, c.name as category_name 
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transactionId: result.insertId,
            transaction: transactionRows[0]
        });

    } catch (error) {
        console.error('❌ Error creating transaction:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error'
        });
    }
});

module.exports = router;