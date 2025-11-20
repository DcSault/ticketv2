import api from './http-common';

export const statisticsService = {
  getStatistics: (params) => api.get('/statistics', { params }),
  exportData: (params) => api.get('/statistics/export', { params })
};
