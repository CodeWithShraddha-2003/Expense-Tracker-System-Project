const { pool } = require('../config/database');

class Budget {
    static async getAll(userId) {
        const query = `
            SELECT b.*, c.name as category_name, c.icon, c.color 
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = ?
            ORDER BY c.name
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }

    static async create(budgetData) {
        const { user_id, category_id, monthly_limit, month_year } = budgetData;
        const query = `
            INSERT INTO budgets (user_id, category_id, monthly_limit, month_year) 
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [user_id, category_id, monthly_limit, month_year]);
        return result.insertId;
    }

    static async update(id, userId, monthly_limit) {
        const query = 'UPDATE budgets SET monthly_limit = ? WHERE id = ? AND user_id = ?';
        const [result] = await pool.execute(query, [monthly_limit, id, userId]);
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const query = 'DELETE FROM budgets WHERE id = ? AND user_id = ?';
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }
}

module.exports = Budget;