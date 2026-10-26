import api from './api';

export default {
  validate(payload) { return api.post('/coupons/validate', payload); },
  list() { return api.get('/admin/coupons'); },
  create(payload) { return api.post('/admin/coupons', payload); },
  update(id, payload) { return api.put(`/admin/coupons/${id}`, payload); },
  remove(id) { return api.delete(`/admin/coupons/${id}`); },
};
