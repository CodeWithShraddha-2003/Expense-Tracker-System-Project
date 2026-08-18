import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import './MainLayout.css';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const { notifications, clearNotifications } = useNotification();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const count = notifications.filter(n => !n.read).length;
        setUnreadCount(count);
    }, [notifications]);

    const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
        logout();
        // Force navigation to home page
        window.location.href = '/';
    }
};

    const handleNotificationClick = () => {
    navigate('/notifications');
};

    const handleClearAll = () => {
        clearNotifications();
        setShowDropdown(false);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'credit': return '💰';
            case 'debit': return '💳';
            case 'balance': return '🏦';
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    };

    return (
        <div className={`main-layout ${isDarkMode ? 'dark' : 'light'}`}>
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <h1>💰 Expense Tracker</h1>
                    </div>
                    <div className="header-right">
                        {/* Theme Toggle Button */}
                        <button 
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            aria-label="Toggle Theme"
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>

                        <Link to="/profile" className="nav-link-header">👤 Profile</Link>
                       
                        
                        {/* Notification Bell */}
                        <div className="notification-wrapper">
                            <button 
                                className="notification-bell"
                                onClick={handleNotificationClick}
                                aria-label="Notifications"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="notification-badge">{unreadCount}</span>
                                )}
                                <span className="notification-dot"></span>
                            </button>

                            {/* Notification Dropdown */}
                            {showDropdown && (
                                <div className={`notification-dropdown ${isDarkMode ? 'dark' : ''}`}>
                                    <div className="dropdown-header">
                                        <h4>📬 Notifications</h4>
                                        {notifications.length > 0 && (
                                            <button 
                                                className="clear-all-btn"
                                                onClick={handleClearAll}
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="dropdown-body">
                                        {notifications.length === 0 ? (
                                            <div className="empty-notifications">
                                                <span className="empty-icon">🔔</span>
                                                <p>No notifications yet</p>
                                                <span className="empty-sub">Your notifications will appear here</span>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div 
                                                    key={notification.id} 
                                                    className={`dropdown-item ${notification.read ? 'read' : 'unread'}`}
                                                >
                                                    <span className="item-icon">
                                                        {getNotificationIcon(notification.type)}
                                                    </span>
                                                    <div className="item-content">
                                                        <p className="item-message">{notification.message}</p>
                                                        {notification.subMessage && (
                                                            <span className="item-sub">{notification.subMessage}</span>
                                                        )}
                                                        <span className="item-time">
                                                            {formatTime(notification.timestamp)}
                                                        </span>
                                                    </div>
                                                    {!notification.read && (
                                                        <span className="unread-dot"></span>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="layout-body">
                {/* Sidebar */}
                <aside className={`sidebar ${isDarkMode ? 'dark' : ''}`}>
                    <nav className="sidebar-nav">
                        
                        <Link to="/dashboard" className="nav-link">📊 Dashboard</Link>
                        <Link to="/income" className="nav-link">💰 Income</Link>
                        <Link to="/expenses" className="nav-link">💳 Expenses</Link>
                        <Link to="/categories" className="nav-link">📂 Categories</Link>
                        <Link to="/budgets" className="nav-link">💰 Budgets</Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={`main-content ${isDarkMode ? 'dark' : ''}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;