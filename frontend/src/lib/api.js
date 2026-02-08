import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const isAdminRoute = config.url?.includes('/admin');
  const token = isAdminRoute 
    ? localStorage.getItem('gembot_admin_token')
    : localStorage.getItem('gembot_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdmin = error.config?.url?.includes('/admin');
      if (isAdmin) {
        localStorage.removeItem('gembot_admin_token');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('gembot_token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  completeProfile: (data, referralCode) => 
    api.post(`/auth/complete-profile${referralCode ? `?referral_code=${referralCode}` : ''}`, data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getDashboard: () => api.get('/user/dashboard'),
  getTeam: () => api.get('/user/team'),
  getIncome: () => api.get('/user/income'),
  getWallet: () => api.get('/user/wallet'),
  withdraw: (data) => api.post('/user/withdraw', data),
  checkActivation: () => api.post('/user/check-activation'),
  getTransactions: () => api.get('/user/transactions'),
};

// Admin APIs
export const adminAPI = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (skip = 0, limit = 50) => api.get(`/admin/users?skip=${skip}&limit=${limit}`),
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  getLevels: () => api.get('/admin/settings/levels'),
  updateLevels: (levels) => api.put('/admin/settings/levels', levels),
  getSubscription: () => api.get('/admin/settings/subscription'),
  updateSubscription: (data) => api.put('/admin/settings/subscription', data),
  getSMTP: () => api.get('/admin/settings/smtp'),
  updateSMTP: (data) => api.put('/admin/settings/smtp', data),
  getCoinConnect: () => api.get('/admin/settings/coinconnect'),
  updateCoinConnect: (data) => api.put('/admin/settings/coinconnect', data),
  getEmailTemplates: () => api.get('/admin/email-templates'),
  updateEmailTemplate: (type, data) => api.put(`/admin/email-templates/${type}`, data),
  getTransactions: (skip = 0, limit = 50, type = null) => 
    api.get(`/admin/transactions?skip=${skip}&limit=${limit}${type ? `&type=${type}` : ''}`),
  updateContent: (type, content) => api.put(`/admin/content/${type}`, { content }),
};

// Public APIs
export const publicAPI = {
  getTerms: () => api.get('/public/terms'),
  getPrivacy: () => api.get('/public/privacy'),
};

export default api;
