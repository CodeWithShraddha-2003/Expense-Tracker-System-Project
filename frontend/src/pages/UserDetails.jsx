import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './UserDetails.css';

const UserDetails = () => {
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [userStats, setUserStats] = useState({
        income: 0,
        expenses: 0,
        budget: 0,
        savings: 0,
        transactions: [],
        budgets: []
    });
    const [activeTab, setActiveTab] = useState('profile');
    const [error, setError] = useState(null);

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    // Check admin access and fetch users
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
            fetchUsers();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('👥 Fetching users...');
            const response = await api.get('/admin/users');
            console.log('👥 Users response:', response.data);
            
            if (response.data && response.data.success) {
                const userList = response.data.users || [];
                // Filter out admin users
                const filteredUsers = userList.filter(u => u.role !== 'admin');
                setUsers(filteredUsers);
                console.log('✅ Users fetched:', filteredUsers.length);
            } else {
                setError('Failed to fetch users');
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            console.log('👤 Fetching user details for ID:', userId);
            
            // Fetch user profile
            const userRes = await api.get(`/admin/users/${userId}`);
            console.log('👤 User profile:', userRes.data);
            
            if (userRes.data && userRes.data.success) {
                setSelectedUser(userRes.data.user);
            }

            // Fetch user transactions
            const transRes = await api.get(`/admin/users/${userId}/transactions`);
            console.log('💳 Transactions response:', transRes.data);
            
            let transactions = [];
            let totalIncome = 0;
            let totalExpenses = 0;
            
            if (transRes.data && transRes.data.success) {
                transactions = transRes.data.transactions || [];
                console.log('📊 Transactions count:', transactions.length);
                
                // Calculate income and expenses from database
                totalIncome = transactions
                    .filter(t => t.type === 'income' || t.type === 'Income')
                    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                
                totalExpenses = transactions
                    .filter(t => t.type === 'expense' || t.type === 'Expense')
                    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                
                console.log('💰 Total Income:', totalIncome);
                console.log('💸 Total Expenses:', totalExpenses);
            }

            // Fetch user budgets
            // Fetch user budgets
const budgetRes = await api.get(`/admin/users/${userId}/budgets`);
console.log('📊 Budgets response:', budgetRes.data);

let budgets = [];
let totalBudget = 0;

if (budgetRes.data && budgetRes.data.success) {
    budgets = budgetRes.data.budgets || [];
    console.log('📋 Raw budgets:', budgets);
    
    // Calculate total budget - handle both 'amount' and 'monthly_limit'
    totalBudget = budgets.reduce((sum, b) => {
        const amount = b.amount || b.monthly_limit || 0;
        return sum + parseFloat(amount);
    }, 0);
    
    console.log('💰 Total Budget:', totalBudget);
    console.log('📋 Budgets with spent:', budgets.map(b => ({
        category: b.category_name,
        amount: b.amount || b.monthly_limit,
        spent: b.spent
    })));
}

setUserStats(prev => ({
    ...prev,
    budgets: budgets,
    budget: totalBudget
})); // After fetching budgets
console.log('📊 Budgets response:', budgetRes.data);
console.log('📋 Budgets array:', budgets);
console.log('💰 Total budget calculated:', totalBudget);
console.log('📊 Spent amounts:', budgets.map(b => ({ 
    category: b.category_name, 
    spent: b.spent 
})));

            // Update state with real data
            setUserStats({
                income: totalIncome,
                expenses: totalExpenses,
                budget: totalBudget,
                savings: totalIncome - totalExpenses,
                transactions: transactions,
                budgets: budgets
            });

            setShowUserDetails(true);
            console.log('✅ User details loaded successfully');

        } catch (error) {
            console.error('❌ Error fetching user details:', error);
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

    const handleUserSelect = (e) => {
        setSelectedUserId(e.target.value);
        setShowUserDetails(false);
        setSelectedUser(null);
        setActiveTab('profile');
        setError(null);
    };

    const handleViewUser = () => {
        if (selectedUserId) {
            fetchUserDetails(selectedUserId);
        } else {
            alert('Please select a user first');
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(user => 
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Get budget progress percentage - FIXED
const getBudgetProgress = (budget) => {
    const spent = parseFloat(budget.spent) || 0;
    const amount = parseFloat(budget.amount) || parseFloat(budget.monthly_limit) || 0;
    
    // If amount is 0, return 0 to avoid division by zero
    if (amount === 0) return 0;
    
    // Calculate progress
    const progress = (spent / amount) * 100;
    return Math.min(progress, 100); // Cap at 100%
};

// Get budget status color - FIXED
const getBudgetStatusColor = (budget) => {
    const progress = getBudgetProgress(budget);
    if (progress >= 100) return '#e74c3c'; // Red - Over budget
    if (progress >= 80) return '#f39c12';  // Orange - Warning
    return '#2ecc71';                      // Green - Good
};

// Get remaining amount - NEW FUNCTION
const getRemainingAmount = (budget) => {
    const spent = parseFloat(budget.spent) || 0;
    const amount = parseFloat(budget.amount) || parseFloat(budget.monthly_limit) || 0;
    return amount - spent;
};

    // Show loading only when fetching data
    if (authLoading || (loading && users.length === 0)) {
        return (
            <div className={`admin-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="spinner"></div>
                <p>Loading user data...</p>
            </div>
        );
    }

    return (
        <div className={`user-details-container ${isDarkMode ? 'dark' : ''}`}>
            {/* Page Header */}
            <div className="page-header">
                <h2>👤 User Details</h2>
                <p>View and manage user finances, transactions, and budgets</p>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>⚠️ {error}</p>}
            </div>

            {/* User Selector with Search */}
            <div className="user-selector-section">
                
                <div className="user-select-wrapper">
                    <label htmlFor="userSelect">Select User:</label>
                    <select 
                        id="userSelect"
                        value={selectedUserId} 
                        onChange={handleUserSelect}
                        className="user-select"
                    >
                        <option value="">-- Select a user --</option>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name} ({u.email})
                                </option>
                            ))
                        ) : (
                            <option value="">No users found</option>
                        )}
                    </select>
                </div>
                <button 
                    className="view-user-btn"
                    onClick={handleViewUser}
                    disabled={!selectedUserId}
                >
                    🔍 View User
                </button>
                
            </div>

            {/* Show user details only when showUserDetails is true */}
            {showUserDetails && selectedUser ? (
                <>
                    {/* User Profile Card */}
                    <div className="user-profile-card">
                        <div className="user-avatar">
                            <span>{selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                        </div>
                        <div className="user-info">
                            <h2>{selectedUser.full_name}</h2>
                            <p className="user-email">{selectedUser.email}</p>
                            <div className="user-meta">
                                <span className={`role-badge ${selectedUser.role}`}>
                                    {selectedUser.role === 'admin' ? '👑 Admin' : '👤 User'}
                                </span>
                                <span className="user-joined">
                                    Joined: {formatDate(selectedUser.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards - Income, Expense, Budget, Savings */}
                    <div className="stats-grid">
                        <div className="stat-card income">
                            <div className="stat-icon">💰</div>
                            <div className="stat-content">
                                <span className="stat-label">Income</span>
                                <span className="stat-value">{formatCurrency(userStats.income)}</span>
                            </div>
                        </div>
                        <div className="stat-card expense">
                            <div className="stat-icon">💳</div>
                            <div className="stat-content">
                                <span className="stat-label">Expense</span>
                                <span className="stat-value">{formatCurrency(userStats.expenses)}</span>
                            </div>
                        </div>
                        <div className="stat-card budget">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <span className="stat-label">Budget</span>
                                <span className="stat-value">{formatCurrency(userStats.budget)}</span>
                            </div>
                        </div>
                        <div className="stat-card savings">
                            <div className="stat-icon">🏦</div>
                            <div className="stat-content">
                                <span className="stat-label">Savings</span>
                                <span className="stat-value">{formatCurrency(userStats.savings)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="user-tabs">
                        <button 
                            className={activeTab === 'profile' ? 'active' : ''}
                            onClick={() => setActiveTab('profile')}
                        >
                            👤 Profile
                        </button>
                        <button 
                            className={activeTab === 'transactions' ? 'active' : ''}
                            onClick={() => setActiveTab('transactions')}
                        >
                            💳 Transactions ({userStats.transactions.length})
                        </button>
                        <button 
                            className={activeTab === 'budgets' ? 'active' : ''}
                            onClick={() => setActiveTab('budgets')}
                        >
                            📊 Budgets ({userStats.budgets.length})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="user-tab-content">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="profile-tab">
                                <h3>👤 Profile Details</h3>
                                <div className="profile-details-grid">
                                    <div className="profile-detail-item">
                                        <label>Full Name</label>
                                        <span>{selectedUser.full_name}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Email Address</label>
                                        <span>{selectedUser.email}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Role</label>
                                        <span>
                                            <span className={`role-badge ${selectedUser.role}`}>
                                                {selectedUser.role === 'admin' ? '👑 Administrator' : '👤 Regular User'}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Member Since</label>
                                        <span>{formatDate(selectedUser.created_at)}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Total Income</label>
                                        <span className="income-text">{formatCurrency(userStats.income)}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Total Expenses</label>
                                        <span className="expense-text">{formatCurrency(userStats.expenses)}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Total Budget</label>
                                        <span className="budget-text">{formatCurrency(userStats.budget)}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Net Savings</label>
                                        <span className="savings-text">{formatCurrency(userStats.savings)}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Total Transactions</label>
                                        <span>{userStats.transactions.length}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <label>Budget Categories</label>
                                        <span>{userStats.budgets.length}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === 'transactions' && (
                            <div className="transactions-tab">
                                <div className="transactions-header">
                                    <h3>💰 Transaction History</h3>
                                    <div className="transaction-summary">
                                        <span>Total: {userStats.transactions.length} transactions</span>
                                    </div>
                                </div>
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Category</th>
                                                <th>Amount</th>
                                                <th>Type</th>
                                                <th>Description</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userStats.transactions.length > 0 ? (
                                                userStats.transactions.map((t) => (
                                                    <tr key={t.id}>
                                                        <td>#{t.id}</td>
                                                        <td>{t.category_name || 'Uncategorized'}</td>
                                                        <td className={t.type === 'income' || t.type === 'Income' ? 'income-text' : 'expense-text'}>
                                                            {formatCurrency(t.amount)}
                                                        </td>
                                                        <td>
                                                            <span className={`type-badge ${t.type}`}>
                                                                {t.type === 'income' || t.type === 'Income' ? '💰 Income' : '💳 Expense'}
                                                            </span>
                                                        </td>
                                                        <td>{t.description || '-'}</td>
                                                        <td>{formatDate(t.transaction_date)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="no-data">No transactions found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Budgets Tab */}
                        {/* Budgets Tab */}
{activeTab === 'budgets' && (
    <div className="budgets-tab">
        <div className="budgets-header">
            <h3>📊 Budget Overview</h3>
            <div className="budget-total">
                Total Budget: <strong>{formatCurrency(userStats.budget)}</strong>
            </div>
        </div>
        {userStats.budgets.length > 0 ? (
            <div className="budgets-grid">
                {userStats.budgets.map((budget) => {
                    const progress = getBudgetProgress(budget);
                    const statusColor = getBudgetStatusColor(budget);
                    const spent = parseFloat(budget.spent) || 0;
                    const amount = parseFloat(budget.amount) || parseFloat(budget.monthly_limit) || 0;
                    const remaining = amount - spent;
                    
                    return (
                        <div key={budget.id} className="budget-card-item">
                            <div className="budget-card-header">
                                <span className="budget-category">{budget.category_name || 'Uncategorized'}</span>
                                <span className="budget-amount">{formatCurrency(amount)}</span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="budget-progress-bar">
                                <div 
                                    className="budget-progress-fill"
                                    style={{
                                        width: `${Math.min(progress, 100)}%`,
                                        backgroundColor: statusColor
                                    }}
                                ></div>
                            </div>
                            
                            {/* Budget Stats */}
                            <div className="budget-card-footer">
                                <div className="budget-stat-item">
                                    <span className="budget-stat-label">Spent</span>
                                    <span className="budget-stat-value spent">{formatCurrency(spent)}</span>
                                </div>
                                <div className="budget-stat-item">
                                    <span className="budget-stat-label">Remaining</span>
                                    <span className={`budget-stat-value ${remaining >= 0 ? 'remaining-positive' : 'remaining-negative'}`}>
                                        {formatCurrency(remaining)}
                                    </span>
                                </div>
                                <div className="budget-stat-item">
                                    <span className="budget-stat-label">Used</span>
                                    <span className="budget-stat-value percentage">{Math.round(progress)}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="no-data">No budgets set for this user</div>
        )}
    </div>
)}
                    </div>
                </>
            ) : (
                <div className="no-user-selected">
                    <div className="no-user-icon">👤</div>
                    <h3>No User Selected</h3>
                    <p>Please select a user from the dropdown above and click "View User" to see their details.</p>
                </div>
            )}
        </div>
    );
};

export default UserDetails;