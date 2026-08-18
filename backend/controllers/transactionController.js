const { pool } = require('../config/database');
const NotificationHelper = require('../utils/notificationHelper');

// @desc    Add transaction
// @route   POST /api/transactions
const addTransaction = async (req, res) => {
    try {
        const { category_id, amount, type, description, transaction_date } = req.body;
        const user_id = req.user.id;

        console.log('📝 Add transaction request:', { user_id, category_id, amount, type, description });

        // Validation
        if (!amount || !type) {
            return res.status(400).json({
                success: false,
                message: 'Please provide amount and type'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        if (!['income', 'expense'].includes(type.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Type must be income or expense'
            });
        }

        // Check if category exists
        if (category_id) {
            const [categoryRows] = await pool.query(
                'SELECT id, name FROM categories WHERE id = ?',
                [category_id]
            );
            
            if (categoryRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Category with ID ${category_id} not found`
                });
            }
        }

        // Insert transaction
        const [result] = await pool.query(
            `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, category_id || null, amount, type.toLowerCase(), description || '', transaction_date || new Date()]
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

        // Send notification
        try {
            const categoryName = transactionRows[0]?.category_name || 'uncategorized';
            if (type.toLowerCase() === 'income') {
                await NotificationHelper.notifyIncomeAdded(user_id, {
                    amount: amount,
                    category_name: categoryName,
                    description: description || ''
                });
            } else {
                await NotificationHelper.notifyExpenseAdded(user_id, {
                    amount: amount,
                    category_name: categoryName,
                    description: description || ''
                });
            }
        } catch (notifError) {
            console.log('⚠️ Notification error (non-critical):', notifError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Transaction added successfully',
            transaction: transactionRows[0]
        });

    } catch (error) {
        console.error('❌ Error adding transaction:', error);
        console.error('❌ SQL Error:', error.sqlMessage || error.message);
        
        res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message || 'Server error while adding transaction'
        });
    }
};

// @desc    Get all transactions
const getTransactions = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { type, category_id, start_date, end_date, limit = 10 } = req.query;

        let query = `
            SELECT t.*, c.name as category_name, c.icon, c.color 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
        `;
        const params = [user_id];

        if (type) {
            query += ` AND t.type = ?`;
            params.push(type.toLowerCase());
        }
        if (category_id) {
            query += ` AND t.category_id = ?`;
            params.push(parseInt(category_id));
        }
        if (start_date) {
            query += ` AND t.transaction_date >= ?`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND t.transaction_date <= ?`;
            params.push(end_date);
        }

        query += ` ORDER BY t.transaction_date DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [rows] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            count: rows.length,
            transactions: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching transactions'
        });
    }
};

// @desc    Get single transaction
const getTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const [rows] = await pool.query(
            `SELECT t.*, c.name as category_name 
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.id = ? AND t.user_id = ?`,
            [id, user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            transaction: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching transaction'
        });
    }
};

// @desc    Update transaction
const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { category_id, amount, type, description, transaction_date } = req.body;

        const [existing] = await pool.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        const [result] = await pool.query(
            `UPDATE transactions 
             SET category_id = ?, amount = ?, type = ?, description = ?, transaction_date = ?
             WHERE id = ? AND user_id = ?`,
            [category_id || existing[0].category_id, 
             amount || existing[0].amount, 
             type || existing[0].type, 
             description || existing[0].description, 
             transaction_date || existing[0].transaction_date, 
             id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Update failed'
            });
        }

        const [updated] = await pool.query(
            `SELECT t.*, c.name as category_name 
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.id = ? AND t.user_id = ?`,
            [id, user_id]
        );

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            transaction: updated[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating transaction'
        });
    }
};

// @desc    Delete transaction
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const [existing] = await pool.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        const [result] = await pool.query(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Delete failed'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting transaction'
        });
    }
};

// @desc    Get transaction summary
const getSummary = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { period = 'month' } = req.query;

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

        const [summary] = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance,
                COUNT(*) as total_transactions
             FROM transactions
             WHERE user_id = ? ${dateCondition}`,
            [user_id]
        );

        const savingsRate = summary.total_income > 0 
            ? ((summary.total_income - summary.total_expenses) / summary.total_income) * 100 
            : 0;

        res.status(200).json({
            success: true,
            summary: {
                total_income: parseFloat(summary.total_income),
                total_expenses: parseFloat(summary.total_expenses),
                balance: parseFloat(summary.balance),
                savings_rate: parseFloat(savingsRate.toFixed(2)),
                total_transactions: summary.total_transactions,
                period
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching summary'
        });
    }
};

// @desc    Get category breakdown
const getCategoryBreakdown = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { type = 'expense', month, year } = req.query;

        let dateCondition = '';
        if (month && year) {
            dateCondition = `AND MONTH(transaction_date) = ${parseInt(month)} AND YEAR(transaction_date) = ${parseInt(year)}`;
        } else {
            dateCondition = `AND MONTH(transaction_date) = MONTH(CURDATE()) AND YEAR(transaction_date) = YEAR(CURDATE())`;
        }

        const [categories] = await pool.query(
            `SELECT id, name, icon, color 
             FROM categories 
             WHERE (user_id = ? OR user_id IS NULL) AND type = ?`,
            [user_id, type]
        );

        const result = [];
        for (const category of categories) {
            const [rows] = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as transaction_count
                 FROM transactions
                 WHERE user_id = ? AND category_id = ? AND type = ?
                 ${dateCondition}`,
                [user_id, category.id, type]
            );
            result.push({
                ...category,
                total_amount: parseFloat(rows[0]?.total_amount || 0),
                transaction_count: parseInt(rows[0]?.transaction_count || 0)
            });
        }

        result.sort((a, b) => b.total_amount - a.total_amount);
        const total = result.reduce((sum, cat) => sum + cat.total_amount, 0);

        const categoriesWithPercentage = result.map(cat => ({
            ...cat,
            percentage: total > 0 ? parseFloat(((cat.total_amount / total) * 100).toFixed(2)) : 0
        }));

        res.json({
            success: true,
            type,
            categories: categoriesWithPercentage,
            total: parseFloat(total)
        });
    } catch (error) {
        console.error('Error in getCategoryBreakdown:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// @desc    Get daily trends
const getDailyTrends = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { type = 'expense', days = 30 } = req.query;

        const [trends] = await pool.query(
            `SELECT 
                DATE(transaction_date) as date,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(*) as transaction_count
             FROM transactions
             WHERE user_id = ? AND type = ?
                AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(transaction_date)
             ORDER BY date ASC`,
            [user_id, type, parseInt(days)]
        );

        res.status(200).json({
            success: true,
            type,
            days: parseInt(days),
            trends: trends.map(t => ({
                ...t,
                total_amount: parseFloat(t.total_amount)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching daily trends'
        });
    }
};

// @desc    Get monthly trends
const getMonthlyTrends = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { type = 'expense', months = 12 } = req.query;

        const [trends] = await pool.query(
            `SELECT 
                DATE_FORMAT(transaction_date, '%b') as month,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(*) as transaction_count
             FROM transactions
             WHERE user_id = ? AND type = ?
                AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
             GROUP BY MONTH(transaction_date)
             ORDER BY transaction_date ASC`,
            [user_id, type, parseInt(months)]
        );

        res.status(200).json({
            success: true,
            type,
            months: parseInt(months),
            trends: trends.map(t => ({
                ...t,
                total_amount: parseFloat(t.total_amount)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching monthly trends'
        });
    }
};

module.exports = {
    addTransaction,
    getTransactions,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getSummary,
    getCategoryBreakdown,
    getDailyTrends,
    getMonthlyTrends
};