require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REGISTER ROUTES WITH LOGS
console.log('📦 Registering routes...');

app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered at /api/auth');

app.use('/api/transactions', transactionRoutes);
console.log('✅ Transaction routes registered at /api/transactions');

app.use('/api/categories', categoryRoutes);
console.log('✅ Category routes registered at /api/categories');

app.use('/api/budgets', budgetRoutes);
console.log('✅ Budget routes registered at /api/budgets');

app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes registered at /api/admin');

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: '✅ API is working!' });
});

// 404 handler - MOVE THIS TO THE END
app.use((req, res) => {
    console.log('❌ Route not found:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📡 API Test: http://localhost:${PORT}/api/test`);
});