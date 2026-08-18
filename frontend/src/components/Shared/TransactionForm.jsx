import React, { useState, useEffect } from 'react';
import { transactionService, categoryService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import './TransactionForm.css';

const TransactionForm = ({ isOpen, onClose, onSuccess, type }) => {
    const { showCredit, showDebit, showError } = useNotification();
    const [formData, setFormData] = useState({
        amount: '',
        type: type || 'expense',
        category_id: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            console.log('📝 TransactionForm opened for type:', type);
            setFormData({
                amount: '',
                type: type || 'expense',
                category_id: '',
                description: '',
                transaction_date: new Date().toISOString().split('T')[0]
            });
            setError('');
            fetchCategories(type || 'expense');
        }
    }, [isOpen, type]);

    const fetchCategories = async (categoryType) => {
        try {
            console.log('📂 Fetching categories for type:', categoryType);
            const response = await categoryService.getByType(categoryType);
            console.log('📂 Categories response:', response.data);
            if (response.data && response.data.success) {
                const categoryList = response.data.categories || [];
                setCategories(categoryList);
                if (categoryList.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        category_id: categoryList[0].id
                    }));
                } else {
                    setError(`No ${categoryType} categories found. Please add a category first.`);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            setError('Failed to load categories');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('📝 Form data before submit:', formData);

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Please enter a valid amount');
            setLoading(false);
            return;
        }

        if (!formData.category_id) {
            setError('Please select a category');
            setLoading(false);
            return;
        }

        if (!formData.transaction_date) {
            setError('Please select a date');
            setLoading(false);
            return;
        }

        try {
            const transactionData = {
                amount: parseFloat(formData.amount),
                type: formData.type,
                category_id: parseInt(formData.category_id),
                description: formData.description || '',
                transaction_date: formData.transaction_date
            };

            console.log('📝 Creating transaction with data:', transactionData);

            const response = await transactionService.create(transactionData);
            console.log('📝 Response:', response.data);

            if (response.data && response.data.success) {
                const formattedAmount = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(transactionData.amount);

                const categoryName = categories.find(c => c.id === parseInt(formData.category_id))?.name || '';

                if (formData.type === 'income') {
                    showCredit(
                        `💰 +${formattedAmount} credited`,
                        `${categoryName} • ${formData.description || 'Income'}`
                    );
                } else {
                    showDebit(
                        `💳 -${formattedAmount} debited`,
                        `${categoryName} • ${formData.description || 'Expense'}`
                    );
                }

                onSuccess();
                onClose();
            } else {
                const errorMsg = response.data?.message || 'Failed to add transaction';
                setError(errorMsg);
                showError('❌ Transaction failed', errorMsg);
            }
        } catch (error) {
            console.error('❌ Error creating transaction:', error);
            console.error('❌ Error response:', error.response?.data);
            
            let errorMsg = 'Failed to add transaction';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            if (error.response?.data?.details) {
                errorMsg += `: ${error.response.data.details}`;
            }
            
            setError(errorMsg);
            showError('❌ Transaction failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add {formData.type === 'income' ? 'Income' : 'Expense'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="transaction-form">
                    {error && <div className="form-error">{error}</div>}

                    {categories.length === 0 && !error && (
                        <div className="form-warning">
                            ⚠️ No categories found. Please add a category first.
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <div className="type-display">
                                <span className={`type-badge ${formData.type}`}>
                                    {formData.type === 'income' ? '💰 Income' : '💳 Expense'}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Amount ($)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0.01"
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="form-select"
                            required
                            disabled={categories.length === 0}
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon || '📌'} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter description..."
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="transaction_date"
                            value={formData.transaction_date}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="form-submit" 
                        disabled={loading || categories.length === 0}
                    >
                        {loading ? 'Adding...' : `Add ${formData.type === 'income' ? 'Income' : 'Expense'}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransactionForm;