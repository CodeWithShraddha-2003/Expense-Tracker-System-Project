import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminIncome.css';

const AdminIncome = () => {
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [incomes, setIncomes] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [stats, setStats] = useState({
        totalIncome: 0,
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

            // Fetch incomes based on filters
            let incomeData = [];
            
            if (selectedUserId) {
                // Get incomes for specific user
                const transRes = await api.get(`/admin/users/${selectedUserId}/transactions`);
                if (transRes.data && transRes.data.success) {
                    incomeData = transRes.data.transactions || [];
                }
            } else {
                // Get all incomes
                const transRes = await api.get('/admin/all-transactions');
                if (transRes.data && transRes.data.success) {
                    incomeData = transRes.data.transactions || [];
                }
            }

            // Filter only incomes
            let filtered = incomeData.filter(t => 
                t.type === 'income' || t.type === 'Income'
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

            setIncomes(filtered);

            // Calculate stats
            const totalAmount = filtered.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            const uniqueUsers = new Set(filtered.map(t => t.user_id)).size;

            setStats({
                totalIncome: filtered.length,
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
                <p>Loading incomes...</p>
            </div>
        );
    }

    return (
        <div className={`admin-income ${isDarkMode ? 'dark' : ''}`}>
            <div className="income-container">
                {/* Header */}
                <div className="income-header">
                    <div>
                        <h1>💰 Income Management</h1>
                        <p>View and manage all user incomes</p>
                    </div>
                    <div className="header-stats">
                        <span className="stat-badge">
                            Total: {formatCurrency(stats.totalAmount)}
                        </span>
                        <span className="stat-badge">
                            {stats.totalIncome} transactions
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
                            <span className="stat-value">{stats.totalIncome}</span>
                            <span className="stat-label">Total Income</span>
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

                {/* Income Table */}
                <div className="income-table-wrapper">
                    <table className="income-table">
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
                            {incomes.length > 0 ? (
                                incomes.map((income, index) => (
                                    <tr key={income.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <span className="user-name">
                                                {income.user_name || `User #${income.user_id}`}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="category-badge income-badge">
                                                {income.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="amount income-amount">
                                            {formatCurrency(income.amount)}
                                        </td>
                                        <td>{income.description || '-'}</td>
                                        <td>{formatDate(income.transaction_date)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data">No incomes found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminIncome;