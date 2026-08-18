import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        const { full_name, email, password, confirmPassword } = formData;

        if (!full_name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        const result = await register({ full_name, email, password });
        if (result.success) {
            setSuccessMessage('✅ Registration successful! Please login.');
            setFormData({ full_name: '', email: '', password: '', confirmPassword: '' });
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            {/* Top Bar - Same as Home Page */}
            <header className="auth-topbar">
                <div className="auth-topbar-content">
                    <div className="auth-topbar-logo">
                        <span>💰</span>
                        <span className="auth-topbar-title">Expense Tracker</span>
                    </div>
                    <nav className="auth-topbar-nav">
                        <Link to="/" className="auth-topbar-link">Home</Link>
                        <Link to="/login" className="auth-topbar-link">Login</Link>
                        <Link to="/register" className="auth-topbar-link active">Register</Link>
                    </nav>
                </div>
            </header>

            {/* Register Form */}
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>💰 Expense Tracker</h1>
                        <h2>Create Account</h2>
                        <p>Start tracking your expenses today</p>
                    </div>

                    {error && <div className="auth-error">{error}</div>}
                    {successMessage && <div className="auth-success">{successMessage}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password (min 6 characters)"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;