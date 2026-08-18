import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import TransactionForm from '../components/Shared/TransactionForm';
import MonthlyWaveChart from '../components/Charts/MonthlyWaveChart';
import './Dashboard.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [summary, setSummary] = useState({
        total_income: 0,
        total_expenses: 0,
        balance: 0,
        savings_rate: 0,
        total_transactions: 0
    });

    const [lastMonthSummary, setLastMonthSummary] = useState({
        total_income: 0,
        total_expenses: 0,
        balance: 0
    });

    const [recentTransactions, setRecentTransactions] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyTrends, setMonthlyTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('year');
    const [expensePeriod, setExpensePeriod] = useState('month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [waveMonth, setWaveMonth] = useState(0);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [transactionType, setTransactionType] = useState('expense');

    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8A5C', '#A29BFE', '#FD79A8', '#00B894'];

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                return;
            }
            fetchDashboardData();
            fetchLastMonthData();
            fetchMonthlyTrends(waveMonth);
        }
    }, [period, expensePeriod, selectedMonth, selectedYear, waveMonth, authLoading, isAuthenticated]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            console.log('📊 Fetching dashboard data...');
            console.log('👤 User ID:', user?.id);
            console.log('📊 Period:', period);

            // 1. Fetch Summary
            const summaryRes = await transactionService.getSummary(period);
            if (summaryRes.data && summaryRes.data.success) {
                setSummary(summaryRes.data.summary);
                console.log('✅ Summary loaded:', summaryRes.data.summary);
            }

            // 2. Fetch Recent Transactions
            const transactionsRes = await transactionService.getAll({ limit: 10 });
            if (transactionsRes.data && transactionsRes.data.success) {
                setRecentTransactions(transactionsRes.data.transactions || []);
                console.log('✅ Transactions loaded:', transactionsRes.data.transactions?.length);
            }

            // 3. Fetch Category Breakdown
            const categoryRes = await transactionService.getCategoryBreakdown('expense', expensePeriod, selectedMonth, selectedYear);
            if (categoryRes.data && categoryRes.data.success) {
                setCategoryData(categoryRes.data.categories || []);
                console.log('✅ Categories loaded:', categoryRes.data.categories?.length);
            }

        } catch (error) {
            console.error('❌ Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLastMonthData = async () => {
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const month = lastMonth.getMonth() + 1;
            const year = lastMonth.getFullYear();

            const response = await transactionService.getAll({ limit: 1000 });
            if (response.data && response.data.success) {
                const transactions = response.data.transactions || [];
                
                const lastMonthTransactions = transactions.filter(t => {
                    if (!t.transaction_date) return false;
                    const date = new Date(t.transaction_date);
                    return date.getMonth() + 1 === month && date.getFullYear() === year;
                });

                const totalIncome = lastMonthTransactions
                    .filter(t => t.type === 'income' || t.type === 'Income')
                    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                
                const totalExpenses = lastMonthTransactions
                    .filter(t => t.type === 'expense' || t.type === 'Expense')
                    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

                setLastMonthSummary({
                    total_income: totalIncome,
                    total_expenses: totalExpenses,
                    balance: totalIncome - totalExpenses
                });
                console.log('✅ Last month summary:', { totalIncome, totalExpenses });
            }
        } catch (error) {
            console.error('❌ Error fetching last month:', error);
        }
    };

    const fetchMonthlyTrends = async (month = 0) => {
        try {
            const response = await transactionService.getAll({ limit: 1000 });
            if (response.data && response.data.success) {
                const allTransactions = response.data.transactions || [];
                const currentYear = new Date().getFullYear();
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthlyData = {};
                
                monthNames.forEach(m => {
                    monthlyData[m] = { income: 0, expenses: 0 };
                });

                allTransactions.forEach(t => {
                    if (!t.transaction_date) return;
                    const date = new Date(t.transaction_date);
                    if (date.getFullYear() !== currentYear) return;
                    
                    const monthName = monthNames[date.getMonth()];
                    const amount = parseFloat(t.amount) || 0;
                    
                    if (t.type === 'income' || t.type === 'Income') {
                        monthlyData[monthName].income += amount;
                    } else if (t.type === 'expense' || t.type === 'Expense') {
                        monthlyData[monthName].expenses += amount;
                    }
                });

                let fullData = monthNames.map(monthName => ({
                    month: monthName,
                    income: monthlyData[monthName].income,
                    expenses: monthlyData[monthName].expenses,
                    savings: monthlyData[monthName].income - monthlyData[monthName].expenses
                }));

                if (month > 0) {
                    const monthIndex = month - 1;
                    fullData = fullData.slice(0, monthIndex + 1);
                }

                setMonthlyTrends(fullData);
                console.log('✅ Monthly trends loaded:', fullData.length);
            }
        } catch (error) {
            console.error('❌ Error fetching monthly trends:', error);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '$0.00';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (authLoading || loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>📊 Dashboard</h1>
                    <p>Welcome back, {user?.full_name || 'User'}! Here's your financial overview</p>
                </div>
                <div className="header-right">
                    <div className="period-filter">
          
                        <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Monthly</button>
                        <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Yearly</button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="card-icon">💰</div>
                    <div className="card-info">
                        <span className="card-label">Total Balance</span>
                        <span className="card-value">{formatCurrency(summary.balance)}</span>
                        <span className="card-change positive">+0% from last month</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon">📈</div>
                    <div className="card-info">
                        <span className="card-label">Total Income</span>
                        <span className="card-value">{formatCurrency(summary.total_income)}</span>
                        <span className="card-change positive">+12.5% from last month</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon">💳</div>
                    <div className="card-info">
                        <span className="card-label">Total Expenses</span>
                        <span className="card-value">{formatCurrency(summary.total_expenses)}</span>
                        <span className="card-change neutral">0% from last month</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon">🏦</div>
                    <div className="card-info">
                        <span className="card-label">Savings Rate</span>
                        <span className="card-value">{summary.savings_rate || 0}%</span>
                        <span className="card-change warning">Needs improvement</span>
                    </div>
                </div>
            </div>

            {/* Quick Start Guide */}
            <div className="quick-start-guide">
                <h2>📊 Quick Start Guide</h2>
                <div className="cards-grid">
                    <div className="guide-card summary-card">
                        <div className="guide-card-content">
                            <div className="guide-stat-item">
                                <span className="guide-label">Balance:</span>
                                <span className="guide-value">{formatCurrency(summary.balance)}</span>
                            </div>
                            <div className="guide-stat-item">
                                <span className="guide-label">Credit cards:</span>
                                <span className="guide-value negative">-{formatCurrency(summary.total_expenses)}</span>
                            </div>
                            <div className="guide-stat-item total">
                                <span className="guide-label"></span>
                                <span className="guide-value">{formatCurrency(summary.balance)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="guide-card month-card">
                        <h3>📅 This month</h3>
                        <div className="guide-card-content">
                            <div className="month-row">
                                <div className="month-stats">
                                    <div className="guide-stat-item">
                                        <span className="guide-label">▲</span>
                                        <span className="guide-value positive">+{formatCurrency(summary.total_income)}</span>
                                    </div>
                                    <div className="guide-stat-item">
                                        <span className="guide-label">▼</span>
                                        <span className="guide-value negative">-{formatCurrency(summary.total_expenses)}</span>
                                    </div>
                                    <div className="guide-stat-item total">
                                        <span className="guide-label">Net:</span>
                                        <span className="guide-value">{formatCurrency(summary.balance)}</span>
                                    </div>
                                </div>
                                <div className="guide-pie">
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Income', value: summary.total_income || 1 },
                                                    { name: 'Expenses', value: summary.total_expenses || 1 }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={45}
                                                paddingAngle={3}
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ value }) => {
                                                    const total = summary.total_income + summary.total_expenses;
                                                    if (total === 0) return '';
                                                    const percentage = Math.round((value / total) * 100);
                                                    return `${percentage}%`;
                                                }}
                                                labelLine={false}
                                                label={{ fill: 'white', fontSize: 11, fontWeight: 'bold' }}
                                            >
                                                <Cell fill="#28a745" />
                                                <Cell fill="#dc3545" />
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="guide-card month-card">
                        <h3>📅 Last month</h3>
                        <div className="guide-card-content">
                            <div className="month-row">
                                <div className="month-stats">
                                    <div className="guide-stat-item">
                                        <span className="guide-label">▲</span>
                                        <span className="guide-value positive">+{formatCurrency(lastMonthSummary.total_income)}</span>
                                    </div>
                                    <div className="guide-stat-item">
                                        <span className="guide-label">▼</span>
                                        <span className="guide-value negative">-{formatCurrency(lastMonthSummary.total_expenses)}</span>
                                    </div>
                                    <div className="guide-stat-item total">
                                        <span className="guide-label">Net:</span>
                                        <span className="guide-value">{formatCurrency(lastMonthSummary.balance)}</span>
                                    </div>
                                </div>
                                <div className="guide-pie">
                                    <ResponsiveContainer width="100%" height={100}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Income', value: lastMonthSummary.total_income || 1 },
                                                    { name: 'Expenses', value: lastMonthSummary.total_expenses || 1 }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={45}
                                                paddingAngle={3}
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ value }) => {
                                                    const total = lastMonthSummary.total_income + lastMonthSummary.total_expenses;
                                                    if (total === 0) return '';
                                                    const percentage = Math.round((value / total) * 100);
                                                    return `${percentage}%`;
                                                }}
                                                labelLine={false}
                                                label={{ fill: 'white', fontSize: 11, fontWeight: 'bold' }}
                                            >
                                                <Cell fill="#28a745" />
                                                <Cell fill="#dc3545" />
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Card */}
            <div className="analytics-card">
                <div className="analytics-header">
                    <h2>📊 Financial Analytics</h2>
                    <p>Monthly trends and expense distribution</p>
                </div>
                
                <div className="analytics-grid">
                    <div className="analytics-item wave-chart-item">
                        <div className="analytics-item-header">
                            <h3>📈 Monthly Trends</h3>
                            <div className="wave-chart-filter">
                                <select 
                                    className="wave-filter-select"
                                    value={waveMonth}
                                    onChange={(e) => setWaveMonth(parseInt(e.target.value))}
                                >
                                    <option value={0}>All Months</option>
                                    <option value={1}>Jan</option>
                                    <option value={2}>Feb</option>
                                    <option value={3}>Mar</option>
                                    <option value={4}>Apr</option>
                                    <option value={5}>May</option>
                                    <option value={6}>Jun</option>
                                    <option value={7}>Jul</option>
                                    <option value={8}>Aug</option>
                                    <option value={9}>Sep</option>
                                    <option value={10}>Oct</option>
                                    <option value={11}>Nov</option>
                                    <option value={12}>Dec</option>
                                </select>
                            </div>
                        </div>
                        <MonthlyWaveChart 
                            data={monthlyTrends} 
                            title=""
                        />
                    </div>

                    <div className="expense-distribution">
                        <div className="distribution-header">
                            <div className="distribution-header-top">
                                <div>
                                    <h2>Expense Distribution</h2>
                                </div>
                                <div className="distribution-filter">
                                    <label>Month:</label>
                                    <select 
                                        className="distribution-select"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    >
                                        {months.map((month, index) => (
                                            <option key={index} value={index + 1}>
                                                {month} {selectedYear}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {categoryData.length > 0 ? (
                            <div className="distribution-content">
                                <div className="pie-chart-container">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="total_amount"
                                                nameKey="category_name"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={true}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <p className="no-data">No expense data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions">
                <div className="section-header">
                    <h2>Recent Transactions</h2>
                </div>
                <div className="transactions-list">
                    {recentTransactions.length === 0 ? (
                        <p className="no-transactions">No recent transactions</p>
                    ) : (
                        recentTransactions.map((transaction) => (
                            <div key={transaction.id} className="transaction-item">
                                <div className="transaction-info">
                                    <span className="transaction-icon">{transaction.icon || '💳'}</span>
                                    <div>
                                        <div className="transaction-name">{transaction.category_name || 'Uncategorized'}</div>
                                        <div className="transaction-desc">{transaction.description || 'No description'}</div>
                                    </div>
                                </div>
                                <div className="transaction-amount">
                                    <span className={transaction.type === 'income' ? 'income' : 'expense'}>
                                        {transaction.type === 'income' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
                                    </span>
                                    <span className="transaction-date">
                                        {new Date(transaction.transaction_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <TransactionForm
                isOpen={showTransactionForm}
                onClose={() => setShowTransactionForm(false)}
                onSuccess={() => {
                    setShowTransactionForm(false);
                    fetchDashboardData();
                    fetchLastMonthData();
                    fetchMonthlyTrends(waveMonth);
                }}
                type={transactionType}
            />
        </div>
    );
};

export default Dashboard;