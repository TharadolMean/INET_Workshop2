import api from './api';

export default {
  adjust(payload) {
    return api.post('/inventory/adjustments', payload);
  },
  listAdjustments(params = {}) {
    return api.get('/inventory/adjustments', { params });
  },
};
