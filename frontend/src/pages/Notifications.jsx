import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
    const { notifications, markAsRead, clearNotifications } = useNotification();
    const [filter, setFilter] = useState('all');
    const [selectedNotifications, setSelectedNotifications] = useState([]);

    // In Notifications.jsx, update the useEffect:
useEffect(() => {
    // Only run if markAsRead exists
    if (markAsRead) {
        notifications.forEach(n => {
            if (!n.read) {
                markAsRead(n.id);
            }
        });
    }
}, []);

    const getFilteredNotifications = () => {
        if (filter === 'unread') {
            return notifications.filter(n => !n.read);
        }
        return notifications;
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

    const getNotificationColor = (type) => {
        switch(type) {
            case 'credit': return '#28a745';
            case 'debit': return '#dc3545';
            case 'balance': return '#667eea';
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'info': return '#17a2b8';
            default: return '#667eea';
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return formatDate(timestamp);
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <div className="notifications-header-content">
                    <div className="notifications-header-icon">
                        <span>🔔</span>
                    </div>
                    <div className="notifications-header-text">
                        <h1>My Notifications</h1>
                        
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="notifications-filters">
                <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({notifications.length})
                </button>
                
                {notifications.length > 0 && (
                    <button 
                        className="clear-all-btn"
                        onClick={() => {
                            if (window.confirm('Clear all notifications?')) {
                                clearNotifications();
                            }
                        }}
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="notifications-list">
                {filteredNotifications.length === 0 ? (
                    <div className="empty-notifications">
                        <span className="empty-icon">🔔</span>
                        <h3>No notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        >
                            <div className="notification-icon" style={{ background: getNotificationColor(notification.type) + '20' }}>
                                <span>{getNotificationIcon(notification.type)}</span>
                            </div>
                            <div className="notification-content">
                                <div className="notification-top">
                                    <h3>"Dear Customer, Your Account has been {notification.message} "</h3>
                                    {!notification.read && (
                                        <span className="new-badge">New</span>
                                    )}
                                </div>
                             {notification.subMessage && (
                                    <p className="notification-sub">{notification.subMessage}</p>
                                )}
                                <div className="notification-footer">
                                    <span className="notification-time">
                                        Received: {formatDate(notification.timestamp)}
                                    </span>
                                    <div className="notification-actions">
                                        {!notification.read && (
                                            <button 
                                                className="mark-read-btn"
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;