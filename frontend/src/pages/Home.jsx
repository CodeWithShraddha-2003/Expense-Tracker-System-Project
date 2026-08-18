import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            {/* Top Bar */}
            <header className="home-header">
                <div className="home-header-content">
                    <div className="home-logo">
                        <span>💰</span>
                        <span className="home-logo-text">Expense Tracker</span>
                    </div>
                    <nav className="home-nav">
                        <Link to="/" className="home-nav-link active">Home</Link>
                        <Link to="/login" className="home-nav-link">Login</Link>
                        <Link to="/register" className="home-nav-link">Register</Link>
                    </nav>
                </div>
            </header>
            {/* Hero Section with Image */}
            <section className="home-hero">
                <div className="home-hero-overlay"></div>
                <div className="home-hero-content">
                    <div className="home-hero-text">
                        <h1>Take Control of Your Finances</h1>
                        <p className="home-hero-subtitle">
                            Track your income and expenses effortlessly with our smart expense tracker.
                            Gain insights into your spending habits and achieve your financial goals.
                        </p>
                        <div className="home-hero-buttons">
                            <Link to="/register" className="home-btn primary">Get Started</Link>
                            <Link to="/login" className="home-btn secondary">Login</Link>
                        </div>
                    </div>
                    
                </div>
            </section>

           
            {/* Features Section */}
            <section className="home-features">
                <h2>Why Choose Expense Tracker?</h2>
                <div className="home-features-grid">
                    <div className="home-feature-card">
                        <div className="home-feature-icon">📊</div>
                        <h3>Visual Analytics</h3>
                        <p>View your spending patterns with interactive charts and graphs.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="home-feature-icon">💰</div>
                        <h3>Income & Expense Tracking</h3>
                        <p>Easily track all your income sources and expenses in one place.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="home-feature-icon">📈</div>
                        <h3>Savings Goals</h3>
                        <p>Set and track your savings goals to achieve financial freedom.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="home-feature-icon">🔐</div>
                        <h3>Secure & Private</h3>
                        <p>Your financial data is encrypted and securely stored.</p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="home-stats">
                <div className="home-stats-grid">
                    <div className="home-stat-item">
                        <span className="home-stat-number">10K+</span>
                        <span className="home-stat-label">Active Users</span>
                    </div>
                    <div className="home-stat-item">
                        <span className="home-stat-number">$50M+</span>
                        <span className="home-stat-label">Tracked</span>
                    </div>
                    <div className="home-stat-item">
                        <span className="home-stat-number">98%</span>
                        <span className="home-stat-label">Satisfaction Rate</span>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="home-cta">
                <div className="home-cta-content">
                    <h2>Start Tracking Today</h2>
                    <p>Join thousands of users who have taken control of their finances.</p>
                    <Link to="/register" className="home-btn primary">Create Free Account</Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="home-footer-content">
                    <p>© 2026 Expense Tracker. All rights reserved.</p>
                    <div className="home-footer-links">
                        <Link to="/">Privacy Policy</Link>
                        <Link to="/">Terms of Service</Link>
                        <Link to="/">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;