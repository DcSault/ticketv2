import axios from 'axios';

const API_URL = '/api';

// Configuration axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
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

// Auth
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// Calls
export const callService = {
  getCalls: (params) => {
    // Convertir includeArchived en string 'true' si nécessaire
    const queryParams = {...params};
    if (queryParams.includeArchived !== undefined) {
      queryParams.archived = queryParams.includeArchived ? 'true' : 'false';
      delete queryParams.includeArchived;
    }
    // Pour l'export, on peut demander tous les appels
    if (queryParams.all) {
      queryParams.limit = 'all';
      delete queryParams.all;
    }
    return api.get('/calls', { params: queryParams });
  },
  createCall: (data) => api.post('/calls', data),
  updateCall: (id, data) => api.put(`/calls/${id}`, data),
  deleteCall: (id) => api.delete(`/calls/${id}`),
  archiveCall: (id) => api.post(`/calls/${id}/archive`),
  unarchiveCall: (id) => api.post(`/calls/${id}/unarchive`),
  getSuggestions: (type) => api.get(`/calls/suggestions/${type}`),
  getQuickSuggestions: () => api.get('/calls/quick-suggestions')
};

// Statistics
export const statisticsService = {
  getStatistics: (params) => api.get('/statistics', { params }),
  exportData: (params) => api.get('/statistics/export', { params })
};

// Admin
export const adminService = {
  // Tenants
  getTenants: () => api.get('/admin/tenants'),
  createTenant: (data) => api.post('/admin/tenants', data),
  updateTenant: (id, data) => api.put(`/admin/tenants/${id}`, data),
  deleteTenant: (id) => api.delete(`/admin/tenants/${id}`),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Import
  importCalls: (formData) => {
    return api.post('/admin/import-calls', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Export
  exportCalls: (params) => api.get('/calls', { params }),

  // Statistics
  getGlobalStatistics: () => api.get('/admin/statistics')
};

export default api;
