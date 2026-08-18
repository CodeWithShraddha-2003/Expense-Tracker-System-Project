import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TransactionForm from '../components/Shared/TransactionForm';
import './Income.css';

const Income = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [incomeData, setIncomeData] = useState([]);
    const [summary, setSummary] = useState({
        total_income: 0,
        average_income: 0,
        total_transactions: 0
    });
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [chartData, setChartData] = useState([]);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [transactionType, setTransactionType] = useState('income');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                return;
            }
            fetchIncomeData();
        }
    }, [authLoading, isAuthenticated]);

    useEffect(() => {
        if (incomeData.length > 0) {
            filterDataByPeriod();
        }
    }, [period, incomeData]);

    const fetchIncomeData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('📊 Fetching income data...');
            const response = await transactionService.getAll();
            console.log('📊 Response:', response.data);
            
            if (response.data && response.data.success) {
                const allTransactions = response.data.transactions || [];
                const allIncome = allTransactions.filter(t => 
                    t.type === 'income' || t.type === 'Income'
                );
                console.log('✅ Income transactions:', allIncome.length);
                setIncomeData(allIncome);
                filterDataByPeriod(allIncome);
            } else {
                setError('Failed to fetch income data');
            }
        } catch (error) {
            console.error('❌ Error fetching income data:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const filterDataByPeriod = (data = incomeData) => {
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
            total_income: total || 0,
            average_income: count > 0 ? (total / count) : 0,
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
            case 'day': return 'Hourly Income';
            case 'week': return 'Daily Income';
            case 'month': return 'Daily Income';
            case 'year': return 'Monthly Income';
            default: return '';
        }
    };

    // ✅ Handle Add Income button click
    const handleAddIncome = () => {
        console.log('➕ Opening Add Income form...');
        setTransactionType('income');
        setShowTransactionForm(true);
    };

    // ✅ Handle successful transaction
    const handleTransactionSuccess = () => {
        console.log('✅ Transaction successful, refreshing data...');
        setShowTransactionForm(false);
        fetchIncomeData();
    };

    if (authLoading || loading) {
        return <div className="loading">Loading income data...</div>;
    }

    if (error) {
        return <div className="error-message">⚠️ {error}</div>;
    }

    return (
        <div className="income-page">
            <div className="income-header">
                <h1>💰 Income</h1>
                <p className="income-subtitle">Track and manage your income sources</p>
            </div>

            {/* Period Filter */}
            <div className="period-filter">
                <button className={period === 'day' ? 'active' : ''} onClick={() => setPeriod('day')}>Daily</button>
                <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Weekly</button>
                <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Monthly</button>
                <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Yearly</button>
            </div>

            {/* Summary Cards */}
            <div className="income-summary-cards">
                <div className="income-summary-card">
                    <div className="income-summary-label">Total Income</div>
                    <div className="income-summary-value">{formatCurrency(summary.total_income)}</div>
                    <div className="income-summary-sub">📅 {getPeriodLabel()}</div>
                </div>

                <div className="income-summary-card">
                    <div className="income-summary-label">Average Income</div>
                    <div className="income-summary-value">{formatCurrency(summary.average_income)}</div>
                    <div className="income-summary-sub">📊 {summary.total_transactions} transactions</div>
                </div>

                <div className="income-summary-card">
                    <div className="income-summary-label">Transactions</div>
                    <div className="income-summary-value">{summary.total_transactions}</div>
                    <div className="income-summary-sub">📋 {getPeriodLabel()} records</div>
                </div>
            </div>

            {/* Income Chart */}
            <div className="income-chart-container">
                <div className="chart-header">
                    <h2>📊 {getChartTitle()} <span className="chart-period">({getPeriodLabel()})</span></h2>
                </div>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Income']} cursor={{ fill: 'rgba(102, 126, 234, 0.05)' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Bar dataKey="value" name="Income" fill="#667eea" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Income List with Add Button */}
            <div className="income-list-container">
                <div className="income-list-header">
                    <h2>Income Transactions</h2>
                    <div className="income-list-actions">
                        <button 
                            className="add-income-btn"
                            onClick={handleAddIncome}
                        >
                            + Add Income
                        </button>
                        <span className="income-count">{filteredData.length} records</span>
                    </div>
                </div>
                <div className="income-list">
                    {filteredData.length === 0 ? (
                        <p className="no-income">No income records found</p>
                    ) : (
                        filteredData.map((income) => (
                            <div key={income.id} className="income-item">
                                <div className="income-item-left">
                                    <span className="income-item-icon">{income.icon || '💵'}</span>
                                    <div>
                                        <div className="income-item-name">{income.category_name || 'Uncategorized'}</div>
                                        <div className="income-item-desc">{income.description || 'No description'}</div>
                                    </div>
                                </div>
                                <div className="income-item-right">
                                    <span className="income-item-amount">+{formatCurrency(income.amount)}</span>
                                    <span className="income-item-date">{new Date(income.transaction_date).toLocaleDateString()}</span>
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
                onSuccess={handleTransactionSuccess}
                type={transactionType}
            />
        </div>
    );
};

export default Income;