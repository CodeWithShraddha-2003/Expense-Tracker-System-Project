import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/Shared/ProtectedRoute';
import MainLayout from './components/Layouts/MainLayout';
import AdminLayout from './pages/AdminLayout';


import './styles/global.css';

// Pages
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Income = React.lazy(() => import('./pages/Income'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Budgets = React.lazy(() => import('./pages/Budgets'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const UserDetails = React.lazy(() => import('./pages/UserDetails'));
const AdminCategories = React.lazy(() => import('./pages/AdminCategories'));
const AdminExpenses = React.lazy(() => import('./pages/AdminExpenses'));
const AdminIncome = React.lazy(() => import('./pages/AdminIncome'));
const AdminBudgets = React.lazy(() => import('./pages/AdminBudgets'));
const AdminReport = React.lazy(() => import('./pages/AdminReport'));


const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <React.Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <h2>Loading...</h2>
            </div>
        }>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected User Routes */}
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/income" element={<Income />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UserDetails />} />
                    <Route path="/admin/users/:userId" element={<UserDetails />} />
                     <Route path="/admin/categories" element={<AdminCategories />} /> 
                      <Route path="/admin/expenses" element={<AdminExpenses />} />
                      <Route path="/admin/income" element={<AdminIncome />} /> 
                       <Route path="/admin/budgets" element={<AdminBudgets />} />
                       <Route path="/admin/report" element={<AdminReport />} />
                </Route>
                
                {/* 404 Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </React.Suspense>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <ThemeProvider>
                        <AppRoutes />
                    </ThemeProvider>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;