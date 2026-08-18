import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AdminLayout.css';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    // Check if link is active - FIXED
    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path);
    };

    // Check if dashboard is active (only when no other admin route is active)
    const isDashboardActive = () => {
        const path = location.pathname;
        return path === '/admin' || 
               path === '/admin/dashboard' || 
               (path.startsWith('/admin') && 
                !path.startsWith('/admin/users') && 
                !path.startsWith('/admin/categories') && 
                !path.startsWith('/admin/expenses') && 
                !path.startsWith('/admin/income') && 
                !path.startsWith('/admin/budgets'));
    };

    console.log('📍 Current path:', location.pathname); // Debug log

    return (
        <div className={`admin-layout ${isDarkMode ? 'dark' : ''}`}>
            <header className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-logo">
                        <h1>👑 Admin Panel</h1>
                    </div>
                    <div className="admin-header-right">
                        <button 
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            aria-label="Toggle Theme"
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
                        <span className="admin-user">👋 {user?.full_name}</span>
                        <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
                    </div>
                </div>
            </header>

            <div className="admin-layout-body">
                <aside className={`admin-sidebar ${isDarkMode ? 'dark' : ''}`}>
                    <nav className="admin-sidebar-nav">
                        <Link to="/admin" className={`admin-nav-link ${isDashboardActive() ? 'active' : ''}`}>
                            <span className="nav-icon">📊</span>
                            Dashboard
                        </Link>
                        <Link to="/admin/users" className={`admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
                            <span className="nav-icon">👤</span>
                            Users
                        </Link>
                        <Link to="/admin/categories" className={`admin-nav-link ${isActive('/admin/categories') ? 'active' : ''}`}>
                            <span className="nav-icon">📂</span>
                            Categories
                        </Link>
                        <Link to="/admin/expenses" className={`admin-nav-link ${isActive('/admin/expenses') ? 'active' : ''}`}>
                            <span className="nav-icon">💳</span>
                            Expenses
                        </Link>
                        <Link to="/admin/income" className={`admin-nav-link ${isActive('/admin/income') ? 'active' : ''}`}>
                            <span className="nav-icon">💰</span>
                            Income
                        </Link>
                        <Link to="/admin/budgets" className={`admin-nav-link ${isActive('/admin/budgets') ? 'active' : ''}`}>
                            <span className="nav-icon">📊</span>
                            Budgets
                        </Link>
                        <Link to="/admin/report" className={`admin-nav-link ${isActive('/admin/report') ? 'active' : ''}`}>
    <span className="nav-icon">📊</span>
    Report
</Link>
                    </nav>
                </aside>

                <main className={`admin-main-content ${isDarkMode ? 'dark' : ''}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;