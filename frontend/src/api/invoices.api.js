import api from './axios';

export const invoicesApi = {
  list: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  createFromOrder: (data) => api.post('/invoices', data),
  registerPayment: (id, data) => api.post(`/invoices/${id}/payments`, data),
  listPayments: (id) => api.get(`/invoices/${id}/payments`),
  void: (id, reason) => api.patch(`/invoices/${id}/void`, { reason }),
};