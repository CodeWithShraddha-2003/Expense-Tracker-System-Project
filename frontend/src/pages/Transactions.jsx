import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import './Transactions.css';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await transactionService.getAll();
            if (response.data.success) {
                setTransactions(response.data.transactions);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
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

    const getFilteredTransactions = () => {
        let filtered = transactions;
        
        if (filter === 'income') {
            filtered = filtered.filter(t => t.type === 'income');
        } else if (filter === 'expense') {
            filtered = filtered.filter(t => t.type === 'expense');
        }
        
        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return filtered;
    };

    const filteredTransactions = getFilteredTransactions();

    if (loading) {
        return <div className="loading">Loading transactions...</div>;
    }

    return (
        <div className="transactions-page">
            <div className="transactions-header">
                <h1>💰 All Transactions</h1>
                <p>View and manage all your transactions</p>
            </div>

            <div className="transactions-filters">
                <div className="filter-buttons">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                    <button className={filter === 'income' ? 'active' : ''} onClick={() => setFilter('income')}>Income</button>
                    <button className={filter === 'expense' ? 'active' : ''} onClick={() => setFilter('expense')}>Expenses</button>
                </div>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="transactions-count">
                Showing {filteredTransactions.length} transactions
            </div>

            <div className="transactions-list-full">
                {filteredTransactions.length === 0 ? (
                    <p className="no-transactions">No transactions found</p>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="transaction-item-full">
                            <div className="transaction-info-full">
                                <span className="transaction-icon-full">{transaction.icon || '💳'}</span>
                                <div>
                                    <div className="transaction-name-full">{transaction.category_name || 'Uncategorized'}</div>
                                    <div className="transaction-desc-full">{transaction.description || 'No description'}</div>
                                    <div className="transaction-date-full">{new Date(transaction.transaction_date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className={`transaction-amount-full ${transaction.type}`}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button className="back-btn" onClick={() => window.location.href = '/'}>
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default Transactions;