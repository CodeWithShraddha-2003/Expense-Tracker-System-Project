import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalCategories: 0
    });
    const [error, setError] = useState(null);

    // Check admin access - WAIT for auth to load
    useEffect(() => {
        // Wait for authentication to finish loading
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }
            if (!currentUser || currentUser.role !== 'admin') {
                navigate('/dashboard');
                return;
            }
            // User is admin, fetch data
            fetchDashboardStats();
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

   const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
        console.log('📊 Fetching dashboard stats...');
        console.log('🔑 Token:', localStorage.getItem('token'));
        
        const response = await api.get('/admin/dashboard-stats');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', response.data);
        
        if (response.data && response.data.success) {
            setStats({
                totalUsers: response.data.stats.totalUsers || 0,
                totalIncome: response.data.stats.totalIncome || 0,
                totalExpenses: response.data.stats.totalExpenses || 0,
                totalCategories: response.data.stats.totalCategories || 0
            });
            console.log('✅ Stats loaded:', response.data.stats);
        } else {
            setError('Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        console.error('❌ Error response:', error.response);
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

    // Show loading while auth is loading
    if (authLoading || loading) {
        return (
            <div className={`admin-loading ${isDarkMode ? 'dark' : ''}`}>
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className={`admin-dashboard ${isDarkMode ? 'dark' : ''}`}>
            <div className="dashboard-container">
                <div className="overview-header">
                    <h1>Overview</h1>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>⚠️ {error}</p>}
                </div>

                <div className="stats-grid">
                    <div className="stat-card users">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <span className="stat-number">{stats.totalUsers}</span>
                            <span className="stat-label">Total Users</span>
                        </div>
                    </div>

                    <div className="stat-card income">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <span className="stat-number">{formatCurrency(stats.totalIncome)}</span>
                            <span className="stat-label">Total Income</span>
                        </div>
                    </div>

                    <div className="stat-card expenses">
                        <div className="stat-icon">💳</div>
                        <div className="stat-content">
                            <span className="stat-number">{formatCurrency(stats.totalExpenses)}</span>
                            <span className="stat-label">Total Expenses</span>
                        </div>
                    </div>

                    <div className="stat-card categories">
                        <div className="stat-icon">📂</div>
                        <div className="stat-content">
                            <span className="stat-number">{stats.totalCategories}</span>
                            <span className="stat-label">Total Categories</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;