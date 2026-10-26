import api from './api';

export default {
  list(productId) { return api.get(`/products/${productId}/reviews`); },
  save(productId, payload) { return api.post(`/products/${productId}/reviews`, payload); },
  update(id, payload) { return api.put(`/reviews/${id}`, payload); },
  remove(id) { return api.delete(`/reviews/${id}`); },
};
