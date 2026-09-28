import api from './axios';

export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  salesByPeriod: (params) => api.get('/reports/sales-by-period', { params }),
  salesBySeller: (params) => api.get('/reports/sales-by-seller', { params }),
  salesByClient: (params) => api.get('/reports/sales-by-client', { params }),
  topProducts: (params) => api.get('/reports/top-products', { params }),
  pipeline: () => api.get('/reports/pipeline'),
  accountsReceivable: () => api.get('/reports/accounts-receivable'),
  financialSummary: (params) => api.get('/reports/financial-summary', { params }),
};