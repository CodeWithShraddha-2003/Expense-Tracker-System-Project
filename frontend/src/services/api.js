import axios from 'axios';

// CHANGE THIS to match your backend port
const API_URL = 'http://localhost:5000/api';  // or 5001

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth Services
export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (userData) => api.post('/auth/login', userData),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/update', data),
    changePassword: (data) => api.put('/auth/password', data),
};

// Transaction Services
export const transactionService = {
    getAll: (filters) => api.get('/transactions', { params: filters }),
    getById: (id) => api.get(`/transactions/${id}`),
    create: (data) => api.post('/transactions', data),
    update: (id, data) => api.put(`/transactions/${id}`, data),
    delete: (id) => api.delete(`/transactions/${id}`),
    getSummary: (period) => api.get('/transactions/summary', { params: { period } }),
    getCategoryBreakdown: (type, period, month, year) => 
        api.get('/transactions/categories', { params: { type, period, month, year } }),
    getDailyTrends: (type, days) => api.get('/transactions/trends/daily', { params: { type, days } }),
    getMonthlyTrends: (type, months) => api.get('/transactions/trends/monthly', { params: { type, months } }),
};

// Category Services
// Category Services
export const categoryService = {
    getAll: () => api.get('/categories'),
    getByType: (type) => api.get(`/categories/type/${type}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};
// Budget Services
export const budgetService = {
    getAll: () => api.get('/budgets'),
    create: (data) => api.post('/budgets', data),
    update: (id, data) => api.put(`/budgets/${id}`, data),
    delete: (id) => api.delete(`/budgets/${id}`),
};

export default api;