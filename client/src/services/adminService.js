import api from './http-common';

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
  getGlobalStatistics: () => api.get('/admin/statistics'),

  // Archive
  forceArchive: () => api.post('/admin/force-archive'),

  // Stats Dashboard
  getStats: () => api.get('/admin/stats'),

  // CLI SQL
  executeSQL: (data) => api.post('/admin/execute-sql', data)
};
