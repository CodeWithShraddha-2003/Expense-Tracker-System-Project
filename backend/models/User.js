const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
    const { full_name, email, password, role } = userData;
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const query = `
        INSERT INTO users (full_name, email, password_hash, role) 
        VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [full_name, email, password_hash, role || 'user']);
    return result.insertId;
}

    // Find user by email
    static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0];
}

    // Find user by ID
    static async findById(id) {
        const query = 'SELECT id, full_name, email, created_at FROM users WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    // Update user
    static async update(id, userData) {
        const { full_name, email } = userData;
        const query = 'UPDATE users SET full_name = ?, email = ? WHERE id = ?';
        const [result] = await pool.execute(query, [full_name, email, id]);
        return result.affectedRows > 0;
    }

    // Update password
    static async updatePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        
        const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
        const [result] = await pool.execute(query, [password_hash, id]);
        return result.affectedRows > 0;
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;