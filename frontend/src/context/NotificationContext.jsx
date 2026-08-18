import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Shared/Notification';
import '../components/Shared/Notification.css';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);

    // Add notification
    const addNotification = useCallback((message, type = 'success', subMessage = '') => {
        const id = Date.now();
        const newNotification = {
            id,
            message,
            type,
            subMessage,
            timestamp: Date.now(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
        setToasts(prev => [...prev, { id, message, type, subMessage }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(n => n.id !== id));
        }, 5000);
        return id;
    }, []);

    // Mark notification as read
    const markAsRead = useCallback((id) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Remove a toast
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(n => n.id !== id));
    }, []);

    // Notification helper functions
    const showCredit = (message, subMessage = '') => addNotification(message, 'credit', subMessage);
    const showDebit = (message, subMessage = '') => addNotification(message, 'debit', subMessage);
    const showBalance = (message, subMessage = '') => addNotification(message, 'balance', subMessage);
    const showSuccess = (message, subMessage = '') => addNotification(message, 'success', subMessage);
    const showError = (message, subMessage = '') => addNotification(message, 'error', subMessage);
    const showInfo = (message, subMessage = '') => addNotification(message, 'info', subMessage);

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            clearNotifications,
            removeToast,
            showCredit,
            showDebit,
            showBalance,
            showSuccess,
            showError,
            showInfo
        }}>
            {children}
            <div className="notification-container">
                {toasts.map(({ id, message, type, subMessage }) => (
                    <Notification
                        key={id}
                        message={message}
                        type={type}
                        subMessage={subMessage}
                        onClose={() => removeToast(id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;