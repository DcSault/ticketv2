import api from './http-common';

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
