import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminReport.css';

const AdminReport = () => {
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        totalUsers: 0,
        totalTransactions: 0,
        totalBudget: 0,
        savingsRate: 0
    });
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [transactions, setTransactions] = useState([]);
    const [userStats, setUserStats] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [filteredMonthlyData, setFilteredMonthlyData] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [error, setError] = useState(null);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
            fetchReportData();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate, selectedUserId, selectedMonth, selectedYear]);

    const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📊 Fetching admin report data...');

            // 1. Fetch Users
            const usersRes = await api.get('/admin/users');
            let userList = [];
            if (usersRes.data && usersRes.data.success) {
                userList = usersRes.data.users || [];
                const filteredUsers = userList.filter(u => u.role !== 'admin');
                setUsers(filteredUsers);
                setReportData(prev => ({ ...prev, totalUsers: filteredUsers.length }));
            }

            // 2. Fetch Stats
            const statsRes = await api.get('/admin/stats');
            if (statsRes.data && statsRes.data.success) {
                setReportData(prev => ({
                    ...prev,
                    totalIncome: statsRes.data.stats.totalIncome || 0,
                    totalExpenses: statsRes.data.stats.totalExpenses || 0,
                    totalTransactions: statsRes.data.stats.totalTransactions || 0,
                    totalBudget: statsRes.data.stats.totalBudget || 0
                }));
            }

            // 3. Fetch All Transactions
            const transRes = await api.get('/admin/all-transactions');
            let allTransactions = [];
            if (transRes.data && transRes.data.success) {
                allTransactions = transRes.data.transactions || [];
            }

            // 4. Filter by Month and Year
            const monthFiltered = allTransactions.filter(t => {
                if (!t.transaction_date) return false;
                const date = new Date(t.transaction_date);
                return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
            });

            // 5. Filter by User if selected
            let finalTransactions = monthFiltered;
            if (selectedUserId) {
                finalTransactions = monthFiltered.filter(t => t.user_id === parseInt(selectedUserId));
            }
            setTransactions(finalTransactions);
            setFilteredTransactions(finalTransactions.slice(0, 15));

            // 6. User Statistics for selected month
            const userStatsMap = {};
            finalTransactions.forEach(t => {
                const userId = t.user_id;
                if (!userStatsMap[userId]) {
                    userStatsMap[userId] = {
                        user_id: userId,
                        user_name: t.user_name || `User #${userId}`,
                        total_income: 0,
                        total_expenses: 0,
                        count: 0
                    };
                }
                const amount = parseFloat(t.amount) || 0;
                if (t.type === 'income' || t.type === 'Income') {
                    userStatsMap[userId].total_income += amount;
                } else {
                    userStatsMap[userId].total_expenses += amount;
                }
                userStatsMap[userId].count += 1;
            });
            const statsArray = Object.values(userStatsMap);
            statsArray.sort((a, b) => b.total_income - a.total_income);
            setUserStats(statsArray);

            // 7. Monthly Trends - All Months
            const monthMap = {};
            shortMonthNames.forEach(m => {
                monthMap[m] = { income: 0, expenses: 0 };
            });

            allTransactions.forEach(t => {
                if (!t.transaction_date) return;
                const date = new Date(t.transaction_date);
                const monthName = shortMonthNames[date.getMonth()];
                const amount = parseFloat(t.amount) || 0;
                if (t.type === 'income' || t.type === 'Income') {
                    monthMap[monthName].income += amount;
                } else {
                    monthMap[monthName].expenses += amount;
                }
            });

            const monthlyDataArray = shortMonthNames.map(monthName => ({
                month: monthName,
                income: monthMap[monthName].income,
                expenses: monthMap[monthName].expenses
            }));
            setMonthlyData(monthlyDataArray);

            // 8. Filter by Selected Month
            const filtered = monthlyDataArray.filter(item => {
                const monthIndex = shortMonthNames.indexOf(item.month);
                return monthIndex + 1 === selectedMonth;
            });
            setFilteredMonthlyData(filtered);

            // Calculate savings rate
            const totalIncome = reportData.totalIncome;
            const totalExpenses = reportData.totalExpenses;
            const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
            setReportData(prev => ({ ...prev, savingsRate }));

        } catch (error) {
            console.error('❌ Error fetching report data:', error);
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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const downloadCSV = () => {
        // User Stats CSV
        const userHeaders = ['User', 'Income', 'Expenses', 'Net', 'Transactions'];
        const userRows = userStats.map(item => [
            item.user_name,
            item.total_income,
            item.total_expenses,
            item.total_income - item.total_expenses,
            item.count
        ]);

        const userCSV = [
            ['=== USER STATISTICS ==='],
            userHeaders.join(','),
            ...userRows.map(row => row.join(',')),
            [],
            ['=== TRANSACTIONS ==='],
            ['Date', 'User', 'Category', 'Description', 'Amount', 'Type'],
            ...transactions.map(t => [
                formatDate(t.transaction_date),
                t.user_name || `User #${t.user_id}`,
                t.category_name || 'Uncategorized',
                t.description || '-',
                t.amount,
                t.type
            ].join(','))
        ].join('\n');

        const blob = new Blob([userCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_report_${selectedMonth}_${selectedYear}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate totals for summary
    const totalIncome = userStats.reduce((sum, item) => sum + item.total_income, 0);
    const totalExpenses = userStats.reduce((sum, item) => sum + item.total_expenses, 0);
    const totalTransactions = userStats.reduce((sum, item) => sum + item.count, 0);
    const totalUsers = userStats.length;

    if (authLoading || loading) {
        return (
            <div className={`admin-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="spinner"></div>
                <p>Loading report...</p>
            </div>
        );
    }

    return (
        <div className={`admin-report ${isDarkMode ? 'dark' : ''}`}>
            <div className="report-container">
                {/* Header */}
                <div className="report-header">
                    <div>
                        <h1>📊 User Report</h1>
                        <p>User wise income and expenses for {monthNames[selectedMonth - 1]} {selectedYear}</p>
                    </div>
                   
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Filters */}
                <div className="report-filters">
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
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Month:</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="filter-select"
                        >
                            {monthNames.map((month, index) => (
                                <option key={index} value={index + 1}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="filter-select"
                        >
                            {[2026, 2025, 2024, 2023].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <button className="refresh-btn" onClick={fetchReportData}>
                        🔄 Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="report-summary">
                    <div className="summary-card">
                        <div className="summary-icon" style={{ background: '#2ecc71' }}>👥</div>
                        <div className="summary-info">
                            <span className="summary-label">Total Users</span>
                            <span className="summary-value">{totalUsers}</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon" style={{ background: '#2ecc71' }}>💰</div>
                        <div className="summary-info">
                            <span className="summary-label">Total Income</span>
                            <span className="summary-value">{formatCurrency(totalIncome)}</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon" style={{ background: '#e74c3c' }}>💳</div>
                        <div className="summary-info">
                            <span className="summary-label">Total Expenses</span>
                            <span className="summary-value">{formatCurrency(totalExpenses)}</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon" style={{ background: '#3498db' }}>📊</div>
                        <div className="summary-info">
                            <span className="summary-label">Net Balance</span>
                            <span className="summary-value">{formatCurrency(totalIncome - totalExpenses)}</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon" style={{ background: '#f39c12' }}>📈</div>
                        <div className="summary-info">
                            <span className="summary-label">Avg Income/User</span>
                            <span className="summary-value">{totalUsers > 0 ? formatCurrency(totalIncome / totalUsers) : formatCurrency(0)}</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon" style={{ background: '#9b59b6' }}>📋</div>
                        <div className="summary-info">
                            <span className="summary-label">Transactions</span>
                            <span className="summary-value">{totalTransactions}</span>
                        </div>
                    </div>
                </div>

                {/* User Statistics Table */}
                <div className="chart-card full-width">
                    <h3>📊 User Statistics - {monthNames[selectedMonth - 1]} {selectedYear}</h3>
                    <div className="chart-container">
                        <table className="mini-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>User</th>
                                    <th>Income</th>
                                    <th>Expenses</th>
                                    <th>Net</th>
                                    <th>Transactions</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userStats.length > 0 ? (
                                    userStats.map((item, index) => {
                                        const net = item.total_income - item.total_expenses;
                                        const status = net > 0 ? '✅ Profit' : net < 0 ? '❌ Loss' : '⚖️ Break Even';
                                        const statusColor = net > 0 ? '#2ecc71' : net < 0 ? '#e74c3c' : '#f39c12';
                                        
                                        return (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td><strong>{item.user_name}</strong></td>
                                                <td className="income-text">{formatCurrency(item.total_income)}</td>
                                                <td className="expense-text">{formatCurrency(item.total_expenses)}</td>
                                                <td className={net >= 0 ? 'income-text' : 'expense-text'}>
                                                    {formatCurrency(net)}
                                                </td>
                                                <td>{item.count}</td>
                                                <td>
                                                    <span style={{ color: statusColor, fontWeight: 'bold' }}>
                                                        {status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="no-data">No data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="chart-card full-width">
                    <h3>📋 Recent Transactions - {monthNames[selectedMonth - 1]} {selectedYear}</h3>
                    <div className="chart-container">
                        <table className="mini-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t) => (
                                        <tr key={t.id}>
                                            <td>{formatDate(t.transaction_date)}</td>
                                            <td>{t.user_name || `User #${t.user_id}`}</td>
                                            <td>{t.category_name || 'Uncategorized'}</td>
                                            <td>{t.description || '-'}</td>
                                            <td className={t.type === 'income' ? 'income-text' : 'expense-text'}>
                                                {formatCurrency(t.amount)}
                                            </td>
                                            <td>
                                                <span className={`type-badge ${t.type}`}>
                                                    {t.type === 'income' ? '💰 Income' : '💳 Expense'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">No transactions</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReport;