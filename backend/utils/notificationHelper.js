const { pool } = require('../config/database');

class NotificationHelper {
    // Create a notification for a user
    static async createNotification(userId, title, message, type = 'info', icon = '🔔') {
        try {
            const query = `
                INSERT INTO notifications (user_id, title, message, type, icon, is_read, created_at) 
                VALUES (?, ?, ?, ?, ?, 0, NOW())
            `;
            const [result] = await pool.execute(query, [userId, title, message, type, icon]);
            console.log(`✅ Notification created: ${title}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ Error creating notification:', error);
            return null;
        }
    }

    // Notify when expense is added
    static async notifyExpenseAdded(userId, expenseData) {
        const { amount, category_name, description } = expenseData;
        const title = '💳 New Expense Added';
        const message = `You added $${amount} for ${category_name || 'expense'}${description ? ': ' + description : ''}`;
        return await this.createNotification(userId, title, message, 'info', '💳');
    }

    // Notify when income is added
    static async notifyIncomeAdded(userId, incomeData) {
        const { amount, category_name, description } = incomeData;
        const title = '💰 New Income Added';
        const message = `You received $${amount} from ${category_name || 'income'}${description ? ': ' + description : ''}`;
        return await this.createNotification(userId, title, message, 'success', '💰');
    }

    // Check budget completion
    static async checkBudgetCompletion(userId, categoryId) {
        try {
            console.log('📊 Checking budget completion for user:', userId, 'category:', categoryId);
            return true;
        } catch (error) {
            console.error('Error checking budget completion:', error);
            return false;
        }
    }
}

module.exports = NotificationHelper;