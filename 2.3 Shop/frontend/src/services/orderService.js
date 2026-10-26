import api from './api';

export default {
  listMine() {
    return api.get('/orders/mine');
  },
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
  cancel(id) {
    return api.post(`/orders/${id}/cancel`);
  },
  updateStatus(id, status, note = '') {
    return api.patch(`/orders/${id}/status`, { status, note });
  },
  listMovements(filters = {}) {
    return api.get('/inventory/movements', { params: filters });
  },
};
