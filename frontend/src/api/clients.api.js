import api from './axios';

export const clientsApi = {
  list: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  remove: (id) => api.delete(`/clients/${id}`),

  // Contactos
  listContacts: (clientId) => api.get(`/clients/${clientId}/contacts`),
  createContact: (clientId, data) => api.post(`/clients/${clientId}/contacts`, data),
  updateContact: (clientId, contactId, data) =>
    api.put(`/clients/${clientId}/contacts/${contactId}`, data),
  deleteContact: (clientId, contactId) =>
    api.delete(`/clients/${clientId}/contacts/${contactId}`),
};