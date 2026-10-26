import api from './api';

export default {
  getProfile() { return api.get('/customers/me'); },
  updateProfile(payload) { return api.patch('/customers/me', payload); },
  listAddresses() { return api.get('/customers/me/addresses'); },
  createAddress(payload) { return api.post('/customers/me/addresses', payload); },
  updateAddress(id, payload) { return api.put(`/customers/me/addresses/${id}`, payload); },
  deleteAddress(id) { return api.delete(`/customers/me/addresses/${id}`); },
};
