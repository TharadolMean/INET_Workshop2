import api from './api';

export default {
  exportOrders(params = {}) {
    return api.get('/admin/reports/orders.csv', { params, responseType: 'blob' });
  },
};
