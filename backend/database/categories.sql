-- Expense Tracker System - Categories table
-- Run this only if your database does not already contain the categories table.

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categories_type (type),
    UNIQUE KEY uq_category_name_type (name, type)
);
