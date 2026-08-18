import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        const result = await login(email, password);
        if (result.success) {
            // Get user from localStorage
            const userData = JSON.parse(localStorage.getItem('user'));
            console.log('User role:', userData?.role);
            
            // Redirect based on role
            if (userData?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            {/* Top Bar */}
            <header className="auth-topbar">
                <div className="auth-topbar-content">
                    <div className="auth-topbar-logo">
                        <span>💰</span>
                        <span className="auth-topbar-title">Expense Tracker</span>
                    </div>
                    <nav className="auth-topbar-nav">
                        <Link to="/" className="auth-topbar-link">Home</Link>
                        <Link to="/login" className="auth-topbar-link active">Login</Link>
                        <Link to="/register" className="auth-topbar-link">Register</Link>
                    </nav>
                </div>
            </header>

            {/* Login Form */}
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>💰 Expense Tracker</h1>
                        <h2>Welcome Back</h2>
                        <p>Login to your account</p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="form-group">
                            <label>Role</label>
                            <div className="role-selector">
                                <button
                                    type="button"
                                    className={`role-btn ${role === 'user' ? 'active' : ''}`}
                                    onClick={() => setRole('user')}
                                    disabled={loading}
                                >
                                    👤 User
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                                    onClick={() => setRole('admin')}
                                    disabled={loading}
                                >
                                    👑 Admin
                                </button>
                            </div>
                            <p className="role-hint">
                                {role === 'admin' 
                                    ? '🔑 You are logging in as Admin' 
                                    : '👤 You are logging in as User'}
                            </p>
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account? <Link to="/register">Register</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;