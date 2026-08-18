import React, { useState, useEffect } from 'react';
import { transactionService, categoryService } from '../services/api';
import { budgetService } from '../services/api';
import './Budgets.css';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [formData, setFormData] = useState({
        category_id: '',
        monthly_limit: '',
        month_year: new Date().toISOString().slice(0, 7)
    });

    useEffect(() => {
        fetchBudgetData();
    }, []);

    const fetchBudgetData = async () => {
        setLoading(true);
        try {
            // Get categories
            const catRes = await categoryService.getByType('expense');
            if (catRes.data.success) {
                setCategories(catRes.data.categories);
            }

            // Get transactions for spending calculation
            const transRes = await transactionService.getAll({ type: 'expense' });
            if (transRes.data.success) {
                setTransactions(transRes.data.transactions);
            }

            // Get budgets from database
            const budgetRes = await budgetService.getAll();
            if (budgetRes.data.success) {
                // Combine budget data with spending
                const budgetData = budgetRes.data.budgets.map(budget => {
                    const totalSpent = transRes.data.transactions
                        .filter(t => t.category_id === budget.category_id)
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    const usedPercentage = budget.monthly_limit > 0 ? (totalSpent / budget.monthly_limit) * 100 : 0;
                    
                    return {
                        ...budget,
                        spent: totalSpent,
                        usedPercentage: Math.min(usedPercentage, 100),
                        left: budget.monthly_limit - totalSpent
                    };
                });
                setBudgets(budgetData);
            }
        } catch (error) {
            console.error('Error fetching budget data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getProgressColor = (percentage) => {
        if (percentage < 50) return '#28a745';
        if (percentage < 75) return '#ffc107';
        if (percentage < 90) return '#fd7e14';
        return '#dc3545';
    };

    const getScore = (percentage) => {
        if (percentage < 50) return '🟢 Good';
        if (percentage < 75) return '🟡 Moderate';
        if (percentage < 90) return '🟠 High';
        return '🔴 Critical';
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        try {
            const response = await budgetService.create({
                category_id: parseInt(formData.category_id),
                monthly_limit: parseFloat(formData.monthly_limit),
                month_year: formData.month_year + '-01'
            });
            
            if (response.data.success) {
                setShowAddForm(false);
                setFormData({ category_id: '', monthly_limit: '', month_year: new Date().toISOString().slice(0, 7) });
                fetchBudgetData(); // Refresh data
            }
        } catch (error) {
            console.error('Error adding budget:', error);
            alert('Failed to add budget: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const handleEditBudget = (budget) => {
        setEditingBudget(budget);
        setFormData({
            category_id: budget.category_id,
            monthly_limit: budget.monthly_limit,
            month_year: budget.month_year.slice(0, 7)
        });
        setShowEditForm(true);
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        try {
            const response = await budgetService.update(editingBudget.id, {
                monthly_limit: parseFloat(formData.monthly_limit)
            });
            
            if (response.data.success) {
                setShowEditForm(false);
                setEditingBudget(null);
                setFormData({ category_id: '', monthly_limit: '', month_year: new Date().toISOString().slice(0, 7) });
                fetchBudgetData(); // Refresh data
            }
        } catch (error) {
            console.error('Error updating budget:', error);
            alert('Failed to update budget: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        if (window.confirm('Are you sure you want to remove this budget?')) {
            try {
                const response = await budgetService.delete(budgetId);
                if (response.data.success) {
                    fetchBudgetData(); // Refresh data
                }
            } catch (error) {
                console.error('Error deleting budget:', error);
                alert('Failed to delete budget: ' + (error.response?.data?.message || 'Server error'));
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading budgets...</div>;
    }

    return (
        <div className="budgets-page">
            {/* Header */}
            <div className="budgets-header">
                <div className="budgets-header-content">
                    <div className="budgets-header-icon">
                        <span>💰</span>
                    </div>
                    <div className="budgets-header-text">
                        <h1>Budgets</h1>
                        <p>Set spending limits per category — AI scores each one automatically</p>
                    </div>
                </div>
            </div>

            {/* Budget Cards */}
            <div className="budgets-grid">
                {budgets.map((budget) => (
                    <div key={budget.id} className="budget-card">
                        <div className="budget-card-header">
                            <div className="budget-card-icon" style={{ background: budget.color || '#e9ecef' }}>
                                {budget.icon || '📌'}
                            </div>
                            <div className="budget-card-title">
                                <h3>{budget.category_name}</h3>
                                <span className={`budget-score ${budget.usedPercentage >= 90 ? 'critical' : budget.usedPercentage >= 75 ? 'high' : budget.usedPercentage >= 50 ? 'moderate' : 'good'}`}>
                                    {getScore(budget.usedPercentage)}
                                </span>
                            </div>
                            <div className="budget-card-actions">
                                <button className="edit-btn" onClick={() => handleEditBudget(budget)}>✏️</button>
                                <button className="delete-btn" onClick={() => handleDeleteBudget(budget.id)}>🗑️</button>
                            </div>
                        </div>

                        <div className="budget-card-amount">
                            <span className="amount-spent">{formatCurrency(budget.spent)}</span>
                            <span className="amount-label">Monthly - {Math.round(budget.usedPercentage)}% Used</span>
                        </div>

                        <div className="budget-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${Math.min(budget.usedPercentage, 100)}%`,
                                        background: getProgressColor(budget.usedPercentage)
                                    }}
                                />
                            </div>
                            <div className="progress-labels">
                                <span>of {formatCurrency(budget.monthly_limit)}</span>
                                <span className="progress-left">{formatCurrency(Math.max(budget.left, 0))} left</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Budget Card */}
                <div className="budget-card add-card" onClick={() => setShowAddForm(true)}>
                    <div className="add-card-content">
                        <span className="add-card-icon">🧠</span>
                        <p className="add-card-title">Analyzing</p>
                        <p className="add-card-sub">Add Budget</p>
                    </div>
                </div>
            </div>

            {/* Add Budget Modal */}
            {showAddForm && (
                <div className="budget-form-modal">
                    <div className="budget-form-content">
                        <div className="form-header">
                            <h3>📊 Add Budget</h3>
                            <button className="form-close-btn" onClick={() => setShowAddForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddBudget}>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.filter(c => 
                                        c.type === 'expense' && 
                                        !budgets.find(b => b.category_id === c.id)
                                    ).map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Monthly Limit</label>
                                <input
                                    type="number"
                                    value={formData.monthly_limit}
                                    onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                                    placeholder="Enter limit amount"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="save-btn">+ Add Budget</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Budget Modal */}
            {showEditForm && editingBudget && (
                <div className="budget-form-modal">
                    <div className="budget-form-content">
                        <div className="form-header">
                            <h3>✏️ Edit Budget</h3>
                            <button className="form-close-btn" onClick={() => { setShowEditForm(false); setEditingBudget(null); }}>×</button>
                        </div>
                        <form onSubmit={handleUpdateBudget}>
                            <div className="form-group">
                                <label>Category</label>
                                <input type="text" value={editingBudget.category_name} disabled style={{ background: '#f5f5f5' }} />
                            </div>
                            <div className="form-group">
                                <label>Current Spending</label>
                                <input type="text" value={formatCurrency(editingBudget.spent)} disabled style={{ background: '#f5f5f5' }} />
                            </div>
                            <div className="form-group">
                                <label>Monthly Limit</label>
                                <input
                                    type="number"
                                    value={formData.monthly_limit}
                                    onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                                    placeholder="Enter new limit"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => { setShowEditForm(false); setEditingBudget(null); }}>Cancel</button>
                                <button type="submit" className="save-btn">💾 Update Budget</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budgets;