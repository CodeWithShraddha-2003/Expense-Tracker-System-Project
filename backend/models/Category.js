const { pool } = require('../config/database');

class Category {
    // Get all categories (default + user-specific)
    static async getAll(userId) {
        const query = `
            SELECT * FROM categories 
            WHERE user_id = ? OR user_id IS NULL
            ORDER BY type, name
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }

    // Get categories by type
    static async getByType(userId, type) {
        const query = `
            SELECT * FROM categories 
            WHERE (user_id = ? OR user_id IS NULL) AND type = ?
            ORDER BY name
        `;
        const [rows] = await pool.execute(query, [userId, type]);
        return rows;
    }

    // Create custom category
    static async create(userId, categoryData) {
        const { name, type, icon, color } = categoryData;
        const query = `
            INSERT INTO categories (user_id, name, type, icon, color) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [userId, name, type, icon, color]);
        return result.insertId;
    }

    // Update category
    static async update(id, userId, categoryData) {
        const { name, icon, color } = categoryData;
        const query = `
            UPDATE categories 
            SET name = ?, icon = ?, color = ?
            WHERE id = ? AND user_id = ?
        `;
        const [result] = await pool.execute(query, [name, icon, color, id, userId]);
        return result.affectedRows > 0;
    }

    // Delete category
    static async delete(id, userId) {
        const query = 'DELETE FROM categories WHERE id = ? AND user_id = ?';
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }

    // Get category by ID
    static async getById(id, userId) {
        const query = 'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)';
        const [rows] = await pool.execute(query, [id, userId]);
        return rows[0];
    }
}

module.exports = Category;