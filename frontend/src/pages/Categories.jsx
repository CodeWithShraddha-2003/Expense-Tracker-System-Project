import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Categories.css';

const Categories = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('income');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getAll();
            if (response.data && response.data.success) {
                setCategories(response.data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredCategories = () => {
        return categories.filter(cat => cat.type === activeTab);
    };

    const incomeCount = categories.filter(c => c.type === 'income').length;
    const expenseCount = categories.filter(c => c.type === 'expense').length;

    if (loading) {
        return (
            <div className={`categories-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="spinner"></div>
                <p>Loading categories...</p>
            </div>
        );
    }

    return (
        <div className={`categories-page ${isDarkMode ? 'dark' : ''}`}>
            {/* Header */}
            <div className="categories-header">
                <div className="categories-header-content">
                    <div className="categories-header-icon">
                        <span>📂</span>
                    </div>
                    <div className="categories-header-text">
                        <h1>Categories</h1>
                        <p>View your transaction categories</p>
                    </div>
                </div>
                <div className="categories-header-stats">
                    <div className="header-stat">
                        <span className="stat-number">{incomeCount}</span>
                        <span className="stat-label">Income</span>
                    </div>
                    <div className="header-stat-divider"></div>
                    <div className="header-stat">
                        <span className="stat-number">{expenseCount}</span>
                        <span className="stat-label">Expenses</span>
                    </div>
                    <div className="header-stat-divider"></div>
                    <div className="header-stat">
                        <span className="stat-number">{categories.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="categories-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
                    onClick={() => setActiveTab('income')}
                >
                    💰 Income <span className="tab-count">{incomeCount}</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    💳 Expenses <span className="tab-count">{expenseCount}</span>
                </button>
            </div>

            {/* Categories Grid */}
            <div className="categories-grid">
                {getFilteredCategories().length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <p>No {activeTab} categories found</p>
                    </div>
                ) : (
                    getFilteredCategories().map((category) => (
                        <div key={category.id} className="category-card">
                            <div className="category-card-icon" style={{ background: category.color || '#e9ecef' }}>
                                {category.icon || '📌'}
                            </div>
                            <div className="category-card-info">
                                <div className="category-card-name">{category.name}</div>
                                <div className="category-card-type">
                                    <span className={`type-badge ${category.type}`}>
                                        {category.type === 'income' ? '💰 Income' : '💳 Expense'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Categories;