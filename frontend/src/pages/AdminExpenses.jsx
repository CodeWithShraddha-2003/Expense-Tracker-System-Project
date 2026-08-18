import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminExpenses.css';

const AdminExpenses = () => {
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [stats, setStats] = useState({
        totalExpenses: 0,
        totalAmount: 0,
        averageAmount: 0,
        totalUsers: 0
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
    }, [currentUser, isAuthenticated, authLoading, navigate, selectedUserId, dateFrom, dateTo]);

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

            // Fetch expenses based on filters
            let expenseData = [];
            
            if (selectedUserId) {
                // Get expenses for specific user
                const transRes = await api.get(`/admin/users/${selectedUserId}/transactions`);
                if (transRes.data && transRes.data.success) {
                    expenseData = transRes.data.transactions || [];
                }
            } else {
                // Get all expenses
                const transRes = await api.get('/admin/all-transactions');
                if (transRes.data && transRes.data.success) {
                    expenseData = transRes.data.transactions || [];
                }
            }

            // Filter only expenses
            let filtered = expenseData.filter(t => 
                t.type === 'expense' || t.type === 'Expense'
            );

            // Apply date filters
            if (dateFrom) {
                filtered = filtered.filter(t => t.transaction_date >= dateFrom);
            }
            if (dateTo) {
                filtered = filtered.filter(t => t.transaction_date <= dateTo);
            }

            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(t =>
                    (t.description || '').toLowerCase().includes(term) ||
                    (t.category_name || '').toLowerCase().includes(term) ||
                    (t.user_name || '').toLowerCase().includes(term)
                );
            }

            setExpenses(filtered);

            // Calculate stats
            const totalAmount = filtered.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            const uniqueUsers = new Set(filtered.map(t => t.user_id)).size;

            setStats({
                totalExpenses: filtered.length,
                totalAmount: totalAmount,
                averageAmount: filtered.length > 0 ? totalAmount / filtered.length : 0,
                totalUsers: uniqueUsers
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
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleReset = () => {
        setSelectedUserId('');
        setSearchTerm('');
        setDateFrom('');
        setDateTo('');
    };

    if (authLoading || loading) {
        return (
            <div className={`admin-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="spinner"></div>
                <p>Loading expenses...</p>
            </div>
        );
    }

    return (
        <div className={`admin-expenses ${isDarkMode ? 'dark' : ''}`}>
            <div className="expenses-container">
                {/* Header */}
                <div className="expenses-header">
                    <div>
                        <h1>💳 Expense Management</h1>
                        <p>View and manage all user expenses</p>
                    </div>
                    <div className="header-stats">
                        <span className="stat-badge">
                            Total: {formatCurrency(stats.totalAmount)}
                        </span>
                        <span className="stat-badge">
                            {stats.totalExpenses} transactions
                        </span>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

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
                            <span className="stat-value">{stats.totalExpenses}</span>
                            <span className="stat-label">Total Expenses</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
                            <span className="stat-label">Total Amount</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <span className="stat-value">{formatCurrency(stats.averageAmount)}</span>
                            <span className="stat-label">Average Amount</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalUsers}</span>
                            <span className="stat-label">Active Users</span>
                        </div>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="expenses-table-wrapper">
                    <table className="expenses-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>User</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Description</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length > 0 ? (
                                expenses.map((expense, index) => (
                                    <tr key={expense.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <span className="user-name">
                                                {expense.user_name || `User #${expense.user_id}`}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="category-badge">
                                                {expense.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="amount">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        <td>{expense.description || '-'}</td>
                                        <td>{formatDate(expense.transaction_date)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data">No expenses found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminExpenses;