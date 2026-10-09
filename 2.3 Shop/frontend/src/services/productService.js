import api from './api';

export default {
  list() {
    return api.get('/products');
  },
  get(id) {
    return api.get(`/products/${id}`);
  },
  create(payload) {
    return api.post('/products', payload);
  },
  update(id, payload) {
    return api.put(`/products/${id}`, payload);
  },
  remove(id) {
    return api.delete(`/products/${id}`);
  },
};
