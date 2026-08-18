const { pool } = require('../config/database');

class Transaction {
    // Create new transaction
    static async create(transactionData) {
        const { user_id, category_id, amount, type, description, transaction_date } = transactionData;
        
        const query = `
            INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [user_id, category_id, amount, type, description, transaction_date]);
        return result.insertId;
    }

    // Get all transactions for a user
    static async getAllByUser(userId, filters = {}) {
        let query = `
            SELECT t.*, c.name as category_name, c.icon, c.color 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
        `;
        const params = [userId];

        if (filters.type) {
            query += ` AND t.type = ?`;
            params.push(filters.type);
        }

        if (filters.category_id) {
            query += ` AND t.category_id = ?`;
            params.push(filters.category_id);
        }

        if (filters.start_date) {
            query += ` AND t.transaction_date >= ?`;
            params.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ` AND t.transaction_date <= ?`;
            params.push(filters.end_date);
        }

        query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // Get transaction by ID
    static async getById(id, userId) {
        const query = `
            SELECT t.*, c.name as category_name, c.icon, c.color 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = ? AND t.user_id = ?
        `;
        const [rows] = await pool.execute(query, [id, userId]);
        return rows[0];
    }

    // Update transaction
    static async update(id, userId, transactionData) {
        const { category_id, amount, type, description, transaction_date } = transactionData;
        
        const query = `
            UPDATE transactions 
            SET category_id = ?, amount = ?, type = ?, description = ?, transaction_date = ?
            WHERE id = ? AND user_id = ?
        `;
        
        const [result] = await pool.execute(query, [category_id, amount, type, description, transaction_date, id, userId]);
        return result.affectedRows > 0;
    }

    // Delete transaction
    static async delete(id, userId) {
        const query = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }

    // Get transaction summary (income, expense, balance)
    static async getSummary(userId, period = 'month') {
        let dateCondition = '';
        const params = [userId];

        if (period === 'daily') {
            dateCondition = `AND DATE(transaction_date) = CURDATE()`;
        } else if (period === 'weekly') {
            dateCondition = `AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        } else if (period === 'month') {
            dateCondition = `AND MONTH(transaction_date) = MONTH(CURDATE()) AND YEAR(transaction_date) = YEAR(CURDATE())`;
        } else if (period === 'year') {
            dateCondition = `AND YEAR(transaction_date) = YEAR(CURDATE())`;
        }

        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance,
                COUNT(*) as total_transactions
            FROM transactions
            WHERE user_id = ? ${dateCondition}
        `;

        const [rows] = await pool.execute(query, params);
        return rows[0];
    }

    // Get transactions by category
    static async getByCategory(userId, type = 'expense', period = 'month', month = null, year = null) {
    let dateCondition = '';
    const params = [userId, type];

    if (period === 'daily') {
        dateCondition = `AND DATE(t.transaction_date) = CURDATE()`;
    } else if (period === 'weekly') {
        dateCondition = `AND t.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    } else if (period === 'month') {
        if (month && year) {
            dateCondition = `AND MONTH(t.transaction_date) = ${parseInt(month)} AND YEAR(t.transaction_date) = ${parseInt(year)}`;
        } else {
            dateCondition = `AND MONTH(t.transaction_date) = MONTH(CURDATE()) AND YEAR(t.transaction_date) = YEAR(CURDATE())`;
        }
    }

    const query = `
        SELECT 
            c.id as category_id,
            c.name as category_name,
            c.icon,
            c.color,
            COALESCE(SUM(t.amount), 0) as total_amount,
            COUNT(t.id) as transaction_count
        FROM categories c
        LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = ? AND t.type = ?
        ${dateCondition}
        WHERE (c.user_id = ? OR c.user_id IS NULL) AND c.type = ?
        GROUP BY c.id, c.name, c.icon, c.color
        ORDER BY total_amount DESC
    `;

    const [rows] = await pool.execute(query, [userId, type, userId, type]);
    return rows;
}
    // Get daily trends
    static async getDailyTrends(userId, type = 'expense', days = 30) {
        const query = `
            SELECT 
                DATE(transaction_date) as date,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(*) as transaction_count
            FROM transactions
            WHERE user_id = ? 
                AND type = ?
                AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(transaction_date)
            ORDER BY date ASC
        `;

        const [rows] = await pool.execute(query, [userId, type, days]);
        return rows;
    }

    // Get monthly trends
    static async getMonthlyTrends(userId, type = 'expense', months = 12) {
        const query = `
            SELECT 
                DATE_FORMAT(transaction_date, '%b') as month,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(*) as transaction_count
            FROM transactions
            WHERE user_id = ? 
                AND type = ?
                AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(transaction_date, '%b')
            ORDER BY month ASC
        `;

        const [rows] = await pool.execute(query, [userId, type, months]);
        return rows;
    }
}

module.exports = Transaction;