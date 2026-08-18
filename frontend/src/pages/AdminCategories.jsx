import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminCategories.css';

const AdminCategories = () => {
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'expense'
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
            fetchCategories();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/categories');
            if (response.data && response.data.success) {
                setCategories(response.data.categories || []);
            } else {
                setError('Failed to load categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const response = await api.post('/categories', formData);
            if (response.data && response.data.success) {
                setSuccess('Category added successfully!');
                setFormData({ name: '', type: 'expense' });
                setShowForm(false);
                fetchCategories();
            } else {
                setError(response.data?.message || 'Failed to add category');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const response = await api.put(`/categories/${editingCategory.id}`, formData);
            if (response.data && response.data.success) {
                setSuccess('Category updated successfully!');
                setEditingCategory(null);
                setFormData({ name: '', type: 'expense' });
                setShowForm(false);
                fetchCategories();
            } else {
                setError(response.data?.message || 'Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const response = await api.delete(`/categories/${id}`);
            if (response.data && response.data.success) {
                setSuccess('Category deleted successfully!');
                fetchCategories();
            } else {
                setError(response.data?.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            setError(error.response?.data?.message || error.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            type: category.type
        });
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingCategory(null);
        setFormData({ name: '', type: 'expense' });
        setError(null);
        setSuccess(null);
    };

    const filteredCategories = categories.filter(cat => {
        if (filterType === 'all') return true;
        return cat.type === filterType;
    });

    const incomeCount = categories.filter(c => c.type === 'income').length;
    const expenseCount = categories.filter(c => c.type === 'expense').length;

    if (authLoading || loading) {
        return (
            <div className={`admin-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="spinner"></div>
                <p>Loading categories...</p>
            </div>
        );
    }

    return (
        <div className={`admin-categories ${isDarkMode ? 'dark' : ''}`}>
            <div className="categories-container">
                <div className="categories-header">
                    <div>
                        <h1>📂 Category Management</h1>
                        <p>Manage income and expense categories</p>
                    </div>
                    <button 
                        className="add-category-btn"
                        onClick={() => {
                            setShowForm(true);
                            setEditingCategory(null);
                            setFormData({ name: '', type: 'expense' });
                        }}
                    >
                        + Add Category
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {showForm && (
                    <div className="category-form-container">
                        <h2>{editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}</h2>
                        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
                            <div className="form-group">
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter category name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category Type *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    required
                                >
                                    <option value="expense">💳 Expense</option>
                                    <option value="income">💰 Income</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={handleCancelForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stats */}
                <div className="categories-stats">
                    <div className="stat-item">
                        <span className="stat-label">📊 Total</span>
                        <span className="stat-value">{categories.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">💰 Income</span>
                        <span className="stat-value">{incomeCount}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">💳 Expense</span>
                        <span className="stat-value">{expenseCount}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="filter-tabs">
                    <button 
                        className={filterType === 'all' ? 'active' : ''}
                        onClick={() => setFilterType('all')}
                    >
                        All ({categories.length})
                    </button>
                    <button 
                        className={filterType === 'income' ? 'active' : ''}
                        onClick={() => setFilterType('income')}
                    >
                        💰 Income ({incomeCount})
                    </button>
                    <button 
                        className={filterType === 'expense' ? 'active' : ''}
                        onClick={() => setFilterType('expense')}
                    >
                        💳 Expense ({expenseCount})
                    </button>
                </div>

                {/* Table */}
                <div className="categories-table-wrapper">
                    <table className="categories-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                    <tr key={category.id}>
                                        <td>#{category.id}</td>
                                        <td>{category.name}</td>
                                        <td>
                                            <span className={`badge ${category.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                                                {category.type === 'income' ? '💰 Income' : '💳 Expense'}
                                            </span>
                                        </td>
                                        <td>{new Date(category.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                className="edit-btn"
                                                onClick={() => handleEditClick(category)}
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-data">No categories found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCategories;