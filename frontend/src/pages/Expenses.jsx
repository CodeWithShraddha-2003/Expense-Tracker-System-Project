import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TransactionForm from '../components/Shared/TransactionForm';
import './Expenses.css';

const Expenses = () => {
    const [expenseData, setExpenseData] = useState([]);
    const [summary, setSummary] = useState({
        total_expenses: 0,
        average_expense: 0,
        total_transactions: 0
    });
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [chartData, setChartData] = useState([]);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [transactionType, setTransactionType] = useState('expense');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchExpenseData();
    }, []);

    useEffect(() => {
        if (expenseData.length > 0) {
            filterDataByPeriod();
        }
    }, [period, expenseData]);

    const fetchExpenseData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📊 Fetching expenses...');
            
            // Get ALL transactions first, then filter by type
            const response = await transactionService.getAll();
            console.log('📊 Full response:', response.data);
            
            if (response.data && response.data.success) {
                const allTransactions = response.data.transactions || [];
                console.log('📊 All transactions:', allTransactions.length);
                
                // Filter only expense transactions
                const expenses = allTransactions.filter(t => 
                    t.type === 'expense' || t.type === 'Expense'
                );
                console.log('📊 Expenses found:', expenses.length);
                console.log('📊 First expense:', expenses[0]);
                
                setExpenseData(expenses);
                filterDataByPeriod(expenses);
            } else {
                setError('Failed to fetch expenses');
                console.error('❌ API returned error:', response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching expense data:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const filterDataByPeriod = (data = expenseData) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentDate = now.getDate();

        let filtered = [];
        let chartLabels = [];
        let chartValues = [];

        if (period === 'day') {
            filtered = data.filter(t => {
                if (!t.transaction_date) return false;
                const date = new Date(t.transaction_date);
                return date.getDate() === currentDate && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            });
            const hourMap = {};
            filtered.forEach(t => {
                const date = new Date(t.transaction_date);
                const hour = date.getHours();
                const key = `${hour}:00`;
                hourMap[key] = (hourMap[key] || 0) + parseFloat(t.amount || 0);
            });
            chartLabels = Object.keys(hourMap);
            chartValues = Object.values(hourMap);

        } else if (period === 'week') {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            filtered = data.filter(t => {
                if (!t.transaction_date) return false;
                const date = new Date(t.transaction_date);
                return date >= weekStart && date <= now;
            });
            const dayMap = {};
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            filtered.forEach(t => {
                const date = new Date(t.transaction_date);
                const key = days[date.getDay()];
                dayMap[key] = (dayMap[key] || 0) + parseFloat(t.amount || 0);
            });
            chartLabels = days;
            chartValues = days.map(d => dayMap[d] || 0);

        } else if (period === 'month') {
            filtered = data.filter(t => {
                if (!t.transaction_date) return false;
                const date = new Date(t.transaction_date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });
            const dayMap = {};
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            filtered.forEach(t => {
                const date = new Date(t.transaction_date);
                const key = date.getDate();
                dayMap[key] = (dayMap[key] || 0) + parseFloat(t.amount || 0);
            });
            chartLabels = Array.from({length: daysInMonth}, (_, i) => i + 1);
            chartValues = chartLabels.map(d => dayMap[d] || 0);

        } else if (period === 'year') {
            filtered = data.filter(t => {
                if (!t.transaction_date) return false;
                const date = new Date(t.transaction_date);
                return date.getFullYear() === currentYear;
            });
            const monthMap = {};
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            filtered.forEach(t => {
                const date = new Date(t.transaction_date);
                const key = months[date.getMonth()];
                monthMap[key] = (monthMap[key] || 0) + parseFloat(t.amount || 0);
            });
            chartLabels = months;
            chartValues = months.map(m => monthMap[m] || 0);
        }

        setFilteredData(filtered);

        const total = filtered.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const count = filtered.length;
        setSummary({
            total_expenses: total || 0,
            average_expense: count > 0 ? (total / count) : 0,
            total_transactions: count
        });

        const chartData = chartLabels.map((label, index) => ({
            name: String(label),
            value: chartValues[index] || 0
        }));
        setChartData(chartData);
    };

    const formatCurrency = (amount) => {
        if (isNaN(amount) || amount === null || amount === undefined) {
            return '$0.00';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getPeriodLabel = () => {
        switch(period) {
            case 'day': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'year': return 'This Year';
            default: return '';
        }
    };

    const getChartTitle = () => {
        switch(period) {
            case 'day': return 'Hourly Expenses';
            case 'week': return 'Daily Expenses';
            case 'month': return 'Daily Expenses';
            case 'year': return 'Monthly Expenses';
            default: return '';
        }
    };

    if (loading) {
        return <div className="loading">Loading expense data...</div>;
    }

    if (error) {
        return <div className="error-message">⚠️ {error}</div>;
    }

    return (
        <div className="expenses-page">
            <div className="expenses-header">
                <h1>💳 Expenses</h1>
                <p className="expenses-subtitle">Track and manage your expenses</p>
            </div>

            {/* Period Filter */}
            <div className="period-filter">
              
                <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Weekly</button>
                <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Monthly</button>
                <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Yearly</button>
            </div>

            {/* Summary Cards */}
            <div className="expenses-summary-cards">
                <div className="expenses-summary-card">
                    <div className="expenses-summary-label">Total Expenses</div>
                    <div className="expenses-summary-value">{formatCurrency(summary.total_expenses)}</div>
                    <div className="expenses-summary-sub">📅 {getPeriodLabel()}</div>
                </div>

                <div className="expenses-summary-card">
                    <div className="expenses-summary-label">Average Expense</div>
                    <div className="expenses-summary-value">{formatCurrency(summary.average_expense)}</div>
                    <div className="expenses-summary-sub">📊 {summary.total_transactions} transactions</div>
                </div>

                <div className="expenses-summary-card">
                    <div className="expenses-summary-label">Transactions</div>
                    <div className="expenses-summary-value">{summary.total_transactions}</div>
                    <div className="expenses-summary-sub">📋 {getPeriodLabel()} records</div>
                </div>
            </div>

            {/* Expenses Chart */}
            <div className="expenses-chart-container">
                <div className="chart-header">
                    <h2>📊 {getChartTitle()} <span className="chart-period">({getPeriodLabel()})</span></h2>
                </div>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Expense']} cursor={{ fill: 'rgba(220, 53, 69, 0.05)' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Bar dataKey="value" name="Expenses" fill="#dc3545" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expenses List with Add Button */}
            <div className="expenses-list-container">
                <div className="expenses-list-header">
                    <h2>Expense Transactions</h2>
                    <div className="expenses-list-actions">
                        <button 
                            className="add-expense-btn"
                            onClick={() => {
                                setTransactionType('expense');
                                setShowTransactionForm(true);
                            }}
                        >
                            + Add Expense
                        </button>
                        <span className="expenses-count">{filteredData.length} records</span>
                    </div>
                </div>
                <div className="expenses-list">
                    {filteredData.length === 0 ? (
                        <p className="no-expenses">No expense records found</p>
                    ) : (
                        filteredData.map((expense) => (
                            <div key={expense.id} className="expense-item">
                                <div className="expense-item-left">
                                    <span className="expense-item-icon">
                                        {expense.icon || '💳'}
                                    </span>
                                    <div>
                                        <div className="expense-item-name">
                                            {expense.category_name || 'Uncategorized'}
                                        </div>
                                        <div className="expense-item-desc">
                                            {expense.description || 'No description'}
                                        </div>
                                    </div>
                                </div>
                                <div className="expense-item-right">
                                    <span className="expense-item-amount">
                                        -{formatCurrency(expense.amount)}
                                    </span>
                                    <span className="expense-item-date">
                                        {new Date(expense.transaction_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Transaction Form Modal */}
            <TransactionForm
                isOpen={showTransactionForm}
                onClose={() => setShowTransactionForm(false)}
                onSuccess={() => {
                    setShowTransactionForm(false);
                    fetchExpenseData();
                }}
                type={transactionType}
            />
        </div>
    );
};

export default Expenses;