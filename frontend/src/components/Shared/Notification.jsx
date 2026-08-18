import React, { useState, useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type, onClose, subMessage }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) setTimeout(onClose, 300);
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!isVisible) return null;

    return (
        <div className={`notification notification-${type}`}>
            <div className="notification-content">
                <p className="notification-message">{message}</p>
                {subMessage && <p className="notification-sub">{subMessage}</p>}
            </div>
            <button className="notification-close" onClick={() => { setIsVisible(false); if (onClose) setTimeout(onClose, 300); }}>
                ×
            </button>
        </div>
    );
};

export default Notification;