import api from './axios';

export const quotesApi = {
  list: (params) => api.get('/quotes', { params }),
  getById: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  changeStatus: (id, status) => api.patch(`/quotes/${id}/status`, { status }),
  convert: (id) => api.post(`/quotes/${id}/convert`),
  remove: (id) => api.delete(`/quotes/${id}`),
};