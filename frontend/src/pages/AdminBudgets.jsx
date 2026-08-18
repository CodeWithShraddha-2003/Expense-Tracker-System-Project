import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminBudgets.css';

const AdminBudgets = () => {
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [budgets, setBudgets] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [stats, setStats] = useState({
        totalBudgets: 0,
        totalAmount: 0,
        totalSpent: 0,
        totalUsers: 0,
        averageBudget: 0
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }
            if (!currentUser || currentUser.role !== 'admin') {
                navigate('/dashboard');
                return;
            }
            fetchData();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate, selectedUserId, monthFilter]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all users (excluding admin)
            const usersRes = await api.get('/admin/users');
            if (usersRes.data && usersRes.data.success) {
                const userList = usersRes.data.users || [];
                const filteredUsers = userList.filter(u => u.role !== 'admin');
                setUsers(filteredUsers);
            }

            // Fetch budgets based on filters
            let budgetData = [];
            
            if (selectedUserId) {
                const budgetRes = await api.get(`/admin/users/${selectedUserId}/budgets`);
                if (budgetRes.data && budgetRes.data.success) {
                    budgetData = budgetRes.data.budgets || [];
                }
            } else {
                const budgetRes = await api.get('/admin/all-budgets');
                if (budgetRes.data && budgetRes.data.success) {
                    budgetData = budgetRes.data.budgets || [];
                }
            }

            // Apply month filter
            if (monthFilter) {
                budgetData = budgetData.filter(b => {
                    if (!b.month_year) return false;
                    return b.month_year.startsWith(monthFilter);
                });
            }

            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                budgetData = budgetData.filter(b =>
                    (b.category_name || '').toLowerCase().includes(term) ||
                    (b.user_name || '').toLowerCase().includes(term)
                );
            }

            // Process budgets - FIX: Handle both 'amount' and 'monthly_limit'
            const processedBudgets = budgetData.map(budget => {
                // ✅ Use either 'amount' or 'monthly_limit' column
                const budgetAmount = budget.amount || budget.monthly_limit || 0;
                
                return {
                    ...budget,
                    amount: budgetAmount,
                    spent: parseFloat(budget.spent) || 0
                };
            });

            setBudgets(processedBudgets);

            // Calculate stats
            const totalAmount = processedBudgets.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
            const totalSpent = processedBudgets.reduce((sum, b) => sum + (parseFloat(b.spent) || 0), 0);
            const uniqueUsers = new Set(processedBudgets.map(b => b.user_id)).size;

            setStats({
                totalBudgets: processedBudgets.length,
                totalAmount: totalAmount,
                totalSpent: totalSpent,
                totalUsers: uniqueUsers,
                averageBudget: processedBudgets.length > 0 ? totalAmount / processedBudgets.length : 0
            });

            console.log('📊 Processed Budgets:', processedBudgets);
            console.log('📊 Stats:', {
                totalBudgets: processedBudgets.length,
                totalAmount: totalAmount,
                totalSpent: totalSpent
            });

        } catch (error) {
            console.error('❌ Error fetching data:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const getProgressColor = (spent, amount) => {
        const percentage = amount > 0 ? (spent / amount) * 100 : 0;
        if (percentage >= 100) return '#e74c3c';
        if (percentage >= 80) return '#f39c12';
        if (percentage >= 50) return '#3498db';
        return '#2ecc71';
    };

    const getStatusText = (spent, amount) => {
        const percentage = amount > 0 ? (spent / amount) * 100 : 0;
        if (percentage >= 100) return 'Over Budget 🔴';
        if (percentage >= 80) return 'Almost Full ⚠️';
        if (percentage >= 50) return 'In Progress 📊';
        return 'On Track 🟢';
    };

    const handleReset = () => {
        setSelectedUserId('');
        setSearchTerm('');
        setMonthFilter('');
    };

    if (authLoading || loading) {
        return (
            <div className={`admin-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="spinner"></div>
                <p>Loading budgets...</p>
            </div>
        );
    }

    return (
        <div className={`admin-budgets ${isDarkMode ? 'dark' : ''}`}>
            <div className="budgets-container">
                {/* Header */}
                <div className="budgets-header">
                    <div>
                        <h1>📊 Budget Management</h1>
                        <p>View and manage all user budgets</p>
                    </div>
                    <div className="header-stats">
                        <span className="stat-badge">
                            Total: {formatCurrency(stats.totalAmount)}
                        </span>
                        <span className="stat-badge">
                            {stats.totalBudgets} budgets
                        </span>
                    </div>
                </div>

               

                {/* Filters */}
                <div className="filters-section">
                    <div className="filter-group">
                        <label>User:</label>
                        <select 
                            value={selectedUserId} 
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Users</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

               

                    <div className="filter-actions">
                        <button className="refresh-btn" onClick={fetchData}>
                            🔄 Apply
                        </button>
                        <button className="reset-btn" onClick={handleReset}>
                            ✕ Reset
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalBudgets}</span>
                            <span className="stat-label">Total Budgets</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
                            <span className="stat-label">Total Budget</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💳</div>
                        <div className="stat-info">
                            <span className="stat-value">{formatCurrency(stats.totalSpent)}</span>
                            <span className="stat-label">Total Spent</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <span className="stat-value">{formatCurrency(stats.averageBudget)}</span>
                            <span className="stat-label">Average Budget</span>
                        </div>
                    </div>
                </div>

                {/* Budgets Table */}
                <div className="budgets-table-wrapper">
                    <table className="budgets-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>User</th>
                                <th>Category</th>
                                <th>Budget</th>
                                <th>Spent</th>
                                <th>Remaining</th>
                                <th>Usage</th>
                                <th>Status</th>
                                <th>Month</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgets.length > 0 ? (
                                budgets.map((budget, index) => {
                                    const spent = parseFloat(budget.spent) || 0;
                                    const amount = parseFloat(budget.amount) || 0;
                                    const remaining = amount - spent;
                                    const percentage = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
                                    const progressColor = getProgressColor(spent, amount);
                                    const statusText = getStatusText(spent, amount);
                                    
                                    return (
                                        <tr key={budget.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <span className="user-name">
                                                    {budget.user_name || `User #${budget.user_id}`}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="category-badge">
                                                    {budget.category_name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="budget-amount">
                                                {formatCurrency(amount)}
                                            </td>
                                            <td className="spent-amount">
                                                {formatCurrency(spent)}
                                            </td>
                                            <td className={remaining >= 0 ? 'remaining-positive' : 'remaining-negative'}>
                                                {formatCurrency(remaining)}
                                            </td>
                                            <td>
                                                <div className="progress-wrapper">
                                                    <div className="progress-bar">
                                                        <div 
                                                            className="progress-fill"
                                                            style={{ 
                                                                width: `${Math.min(percentage, 100)}%`,
                                                                backgroundColor: progressColor
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-text">{Math.round(percentage)}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${percentage >= 100 ? 'status-danger' : percentage >= 80 ? 'status-warning' : 'status-success'}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td>
                                                {budget.month_year ? 
                                                    new Date(budget.month_year).toLocaleString('default', { 
                                                        month: 'short', 
                                                        year: 'numeric' 
                                                    }) : '-'
                                                }
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="9" className="no-data">No budgets found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminBudgets;