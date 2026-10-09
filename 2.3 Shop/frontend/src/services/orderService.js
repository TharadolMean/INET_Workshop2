import api from './api';

export default {
  list() {
    return api.get('/orders');
  },
  listByProduct(productId) {
    return api.get(`/products/${productId}/orders`);
  },
  create(productId, quantity) {
    return api.post(`/products/${productId}/orders`, { quantity });
  },
  createOrder(items) {
    return api.post('/orders', { items });
  },
};
