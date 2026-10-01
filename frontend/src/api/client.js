import axios from 'axios';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skybook_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If expired token, clear and prompt login if not on public routes
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/') {
        localStorage.removeItem('skybook_token');
        localStorage.removeItem('skybook_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
};

export const flightsApi = {
  search: (from, to, date, passengers = 1) =>
    apiClient.get(`/flights/search`, {
      params: { from, to, date, passengers },
    }),
  getById: (id) => apiClient.get(`/flights/${id}`),
};

export const bookingsApi = {
  create: (bookingData) => apiClient.post('/bookings', bookingData),
  getMyBookings: () => apiClient.get('/bookings/me'),
  getByPnr: (pnr) => apiClient.get(`/bookings/${pnr}`),
};

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getUserEngagement: (userId) => apiClient.get(`/admin/users/${userId}/engagement`),
  getLoginLogs: (params) => apiClient.get('/admin/login-logs', { params }),
  getSearchLogs: (params) => apiClient.get('/admin/search-logs', { params }),
  getBookings: (params) => apiClient.get('/admin/bookings', { params }),
  getTransactions: (params) => apiClient.get('/admin/transactions', { params }),
};

export default apiClient;
